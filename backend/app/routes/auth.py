from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity,get_jwt
from flask_mail import Message
from app.database import db
from app.models import Students,Admin_Users,Placed_Students,Companies,Jobs
from app import mail, bcrypt
from app.utils import save_file
from datetime import datetime
import json
import os
import re
import redis 
import random
from dotenv import load_dotenv
load_dotenv()


main = Blueprint('auth', __name__) 

# Register TPO
@main.route('/tpo/register', methods=['POST'])
def register_tpo():
    data = request.get_json()
    # Required fields validation
    required_fields = ['admin_name', 'email', 'password', 'department','role']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'message': f'{field.capitalize()} is required'}), 400

    email = data.get('email')
    if not email:
        return jsonify({'message': 'Email is required'}), 400

    # Validate email format (you can adjust this regex as needed)
    # if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
    #     return jsonify({'message': 'Please use a valid email'}), 400

    if Admin_Users.query.filter_by(email=email).first():
        return jsonify({'message': 'Email already exists'}), 400

    # Generate OTP
    otp = random.randint(100000, 999999)

    # Store user data and OTP in Redis with a 5-minute expiration
    redis_client = current_app.redis
    user_data = {
        'admin_name': data['admin_name'],
        'email': email,
        'password': bcrypt.generate_password_hash(data['password']).decode('utf-8'),
        'department': data.get('department'),
        'role': 'admin'  # Set role as cdpc for TPO
    }
    redis_client.setex(f'tpo_user:{email}', 300, json.dumps(user_data))  # 300 seconds = 5 minutes
    redis_client.setex(f'tpo_otp:{email}', 300, str(otp))

    sender_email = os.getenv('MAIL_USERNAME')
    if not sender_email:
        return jsonify({'message': 'Email configuration error'}), 500

    try:
        subject = "Your TPO Account Verification OTP"
        html_content = f'''
        <html>
          <body>
            <h2>TPO Account Verification</h2>
            <p>Your One-Time Password (OTP) is: <strong>{otp}</strong></p>
            <p>This code is valid for 5 minutes only.</p>
            <p>If you didn't request this code, please ignore this email.</p>
            <hr>
            <p><small>This is an automated message. Please do not reply to this email.</small></p>
          </body>
        </html>
        '''
        text_content = f'''
        TPO Account Verification
        
        Your One-Time Password (OTP) is: {otp}
        
        This code is valid for 5 minutes only.
        
        If you didn't request this code, please ignore this email.
        
        This is an automated message. Please do not reply to this email.
        '''
        msg = Message(subject, sender=sender_email, recipients=[email])
        msg.body = text_content
        msg.html = html_content
        mail.send(msg)
    except Exception as e:
        return jsonify({'message': f'Failed to send OTP: {str(e)}'}), 500

    return jsonify({'message': 'OTP sent to email successfully'}), 200

# Verify OTP for TPO registration
@main.route('/tpo/verify-otp', methods=['POST'])
def verify_tpo_otp():
    data = request.get_json()
    email = data.get('email')
    user_otp = data.get('otp')
    
    if not email or not user_otp:
        return jsonify({'message': 'Email and OTP are required'}), 400
    
    redis_client = current_app.redis
    stored_otp = redis_client.get(f'tpo_otp:{email}')
    user_data_json = redis_client.get(f'tpo_user:{email}')
    
    if not stored_otp or not user_data_json:
        return jsonify({'message': 'OTP expired or invalid request'}), 400
    
    if stored_otp!= user_otp:  # Decode bytes to string
        return jsonify({'message': 'Invalid OTP'}), 400
    
    user_data = json.loads(user_data_json)
    
    try:
        new_tpo = Admin_Users(
            admin_name=user_data['admin_name'],
            email=user_data['email'],
            password=user_data['password'],  # Already hashed
            department=user_data['department'],
            role=user_data['role']
        )
        db.session.add(new_tpo)
        db.session.commit()
        
        # Clean up Redis
        redis_client.delete(f'tpo_otp:{email}')
        redis_client.delete(f'tpo_user:{email}')
        
        # Generate JWT tokens
        access_token = create_access_token(identity={'id': new_tpo.admin_id, 'role': 'admin'})
        refresh_token = create_refresh_token(identity={'id': new_tpo.admin_id, 'role': 'admin'})
        
        return jsonify({
            'message': 'TPO registration verified successfully',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': {
                'id': new_tpo.admin_id,
                'email': new_tpo.email,
                'tpo_name': new_tpo.admin_name,
                'department': new_tpo.department,
                'role': new_tpo.role
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        redis_client.delete(f'tpo_otp:{email}')
        redis_client.delete(f'tpo_user:{email}')
        return jsonify({'message': f'Error creating TPO account: {str(e)}'}), 500

# TPO Login
@main.route('/tpo/login', methods=['POST'])
def tpo_login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = Admin_Users.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.password, password):
        return jsonify({'message': 'Invalid credentials'}), 401

    access_token = create_access_token(identity=str(user.admin_id),
                                       additional_claims={"role": user.role})
    refresh_token = create_refresh_token(identity=str(user.admin_id),
                                       additional_claims={"role": user.role})

    return jsonify({
        'message': 'Login Successful',
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': {
            'id': user.admin_id,
            'email': user.email,
            'tpo_name': user.admin_name,
            'department': user.department,
            'role': user.role
        }
    }), 200

# Get TPO Profile
@main.route('/tpo/profile', methods=['GET'])
@jwt_required()
def get_tpo_profile():
    identity = get_jwt_identity()
    user_id = identity['id']
    user = Admin_Users.query.get_or_404(user_id)
    
    return jsonify({
        'tpo_name': user.admin_name,
        'email': user.email,
        'department': user.department,
        'role': user.role
    }), 200

# Update TPO Profile
@main.route('/tpo/profile', methods=['PATCH'])
@jwt_required()
def update_tpo_profile():
    identity = get_jwt_identity()
    user_id = identity['admin_id']
    user = Admin_Users.query.get_or_404(user_id)
    data = request.form

    if 'admin_name' in data:
        user.admin_name = data['admin_name']
    if 'department' in data:
        user.department = data['department']

    db.session.commit()
    
    return jsonify({
        'message': 'Profile updated successfully',
        'user': {
            'admin_name': user.admin_name,
            'email': user.email,
            'department': user.department,
            'role': user.role
        }
    }), 200

# Change TPO Password
@main.route('/tpo/change-password', methods=['PATCH'])
@jwt_required()
def change_tpo_password():
    identity = get_jwt_identity()
    user_id = identity['admin_id']
    user = Admin_Users.query.get_or_404(user_id)
    data = request.get_json()

    old_password = data.get('old_password')
    new_password = data.get('new_password')

    if not bcrypt.check_password_hash(user.password, old_password):
        return jsonify({'message': 'Incorrect old password'}), 400

    user.password = bcrypt.generate_password_hash(new_password).decode('utf-8')
    db.session.commit()
    return jsonify({'message': 'Password changed'}), 200

# Reset TPO Password
@main.route('/tpo/reset-password', methods=['POST'])
def reset_tpo_password():
    email = request.json.get('email')
    new_password = request.json.get('new_password')

    user = Admin_Users.query.filter_by(email=email).first()
    if not user:
        return jsonify({'message': 'User not found'}), 404

    otp = str(random.randint(100000, 999999))
    redis_client = current_app.redis
    redis_client.setex(f"tpo_password_otp:{email}", 300, otp)
    redis_client.setex(f"tpo_new_password:{email}", 300, new_password)

    sender_email = os.getenv('MAIL_USERNAME')
    if not sender_email:
        return jsonify({'message': 'Email configuration error'}), 500

    try:
        subject = "Your TPO Password Reset OTP"
        html_content = f'''
        <html>
          <body>
            <h2>TPO Password Reset</h2>
            <p>Your One-Time Password (OTP) is: <strong>{otp}</strong></p>
            <p>This code is valid for 5 minutes only.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <hr>
            <p><small>This is an automated message. Please do not reply.</small></p>
          </body>
        </html>
        '''
        text_content = f'''
        TPO Password Reset
        
        Your One-Time Password (OTP) is: {otp}
        
        This code is valid for 5 minutes only.
        
        If you didn't request this, please ignore this email.
        
        This is an automated message. Please do not reply.
        '''
        msg = Message(subject, sender=sender_email, recipients=[email])
        msg.body = text_content
        msg.html = html_content
        mail.send(msg)
    except Exception as e:
        return jsonify({'message': f'Failed to send OTP: {str(e)}'}), 500

    return jsonify({'message': 'OTP sent to email successfully'}), 200

# Verify TPO Password Reset OTP
@main.route('/tpo/password-otp-verify', methods=['POST'])
def tpo_password_otp_verify():
    email = request.json.get('email')
    otp = request.json.get('otp')

    redis_client = current_app.redis
    stored_otp = redis_client.get(f"tpo_password_otp:{email}")
    new_password = redis_client.get(f"tpo_new_password:{email}")

    if not stored_otp or not new_password:
        return jsonify({'message': 'OTP expired or invalid request'}), 400

    if str(otp) != stored_otp.decode('utf-8'):
        return jsonify({'message': 'Incorrect OTP'}), 400

    user = TPO_Users.query.filter_by(email=email).first()
    if not user:
        return jsonify({'message': 'User not found'}), 404

    user.password = bcrypt.generate_password_hash(new_password.decode('utf-8')).decode('utf-8')
    db.session.commit()

    redis_client.delete(f"tpo_password_otp:{email}")
    redis_client.delete(f"tpo_new_password:{email}")

    return jsonify({'message': 'Password successfully reset'}), 200

# TPO Token Refresh
@main.route('/tpo/refresh', methods=['POST'])
@jwt_required(refresh=True)
def tpo_refresh():
    identity = get_jwt_identity()
    new_access_token = create_access_token(identity=identity)
    return jsonify({
        'message': 'Token refreshed',
        'access_token': new_access_token
    }), 200

# TPO Logout
@main.route('/tpo/logout', methods=['POST'])
@jwt_required()
def tpo_logout():
    return jsonify({'message': 'Logged out (clear token on frontend)'}), 200



@main.route('/register', methods=['POST'])
def register():
    print("ok")
    data = request.get_json()
    print(data)
    
    # 'student_id', 'first_name', 'last_name','reg_no', 'email', 'contact_no', 'gender','dob',
    #               'degree', 'batch', 'specialization', 'current_gpa',
    #               'backlogs'

    # Required fields validation
    required_fields = ['email', 'first_name','last_name','reg_no','degree','specialization',
                     'password', 'dob', 'gender', 'contact_no','backlogs']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'message': f'{field.capitalize()} is required'}), 400

    email = data.get('email')
    if not email:
        return jsonify({'message': 'Email is required'}), 400

    # Validate campus email format
    print(email)
    if not re.match(r'^\d{2}33(1A|5A)(0[1-58]|08|12)[A-Z0-9]{2}@mvgrce\.edu\.in$', email):
        return jsonify({'message': 'Please use a valid campus email (e.g., )'}), 400

    if Students.query.filter_by(email=email).first():
        return jsonify({'message': 'Email already exists'}), 400

    # Generate OTP
    otp = random.randint(100000, 999999)

    # Store user data and OTP in Redis with a 5-minute expiration

    redis_client = current_app.redis
    user_data = {
        'first_name': data['first_name'],
        'last_name': data['last_name'],
        'email': email,
        'password': bcrypt.generate_password_hash(data['password']).decode('utf-8'),
        'contact_no': data.get('contact_no'),
        'reg_no': data.get('reg_no'),
        'batch': data.get('batch'),
        'specialization': data.get('specialization'),
        'degree': data.get('degree'),
        'skills': data.get('skills'),
        'gender': data.get('gender'),
        'backlogs': data.get('backlogs'),
        'current_gpa': data.get('current_gpa'),
        'resume_url': data.get('resume_url'),
        'certificate_urls': data.get('certificate_urls'),
        'dob': data.get('dob'),
        'picture': data.get('picture') or '',
        'role': 'student',
    }
    redis_client.setex(f'user:{email}', 300, json.dumps(
        user_data))  # 300 seconds = 5 minutes
    redis_client.setex(f'otp:{email}', 300, str(otp))

    sender_email = os.getenv('MAIL_USERNAME')

    # Send OTP via email
    if not sender_email:
        return jsonify({'message': 'Email configuration error'}), 500

    try:
    # Create a more descriptive subject
        subject = "Your Account Verification OTP"
    
    # Create more professional email content with HTML formatting
        html_content = f'''
    <html>
      <body>
        <h2>Account Verification</h2>
        <p>Your One-Time Password (OTP) is: <strong>{otp}</strong></p>
        <p>This code is valid for 5 minutes only.</p>
        <p>If you didn't request this code, please ignore this email.</p>
        <hr>
        <p><small>This is an automated message. Please do not reply to this email.</small></p>
      </body>
    </html>
    '''
    
    # Plain text alternative for email clients that don't support HTML
        text_content = f'''
    Account Verification
    
    Your One-Time Password (OTP) is: {otp}
    
    This code is valid for 5 minutes only.
    
    If you didn't request this code, please ignore this email.
    
    This is an automated message. Please do not reply to this email.
    '''
    
    # Create message with both HTML and plain text versions
        msg = Message(subject, sender=sender_email, recipients=[email])
        msg.body = text_content
        msg.html = html_content
    
        mail.send(msg)
    
    except Exception as e:
        return jsonify({'message': f'Failed to send OTP: {str(e)}'}), 500

    return jsonify({'message': 'OTP sent to email successfully'}), 200

@main.route('/verify-otp', methods=['POST'])
def verify_otp():
    data = request.get_json()
    email = data.get('email')
    user_otp = data.get('otp')
    
    if not email or not user_otp:
        return jsonify({'message': 'Email and OTP are required'}), 400
    
    # Retrieve stored OTP from Redis
    redis_client = current_app.redis
    stored_otp = redis_client.get(f'otp:{email}')
    user_data_json = redis_client.get(f'user:{email}')
    
    if not stored_otp or not user_data_json:
        return jsonify({'message': 'OTP expired or invalid request'}), 400
    
    # Compare OTPs (decode bytes to string)
    if stored_otp != user_otp:
        return jsonify({'message': 'Invalid OTP'}), 400
    
    # OTP is correct, create student in database
    user_data = json.loads(user_data_json)
    
    try:
        new_student = Students(
            first_name=user_data['first_name'],
            last_name=user_data['last_name'],
            email=user_data['email'],
            password=user_data['password'],  # Already hashed during registration
            contact_no=user_data.get('contact_no'),
            reg_no=user_data.get('reg_no'),
            batch=user_data.get('batch'),
            specialization=user_data.get('specialization'),
            degree=user_data.get('degree'),
            skills=user_data.get('skills'),
            current_gpa=user_data.get('current_gpa'),
            resume_url=user_data.get('resume_url'),
            certificate_urls=user_data.get('certificate_urls'),
            dob=user_data.get('dob'),
            gender=user_data.get('gender'),
            backlogs=user_data.get('backlogs'),
            picture=user_data.get('picture', '')
        )
        
        db.session.add(new_student)
        db.session.commit()
        
        # Clean up Redis data
        redis_client.delete(f'otp:{email}')
        redis_client.delete(f'user:{email}')
        
        # Generate JWT tokens
        access_token = create_access_token(
            identity={'id': new_student.student_id}
        )
        refresh_token = create_refresh_token(
            identity={'id': new_student.student_id}
        )
        
        return jsonify({
            'message': 'Registration verified successfully',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': {
                'id': new_student.student_id,
                'email': new_student.email,
                'first_name': new_student.first_name,
                'last_name': new_student.last_name,
                'reg_no': new_student.reg_no,
                'degree': new_student.degree,
                'specialization': new_student.specialization
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        # Clean up Redis data in case of error
        redis_client.delete(f'otp:{email}')
        redis_client.delete(f'user:{email}')
        return jsonify({'message': f'Error creating account: {str(e)}'}), 500

@main.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data['email']
    password = data['password']
    print(email, password)

    user = Students.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.password, password):
        return jsonify({'message': 'Invalid credentials'}), 401

    # Generate both tokens
    access_token = create_access_token(identity=str(user.student_id))
    refresh_token = create_refresh_token(identity=str(user.student_id))

    return jsonify({
        'message': 'Login Successful',
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': {
            'id': user.student_id,
            'email': user.email,
            'student_name': str(user.first_name) + ' ' + str(user.last_name),
            'reg_no': user.reg_no,
            'role': user.role
        }
    }), 200

@main.route('/profile/<int:student_id>', methods=['GET'])
def get_student_profile(student_id):
    """
    Retrieve the profile details of the authenticated student, including placement details if available.
    """
    try:
        # Get the user ID from the JWT token
        # Fetch the student record
        student = Students.query.get(student_id)
        print(student.first_name)
        # Fetch placement record for the student (if any)
        placement = Placed_Students.query.filter_by(student_id=student_id).first()
        placement_data = None
        if placement:
            # Get company and job details
            company = Companies.query.get(placement.company_id)
            job = Jobs.query.get(placement.job_id)

            # Build placement data
            placement_data = {
                'company_id': company.company_id,
                'company_name': company.company_name.capitalize(),
                'job_role': job.role,
                'salary_offered': float(placement.salary_offered) if placement.salary_offered else None,
                'joining_date': placement.joining_date.strftime('%Y-%m-%d') if placement.joining_date else None,
                'date_of_interview': placement.date_of_interview.strftime('%Y-%m-%d') if placement.date_of_interview else None,
                'placement_status': placement.status,
                'offer_letter_url': placement.offer_letter_url  # Include the offer letter URL
            }

        # Build the response with student profile and placement details
        response = {
            'message': f'Profile details for student {student.first_name} {student.last_name}',
            'data': {
                'first_name': student.first_name,
                'last_name': student.last_name,
                'email': student.email,
                'contact_no': student.contact_no,
                'picture': student.picture if student.picture else None,
                'dob': student.dob.isoformat() if student.dob else None,
                'gender': student.gender,
                'reg_no': student.reg_no,
                'batch': student.batch,
                'specialization': student.specialization,
                'degree': student.degree,
                'skills': student.skills,
                'current_gpa': student.current_gpa,
                'resume_url': student.resume_url,
                'certificate_urls': student.certificate_urls,
                'backlogs': student.backlogs,
                'placement': placement_data  # Include placement details (or None if not placed)
            }
        }

        return jsonify(response), 200

    except Exception as e:
        current_app.logger.error(f"Error retrieving student profile: {str(e)}")
        return jsonify({'message': 'Failed to retrieve student profile', 'error': str(e)}), 500



@main.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    
    student = Students.query.get_or_404(user_id)
    print(student.certificate_urls)
    return jsonify({
        'first_name': student.first_name,
        'last_name': student.last_name,
        'email': student.email,
        'contact_no': student.contact_no,
        'picture': student.picture,
        'dob': student.dob.isoformat() if student.dob else None,
        'gender': student.gender,
        'reg_no': student.reg_no,
        'batch': student.batch,
        'specialization': student.specialization,
        'degree': student.degree,
        'skills': student.skills,
        'current_gpa': student.current_gpa,
        'resume_url': student.resume_url,
        'certificate_urls': student.certificate_urls,
        'backlogs': student.backlogs
    }), 200

@main.route('/profile', methods=['PATCH'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    student = Students.query.get_or_404(user_id)
    data = request.form
    
    # We shouldn't change email and reg_no
    
    # Update only if the field exists in the request
    if 'first_name' in data:
        student.first_name = data['first_name']
    if 'last_name' in data:
        student.last_name = data['last_name']
    if 'contact_no' in data:
        student.contact_no = data['contact_no']
    if 'dob' in data:
        try:
            student.dob = datetime.strptime(data['dob'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'message': 'Invalid date format for dob (use YYYY-MM-DD)'}), 400
    if 'gender' in data:
        student.gender = data['gender']
    if 'specialization' in data:
        student.specialization = data['specialization']
    if 'degree' in data:
        student.degree = data['degree']
    if 'batch' in data:
        student.batch = data['batch']
    if 'skills' in data:
        student.skills = data['skills']
    if 'current_gpa' in data:
        student.current_gpa = data['current_gpa']
    if 'backlogs' in data:
        student.backlogs = data['backlogs']
        
    # Handle profile image upload
    picture = request.files.get('picture')
    if picture:
        picture_path = save_file(
            picture, current_app.config['UPLOAD_FOLDER'], 'profile', 'image', user_id)
        if picture_path:
            student.picture = picture_path
        elif picture_path is None:
            return jsonify({'message': 'Invalid picture file type'}), 400
            
    # Handle resume upload
    resume = request.files.get('resume_url')
    if resume:
        resume_path = save_file(
            resume, current_app.config['UPLOAD_FOLDER'], 'profile', 'file', user_id)
        if resume_path:
            student.resume_url = resume_path
        elif resume_path is None:
            return jsonify({'message': 'Invalid resume file type'}), 400
    
    certificate_url = request.files.get('certificate_urls')
    if certificate_url:
        certificate_path = save_file(
            certificate_url, current_app.config['UPLOAD_FOLDER'], 'certificates', 'file', user_id)
        if certificate_path:
            student.certificate_urls = certificate_path
        elif certificate_path is None:
            return jsonify({'message': 'Invalid resume file type'}), 400
    
    # Save changes to database
    db.session.commit()
    
    return jsonify({
        'message': 'Profile updated successfully',
        'user': {
            'first_name': student.first_name,
            'last_name': student.last_name,
            'contact_no': student.contact_no,
            'dob': student.dob.isoformat() if student.dob else None,
            'gender': student.gender,
            'degree': student.degree,
            'specialization': student.specialization,
            'batch': student.batch,
            'current_gpa': student.current_gpa,
            'skills': student.skills,
            'backlogs': student.backlogs,
            'picture': student.picture,
            'resume_url': student.resume_url,
            'certificate_urls':student.certificate_urls
        }
    }), 200

@main.route('/change-password', methods=['PATCH'])
@jwt_required()
def change_password():

    user_id = get_jwt_identity()
    user = Students.query.get_or_404(user_id)
    data = request.get_json()
    # data = request.form
    print(data)

    old_password = data['old_password']
    new_password = data['new_password']

    if not bcrypt.check_password_hash(user.password, old_password):
        return jsonify({'message': 'Incorrect old password'}), 400

    user.password = bcrypt.generate_password_hash(new_password).decode('utf-8')
    db.session.commit()
    return jsonify({'message': 'Password changed'}), 200

@main.route('/reset-password', methods=['POST'])
def reset_password():
    email = request.json.get('email')
    new_password = request.json.get('new_password')

    user = Students.query.filter_by(email=email).first()
    if not user:
        return jsonify({'message': 'User not found'}), 404

    otp = str(random.randint(100000, 999999))
    # OTP valid for 5 minutes

    redis_client = current_app.redis

    redis_client.setex(f"password_otp:{email}", 300, otp)
    # Store new password temporarily
    redis_client.setex(f"new_password:{email}", 300, new_password)

    sender_email = os.getenv('MAIL_USERNAME')

    # Send OTP via email
    if not sender_email:
        return jsonify({'message': 'Email configuration error'}), 500

    try:
    # Create a more descriptive subject
        subject = "Your Account Verification OTP"
    
    # Create more professional email content with HTML formatting
        html_content = f'''
    <html>
      <body>
        <h2>Account Verification</h2>
        <p>Your One-Time Password (OTP) is: <strong>{otp}</strong></p>
        <p>This code is valid for 5 minutes only.</p>
        <p>If you didn't request this code, please ignore this email.</p>
        <hr>
        <p><small>This is an automated message. Please do not reply to this email.</small></p>
      </body>
    </html>
    '''
    
    # Plain text alternative for email clients that don't support HTML
        text_content = f'''
    Account Verification
    
    Your One-Time Password (OTP) is: {otp}
    
    This code is valid for 5 minutes only.
    
    If you didn't request this code, please ignore this email.
    
    This is an automated message. Please do not reply to this email.
    '''
    
    # Create message with both HTML and plain text versions
        msg = Message(subject, sender=sender_email, recipients=[email])
        msg.body = text_content
        msg.html = html_content
    
        mail.send(msg)
    
    except Exception as e:
        return jsonify({'message': f'Failed to send OTP: {str(e)}'}), 500

    return jsonify({'message': 'OTP sent to email successfully'}), 200

@main.route('/password-otp-verify', methods=['POST'])
def password_otp_verify():
    email = request.json.get('email')
    otp = request.json.get('otp')

    redis_client = current_app.redis

    stored_otp = redis_client.get(f"password_otp:{email}")
    new_password = redis_client.get(f"new_password:{email}")

    if not stored_otp or not new_password:
        return jsonify({'message': 'OTP expired or invalid request'}), 400

    if str(otp) != stored_otp:
        return jsonify({'message': 'Incorrect OTP'}), 400

    user = Students.query.filter_by(email=email).first()
    if not user:
        return jsonify({'message': 'User not found'}), 404

    user.password = bcrypt.generate_password_hash(new_password).decode('utf-8')
    db.session.commit()

    # Clean up Redis
    redis_client.delete(f"password_otp:{email}")
    redis_client.delete(f"new_password:{email}")

    return jsonify({'message': 'Password successfully reset.'}), 200

@main.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)  # send valid refresh token
def refresh():
    current_user = get_jwt_identity()  # Get identity from refresh token
    new_access_token = create_access_token(identity=current_user)
    return jsonify({
        'message': 'Token refreshed',
        'access_token': new_access_token
    }), 200

@main.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    print("Received Headers:", request.headers)
    print("Received JSON:", request.get_json())

    if not request.is_json:
        return jsonify({"error": "Invalid JSON format"}), 422  # Ensure valid JSON
    
    jti = get_jwt()["jti"]  # Get JWT token identifier
    redis_client.setex(f"token_blacklist:{jti}", 3600, "true")  # Blacklist token
    return jsonify({'message': 'Successfully logged out'}), 200

@main.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        user_id = get_jwt_identity()
        user = Students.query.get(user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404

        return jsonify({
            'id': user.student_id,
            'email': user.email,
            'role': 'student',
            'first_name': user.first_name,
            'last_name': user.last_name
        }), 200
    except Exception as e:
        return jsonify({'message': 'Failed to fetch user', 'error': str(e)}), 500