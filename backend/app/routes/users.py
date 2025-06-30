from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.database import db
from app.models import Students,Admin_Users
from app.utils import save_file
from app import bcrypt
from datetime import datetime
import re
import os
import random
from dotenv import load_dotenv
load_dotenv()

main = Blueprint('users', __name__)
# @main.route('/admin', methods=['POST'])
# def register_admin():
#     data = request.get_json()
#     # Check if required fields are provided
#     email = data.get('email')
#     required_fields = ['admin_name', 'role', 'email', 'password','department']
#     for field in required_fields:
#         if not data.get(field):
#             return jsonify({'message': f'{field.capitalize()} is required'}), 400
    
#     # Check if email already exists
#     if Admin_Users.query.filter_by(email=data['email']).first():
#         return jsonify({'message': 'Email already exists'}), 400
    
#     otp = random.randint(100000, 999999)

#     # Store user data and OTP in Redis with a 5-minute expiration

#     redis_client = current_app.redis
#     user_data = {
#         'admin_name':data['admin_name'],
#         'email':data['email'],
#         'password':bcrypt.generate_password_hash(data['password']).decode('utf-8'),
#         'department': data.get('department'),
#         'role':'admin' # Set role as admin
#     }
#     redis_client.setex(f'user:{email}', 300, json.dumps(
#         user_data))  # 300 seconds = 5 minutes
#     redis_client.setex(f'otp:{email}', 300, str(otp))

#     sender_email = os.getenv('MAIL_USERNAME')

#     # Send OTP via email
#     if not sender_email:
#         return jsonify({'message': 'Email configuration error'}), 500

#     try:
#     # Create a more descriptive subject
#         subject = "Your Account Verification OTP"
    
#     # Create more professional email content with HTML formatting
#         html_content = f'''
#     <html>
#       <body>
#         <h2>Account Verification</h2>
#         <p>Your One-Time Password (OTP) is: <strong>{otp}</strong></p>
#         <p>This code is valid for 5 minutes only.</p>
#         <p>If you didn't request this code, please ignore this email.</p>
#         <hr>
#         <p><small>This is an automated message. Please do not reply to this email.</small></p>
#       </body>
#     </html>
#     '''
    
#     # Plain text alternative for email clients that don't support HTML
#         text_content = f'''
#     Account Verification
    
#     Your One-Time Password (OTP) is: {otp}
    
#     This code is valid for 5 minutes only.
    
#     If you didn't request this code, please ignore this email.
    
#     This is an automated message. Please do not reply to this email.
#     '''
    
#     # Create message with both HTML and plain text versions
#         msg = Message(subject, sender=sender_email, recipients=[email])
#         msg.body = text_content
#         msg.html = html_content
    
#         mail.send(msg)
    
#     except Exception as e:
#         return jsonify({'message': f'Failed to send OTP: {str(e)}'}), 500

#     return jsonify({'message': 'OTP sent to email successfully'}), 200
#     # Create new admin use

@main.route('/student', methods=['POST'])
@jwt_required()
def add_student():
    data = request.get_json()
    email = data.get('email')
    if not email:
        return jsonify({'message': 'Email is required'}), 400

    if Students.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already exists'}), 400

    if data.get('contact_no') and Students.query.filter_by(contact_no=data['contact_no']).first():
        return jsonify({'message': 'Phone number already exists'}), 400

    if not re.match(r'^\d{2}33(1A|5A)(0[1-58]|08|12)[A-Z0-9]{2}@mvgrce\.edu\.in$', data['email']):
        return jsonify({'message': 'Please use a valid campus email (e.g.,21331A0XXX@mvgrce.edu.in)'}), 400

    required_fields = ['reg_no', 'first_name','last_name',
                       'password', 'phone_no', 'dob', 'gender','email','current_gpa','backlogs','degree','specialization']
        
    for field in required_fields:
        if not data.get(field):
            return jsonify({'message': f'{field} is required'}), 400

    student = Students(
    reg_no = data['reg_no'],
    first_name = data['first_name'],
    last_name = data['last_name'],
    gender = data['gender'],
    email = data['email'],
    password = bcrypt.generate_password_hash(data['password']).decode('utf-8'),
    contact_no = data['contact_no'],
    batch = data['batch'],
    dob = data['dob'],
    specialization = data.get('specialization'),
    degree = data.get('degree'),
    current_gpa = data.get('current_gpa'),
    backlogs = data.get('backlogs'),
    role = 'student',
    )
    db.session.add(student)
    db.session.commit()
    return jsonify({'message': 'Student', 'user_id': user.id}), 201

@main.route('/student', methods=['GET'])
@jwt_required()
def get_all_students():
    # Check if user has appropriate role
    claims = get_jwt()
    if claims.get('role') not in ['admin', 'cdpc']:
        return jsonify({'message': 'Unauthorized: Admin or CDPC privileges required'}), 403

    # Get pagination parameters from the request
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    # Paginate the query for students
    paginated_students = Students.query.all().paginate(
        page=page,
        per_page=per_page,
        error_out=False
    )
    students = paginated_students.items

    # Build the response data with all requested fields
    students_data = [{
        'id': student.id,
        'first_name': student.first_name,
        'last_name': student.last_name,
        'reg_no': student.reg_no,
        'email': student.email,
        'gender': student.gender,
        'contact_no': student.contact_no,
        'dob': student.dob.isoformat() if student.dob else None,
        'degree': student.degree,
        'specialization': student.specialization,
        'batch': student.batch,
        'current_gpa': student.current_gpa,
        'backlogs': student.backlogs
    } for student in students]

    # Build pagination metadata
    pagination_info = {
        'total': paginated_students.total,
        'page': paginated_students.page,
        'pages': paginated_students.pages,
        'per_page': paginated_students.per_page,
    }

    # Return the data with pagination info
    return jsonify({
        'students': students_data,
        'pagination': pagination_info
    }), 200

@main.route('/student/<string:reg_no>', methods=['GET'])
@jwt_required()
def get_student(reg_no):
    # Check if user has appropriate role
    claims = get_jwt()
    if claims.get('role') not in ['admin', 'cdpc']:
        return jsonify({'message': 'Unauthorized: Admin or CDPC privileges required'}), 403
    # Get pagination parameters from the request
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    # Paginate the query for students
    paginated_students = Students.query.get_or_404(reg_no).paginate(
        page=page,
        per_page=per_page,
        error_out=False
    )
    students = paginated_students.items

    # Build the response data with all requested fields
    students_data = [{
        'id': student.id,
        'first_name': student.first_name,
        'last_name': student.last_name,
        'reg_no': student.reg_no,
        'email': student.email,
        'gender': student.gender,
        'contact_no': student.contact_no,
        'dob': student.dob.isoformat() if student.dob else None,
        'degree': student.degree,
        'specialization': student.specialization,
        'batch': student.batch,
        'current_gpa': student.current_gpa,
        'backlogs': student.backlogs
    } for student in students]

    # Build pagination metadata
    pagination_info = {
        'total': paginated_students.total,
        'page': paginated_students.page,
        'pages': paginated_students.pages,
        'per_page': paginated_students.per_page,
    }

    # Return the data with pagination info
    return jsonify({
        'students': students_data,
        'pagination': pagination_info
    }), 200


@main.route('/student/<string:reg_no>', methods=['PATCH'])
@jwt_required()
def update_student(reg_no):
    # Check if user has appropriate role
    claims = get_jwt()
    if claims.get('role') not in ['admin', 'cdpc']:
        return jsonify({'message': 'Unauthorized: Admin or CDPC privileges required'}), 403
    
    # Find the student
    student = Students.query.get_or_404(id)
    
    data = request.form
    
    # Update fields if provided
    if data.get('first_name'):
        student.first_name = data['first_name']
    if data.get('last_name'):
        student.last_name = data['last_name']
    if data.get('reg_no'):
        existing_student = Students.query.filter_by(
            reg_no=data['reg_no']).filter(Students.reg_no != reg_no).first()
        if existing_student:
            return jsonify({'message': 'Contact number already exists'}), 400
        student.reg_no = data['reg_no']
    if data.get('contact_no'):
        # Check for unique contact number
        existing_student = Students.query.filter_by(
            contact_no=data['contact_no']).filter(Students.reg_no != reg_no).first()
        if existing_student:
            return jsonify({'message': 'Contact number already exists'}), 400
        student.contact_no = data['contact_no']
    if data.get('dob'):
        try:
            student.dob = datetime.strptime(data['dob'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'message': 'Invalid date format for dob (use YYYY-MM-DD)'}), 400
    if data.get('gender'):
        student.gender = data['gender']
    if data.get('degree'):
        student.degree = data['degree']
    if data.get('specialization'):
        student.specialization = data['specialization']
    if data.get('batch'):
        student.batch = data['batch']
    if data.get('current_gpa'):
        student.current_gpa = data['current_gpa']
    if data.get('backlogs'):
        student.backlogs = data['backlogs']
    try:
        db.session.commit()
        return jsonify({'message': 'Student updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating student: {str(e)}'}), 500


@main.route('/students/<string:reg_no>', methods=['DELETE'])
@jwt_required()
def delete_student(reg_no):

    claims = get_jwt()
    if claims.get('role') not in ['admin', 'cdpc']:
        return jsonify({'message': 'Unauthorized: Admin or CDPC privileges required'}), 403

    student = Students.query.get_or_404(reg_no)
    if student.reg_no == '':
        return jsonify({'message': 'No student are there with {student.reg_no}'}), 400

    db.session.delete(student)
    db.session.commit()
    return jsonify({'message': 'Student deleted'}), 200


