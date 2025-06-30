from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity,get_jwt
from app.database import db
from flask_mail import Message
from app import mail, bcrypt
# from app.models import Job, JobRegistered
from app.utils import save_file
import uuid
import os
import time
from datetime import datetime
import validators
import bleach
from werkzeug.utils import secure_filename
from app.models import Students,Admin_Users,Jobs,Companies, Placed_Students,Applications

main = Blueprint('job', __name__)

# @main.route('/', methods=['POST'])
# @jwt_required()
# def create_job():
#     claims = get_jwt()
#     if claims.get('role') not in ['admin','cdpc']:
#         return jsonify({'message': 'Unauthorized: Admin privileges required'}), 403
#     # Get job data from request

#     data = request.form
#     required_fields = ['company_id', 'role', 'job_location', 'package', 
#                        'job_description', 'last_date_to_apply', 'min_gpa','date_of_interview','gender_eligibility']
    
#     # Check required fields
#     for field in required_fields:
#         if not data.get(field):
#             return jsonify({'message': f'{field} is required'}), 400

#     # Get the files
#     service_agreement_file = data['service_agreement']
#     additional_files = request.files.get('files')

#     if not service_agreement_file:
#         return jsonify({'message': 'Service agreement is required'}), 400

#     # Generate unique identifier for this job
#     unique_id = 'post -' + str(uuid.uuid4())
    
#     if additional_files:
#         additional_files_path = save_file(
#             additional_files, current_app.config['UPLOAD_FOLDER'], 'jobs', 'files', unique_id)
#     else:
#         additional_files_path = None

#     # Convert string values to appropriate types
#     try:
#         company_id = int(data['company_id'])
#         package = float(data['package'])
#         min_gpa = float(data['min_gpa'])
#     except ValueError:
#         return jsonify({'message': 'Invalid data types for numeric fields'}), 400

#     # Parse date
#     try:
#         last_date = datetime.strptime(data['last_date_to_apply'], '%Y-%m-%d').date()
#     except ValueError:
#         return jsonify({'message': 'Invalid date format. Use YYYY-MM-DD'}), 400

#     # Get current admin ID from JWT token
#     admin_id = get_jwt_identity()
    
#     # Verify the admin exists in Admin_users
#     admin = Admin_users.query.get(admin_id)
#     if not admin:
#         return jsonify({'message': 'Admin not found'}), 404

#     # Now create the job with valid paths
#     job = Jobs(
#         company_id=company_id,
#         job_location=data['job_location'],
#         role=data['role'],
#         package=package,
#         job_description=data['job_description'],
#         service_agreement=data['service_agreement'],
#         links_for_registrations=data.get('links_for_registrations', ''),
#         files=additional_files_path,
#         posted_date=datetime.now().date(),
#         date_of_interview = data['date_of_interview'],
#         last_date_to_apply=last_date,
#         created_by=data.get('created_by', f'Admin {admin.admin_name}'),

#         min_gpa=min_gpa,
#         admin_id=admin.admin_id
#     )
    
#     db.session.add(job)
#     db.session.commit()

#     return jsonify({
#         'message': 'Job created successfully', 
#         'job_id': job.job_id
#     }), 201

def check_role(required_role):
    """Check if the user has the required role ('cdpc' or 'admin')."""
    claims = get_jwt()
    user_role = claims.get('role')
    if user_role not in ['cdpc', 'admin']:
        return jsonify({'message': 'Unauthorized: Admin or CDPC privileges required'}), 403
    return None

def allowed_file(filename):
    """Check if the file has an allowed extension."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

@main.route('/student-jobs', methods=['GET'])
@jwt_required()
def get_all_jobsstudents():
    """Get all job postings that the student is eligible for"""
    try:
        # Get student identity from JWT
        student_id = get_jwt_identity()
        student = Students.query.get_or_404(student_id)

        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)

        # Base query with eligibility filters
        query = Jobs.query.filter(
            Jobs.min_gpa <= student.current_gpa,
            Jobs.max_backlogs >= student.backlogs,
            Jobs.last_date_to_apply >= datetime.now().date()  # Only show active jobs
        )

        # Apply pagination to filtered query
        paginated_jobs = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        jobs = paginated_jobs.items

        # Build the response data
        job_data = []
        for job in jobs:
            company = Companies.query.get(job.company_id)
            
            # Check if already applied
            already_applied = Applications.query.filter_by(
                student_id=student_id, 
                job_id=job.job_id
            ).first() is not None

            # Only include jobs student hasn't applied to yet
            if not already_applied:
                job_data.append({
                    'id': job.job_id,
                    'role': job.role,
                    'company_id': job.company_id,
                    'company_name': company.company_name if company else "Unknown",
                    'job_location': job.job_location,
                    'package': float(job.package) if job.package else 0.0,
                    'posted_date': job.posted_date.strftime('%Y-%m-%d'),
                    'date_of_interview': job.date_of_interview.strftime('%Y-%m-%d'),
                    'last_date_to_apply': job.last_date_to_apply.strftime('%Y-%m-%d'),
                    'min_gpa': float(job.min_gpa) if job.min_gpa else 0.0,
                    'max_backlogs': job.max_backlogs,
                    'gender_eligibility': job.gender_eligibility
                })

        # Build pagination metadata
        pagination_info = {
            'total': paginated_jobs.total,
            'page': paginated_jobs.page,
            'pages': paginated_jobs.pages,
            'per_page': paginated_jobs.per_page,
        }

        return jsonify({
            'jobs': job_data,
            'pagination': pagination_info
        }), 200

    except Exception as e:
        print("Error:", str(e))
        return jsonify({'message': 'Failed to retrieve jobs', 'error': str(e)}), 500

@main.route('/create', methods=['POST'])
@jwt_required()
def create_job():
    # Check user role
    error = check_role('admin')  # Allows 'cdpc' and 'admin' only
    if error:
        return error

    # Get admin info from token
    admin_id = get_jwt_identity()
    admin = Admin_Users.query.get(admin_id)
    if not admin:
        return jsonify({'message': 'Admin user not found'}), 404

    # Get data from request
    data = request.form
    required_fields = [
        'role', 'job_location', 'job_description', 'package',
        'date_of_interview', 'last_date_to_apply',
        'gender_eligibility', 'max_backlogs', 'min_gpa',
        'company_name', 'company_type', 'website', 'description'
    ]
    print(data)
    # Validate required fields
    for field in required_fields:
        if not data.get(field):
            return jsonify({'message': f'{field} is required'}), 400

    # Get the file (only one file in the new requirements, unlike the reference code)

    file = request.files.get('files')
    if file:
        unique_id = str(uuid.uuid4())
        # Save the file with a unique name
        file_path = save_file(
            file, current_app.config['UPLOAD_FOLDER'], 'jobs', 'file', unique_id
        )
        if not file_path:
            return jsonify({'message': 'Error saving file'}), 500
    else:
        file_path = ""

    # Parse dates (basic validation to ensure they are in the correct format)
    try:
        last_date = datetime.strptime(data['last_date_to_apply'], '%Y-%m-%d').date()
        interview_date = datetime.strptime(data['date_of_interview'], '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'message': 'Invalid date format. Use YYYY-MM-DD'}), 400

    # Parse numeric values (basic validation to ensure they are numbers)
    try:
        package = float(data['package'])
        min_gpa = float(data['min_gpa'])
        max_backlogs = int(data['max_backlogs'])
    except ValueError:
        return jsonify({'message': 'Invalid numeric values'}), 400

    # Generate a new company_id (for simplicity, since the reference code doesn't handle company_id)
    company_id = int(uuid.uuid4().int & (1<<31)-1)  # Generate a positive integer

    # comapny_res = 

    # if 
    # Create the company
    company = Companies(
        company_id=company_id,
        company_name=data['company_name'],
        company_type=data['company_type'],
        website=data['website'],
        description=data['description'],
        contact_person=data.get('contact_person', ''),
        address=data.get('address', '')
    )
    db.session.add(company)

    # Create the job with the specified attributes
    job = Jobs(
        job_location=data['job_location'],
        role=data['role'],
        package=package,
        job_description=data['job_description'],
        service_agreement=data.get('service_agreement', " "),
        links_for_registrations=data.get('links_for_registrations', " "),
        files=file_path if file_path else None,
        posted_date=datetime.now().date(),
        date_of_interview=interview_date,
        last_date_to_apply=last_date,
        created_by=data.get('created_by', f'Admin {admin.admin_name}'),
        min_gpa=min_gpa,
        admin_id=admin.admin_id,
        gender_eligibility=data['gender_eligibility'].lower(),
        max_backlogs=max_backlogs,
        company_id=company_id
    )
    db.session.add(job)
    db.session.commit()

    send_job_notifications(job,company.company_name)

    return jsonify({
        'message': 'Job created',
        'job_id': job.job_id,
        'company_id': company.company_id
    }), 201


def send_job_notifications(job, company_name):
    """
    Send email notifications to eligible students for a new job posting.
    """
    try:
        # Build eligibility query
        query = Students.query

        filters = []
        if job.gender_eligibility != 'all':
            filters.append(Students.gender == job.gender_eligibility)

        if hasattr(Students, 'backlogs'):
            filters.append(Students.backlogs <= job.max_backlogs)

        if job.min_gpa and job.min_gpa > 0:
            filters.append(Students.current_gpa >= job.min_gpa)

        if filters:
            query = query.filter(*filters)

        # Paginate the query to avoid loading all students into memory
        page = 1
        per_page = 100  # Process 100 students at a time

        sender_email = os.getenv('MAIL_USERNAME')
        if not sender_email:
            current_app.logger.error("MAIL_USERNAME not set in environment variables")
            return

        gender_note = "Note: This opportunity is for female students only." if job.gender_eligibility == 'female' else ""

        # Configure email template
        subject = f"New Job Opportunity: {str(job.role)} at {str(company_name)}"
        job_details = f"""
Job Role: {job.role}
Company: {company_name}
Location: {job.job_location}
Package: {job.package}
Interview Date: {job.date_of_interview.strftime('%d %B, %Y')}
Last Date to Apply: {job.last_date_to_apply.strftime('%d %B, %Y')}
Eligible Criteria: 
        B.tech CGPA {job.min_gpa} or more.
        {f'No more than {job.max_backlogs} backlogs.' if job.max_backlogs else 'No backlogs.'}

{gender_note}

Job Description:
{job.job_description}

Apply now by logging into the portal before the deadline!
        """

        while True:
            students_page = query.paginate(page=page, per_page=per_page, error_out=False)
            eligible_students = students_page.items

            if not eligible_students:
                current_app.logger.info(f"No eligible students found for job {job.id}")
                break

            current_app.logger.info(f"Sending job notifications to {len(eligible_students)} eligible students in batch {page}")

            # Send emails in smaller batches
            EMAIL_BATCH_SIZE  = 1
            for i in range(0, len(eligible_students), EMAIL_BATCH_SIZE):
                batch = eligible_students[i:i + EMAIL_BATCH_SIZE]
                for student in batch:
                    try:
                        # Create personalized message
                        personalized_message = f"Dear {student.first_name},\n\nWe are pleased to inform you about a new job opportunity that matches your profile.\n\n{job_details}"
                        if job.links_for_registrations:
                            personalized_message += f"\n\nRegister here: {job.links_for_registrations}"
                        personalized_message += "\n\nPlease ensure your resume is up-to-date in the portal."

                        # Create Flask-Mail message
                        msg = Message(
                            subject=subject,
                            sender=sender_email,
                            recipients=[student.email],
                            body=personalized_message
                        )

                        # Send the email
                        with current_app.app_context():
                            mail.send(msg)

                        current_app.logger.info(f"Job notification sent to {student.email}")

                    except Exception as e:
                        current_app.logger.error(f"Failed to send email to {student.email}: {str(e)}")

                time.sleep(1)  # Delay between batches to avoid overwhelming the mail server

            if not students_page.has_next:
                break
            page += 1

    except Exception as e:
        current_app.logger.error(f"Error in send_job_notifications: {str(e)}")

def send_interview_rescheduled_notifications(job, company_name, old_interview_date,new_interview_date):
    """
    Send email notifications to students who have applied for the job 
    when the interview date is rescheduled.
    """
    try:
        # Find students who have applied to this specific job
        
        applied_students = Applications.query.filter_by(job_id=job.job_id).all()
        print(applied_students)

        if not applied_students:
            current_app.logger.info(f"No students applied for job {job.job_id}")
            return

        sender_email = os.getenv('MAIL_USERNAME')
        if not sender_email:
            current_app.logger.error("MAIL_USERNAME not set in environment variables")
            return

        # Configure email template
        subject = f"Interview Date Rescheduled: {str(job.role)} at {str(company_name)}"
        interview_details = f"""
Job Role: {job.role}
Company: {company_name}
Updated Interview Date: {new_interview_date.strftime('%d %B, %Y')}
Previous Interview Date: {old_interview_date.strftime('%d %B, %Y')}
Location: {job.job_location}
Last Date to Apply: {job.last_date_to_apply.strftime('%d %B, %Y')}

Important: The interview date for this job has been rescheduled. 
Please review the updated details and make necessary arrangements.

Job Description:
{job.job_description}

If you have any questions, please contact the Training and Placement Office.
        """

        # Send emails in small batches
        EMAIL_BATCH_SIZE = 1
        for i in range(0, len(applied_students), EMAIL_BATCH_SIZE):
            batch = applied_students[i:i + EMAIL_BATCH_SIZE]
            for application in batch:
                student = application.student
                print(student)  # Assuming there's a relationship between JobApplications and Students
                try:
                    # Create personalized message
                    personalized_message = f"Dear {student.first_name},\n\nWe are writing to inform you about an important update regarding your job application.\n\n{interview_details}"
                    
                    if job.links_for_registrations:
                        personalized_message += f"\n\nRegistration Link: {job.links_for_registrations}"
                    
                    personalized_message += "\n\nPlease ensure you are prepared for the rescheduled interview date."

                    # Create Flask-Mail message
                    msg = Message(
                        subject=subject,
                        sender=sender_email,
                        recipients=[student.email],
                        body=personalized_message
                    )

                    # Send the email
                    with current_app.app_context():
                        mail.send(msg)

                    current_app.logger.info(f"Interview reschedule notification sent to {student.email}")

                except Exception as e:
                    current_app.logger.error(f"Failed to send rescheduled interview email to {student.email}: {str(e)}")

                time.sleep(1)  # Delay between emails to avoid overwhelming the mail server

    except Exception as e:
        current_app.logger.error(f"Error in send_interview_rescheduled_notifications: {str(e)}")

@main.route('/<int:job_id>', methods=['PUT'])
@jwt_required()
def update_job(job_id):
    """Update an existing job posting"""
    claims = get_jwt()
    if claims.get('role') not in ['admin','cdpc']:
        return jsonify({'message': 'Unauthorized: Admin privileges required'}), 403
    
    try:
        job = Jobs.query.get_or_404(job_id)
        
        # Get data from request
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form
            
        # Update fields if provided in request
        if 'role' in data:
            job.role = data['role']
        if 'company_id' in data:
            try:
                job.company_id = int(data['company_id'])
            except ValueError:
                return jsonify({'message': 'Invalid company_id'}), 400
        if 'job_location' in data:
            job.job_location = data['job_location']
        if 'job_description' in data:
            job.job_description = data['job_description']
        if 'service_agreement' in data:
            job.service_agreement = data['service_agreement']
        if 'links_for_registrations' in data:
            job.links_for_registrations = data['links_for_registrations']
        
        # Handle numeric fields
        if 'package' in data:
            try:
                job.package = float(data['package'])
            except ValueError:
                return jsonify({'message': 'Invalid package value'}), 400
        if 'min_gpa' in data:
            try:
                job.min_gpa = float(data['min_gpa'])
            except ValueError:
                return jsonify({'message': 'Invalid min_gpa value'}), 400
        if 'max_backlogs' in data:
            try:
                job.max_backlogs = int(data['max_backlogs'])
            except ValueError:
                return jsonify({'message': 'Invalid max_backlogs value'}), 400
                
        # Handle dates
        if 'date_of_interview' in data:
            try:
                old_interview_date = job.date_of_interview  # Store the old date before updating
                new_interview_date = datetime.strptime(data['date_of_interview'], '%Y-%m-%d').date()
                
                if old_interview_date != new_interview_date:
                    # Fetch company name for notification
                    company = Companies.query.get(job.company_id)
                    company_name = company.company_name if company else "Unknown Company"

                    # Send rescheduled interview notifications
                    send_interview_rescheduled_notifications(job, company_name, old_interview_date,new_interview_date)
                    print("Re-Scheduled the Interview!!!")

                job.date_of_interview = new_interview_date  # Update with new date

            except ValueError:
                return jsonify({'message': 'Invalid date_of_interview format. Use YYYY-MM-DD'}), 400
                if 'last_date_to_apply' in data:
                    try:
                        job.last_date_to_apply = datetime.strptime(data['last_date_to_apply'], '%Y-%m-%d').date()
                    except ValueError:
                        return jsonify({'message': 'Invalid last_date_to_apply format. Use YYYY-MM-DD'}), 400
                
        # Handle gender eligibility
        if 'gender_eligibility' in data:
            valid_genders = ['all', 'male', 'female']
            if data['gender_eligibility'].lower() not in valid_genders:
                return jsonify({'message': 'Invalid gender_eligibility value'}), 400
            job.gender_eligibility = data['gender_eligibility'].lower()
            
        # Handle eligible branches
        # if 'eligible_branches' in data:
        #     job.eligible_branches = data['eligible_branches']
            
        # Handle file updates
         # Process files if any
        if 'file' in request.files:
            file = request.files.get('file')  # Get single file instead of a list
            if file and file.filename:     # Check if file exists and has a filename
        # Delete old file if it exists
                if job.additional_files:              # Assuming job.files stores the path to the previous file
                    full_path = os.path.join(current_app.config['UPLOAD_FOLDER'], job.additional_files)
                    if os.path.exists(full_path):
                        os.remove(full_path)
        # Save new file
                unique_id = str(uuid.uuid4())
                job.files = save_file(
                    file, current_app.config['UPLOAD_FOLDER'], 'jobs', 'files', unique_id)

        
        # Update notifications if eligibility criteria changed
        # company = Companies.query.get(job.company_id)
        # company_name = company.company_name if company else "Unknown Company"
        

        db.session.commit()
        
        return jsonify({'message': 'Job updated successfully', 'job_id': job.job_id}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating job {job_id}: {str(e)}")
        return jsonify({'message': 'Failed to update job', 'error': str(e)}), 500

@main.route('/<int:job_id>', methods=['DELETE'])
@jwt_required()
def delete_job(job_id):
    """Delete a job posting"""
    # Check if user has admin role
    claims = get_jwt()
    if claims.get('role') not in ['admin','cdpc']:
        return jsonify({'message': 'Unauthorized: Admin privileges required'}), 403
    
    try:
        job = Jobs.query.get_or_404(job_id)
        
        # Optionally notify students about job cancellation
        company = Companies.query.get(job.company_id)
        company_name = company.company_name if company else "Unknown Company"
        
        # Delete associated files if any
        if job.files:
            file_paths = job.files.split(',')
            for file_path in file_paths:
                try:
                    if os.path.exists(file_path):
                        os.remove(file_path)
                except Exception as e:
                    current_app.logger.warning(f"Failed to delete file {file_path}: {str(e)}")
        
        db.session.delete(job)
        db.session.commit()
        
        # # Optional: Notify eligible students about cancellation
        # notify_job_cancellation(job, company_name)
        
        return jsonify({'message': 'Job deleted successfully', 'job_id': job_id}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting job {job_id}: {str(e)}")
        return jsonify({'message': 'Failed to delete job', 'error': str(e)}), 500

@main.route('/get-job/<int:job_id>', methods=['GET'])
def get_job(job_id):
    """Get details of a specific job"""
    try:
        job = Jobs.query.get_or_404(job_id)
        print(job)
        
        # Get company name
        company = Companies.query.get(job.company_id)
        company_name = company.company_name if company else "Unknown Company"
        
        job_data = {
            'id': job.job_id,
            'role': job.role,
            'company_id': job.company_id,
            'company_name': company_name,
            'job_location': job.job_location,
            'company_description': company.description,
            'website' : company.website,
            'company_type': company.company_type,
            'package': float(job.package) if job.package else 0.0,
            'job_description': job.job_description,
            'service_agreement': job.service_agreement,
            'links_for_registrations': job.links_for_registrations,
            'files': job.files.split(',') if job.files else [],
            'posted_date': job.posted_date.strftime('%Y-%m-%d'),
            'date_of_interview': job.date_of_interview.strftime('%Y-%m-%d'),
            'last_date_to_apply': job.last_date_to_apply.strftime('%Y-%m-%d'),
            'created_by': job.created_by,
            'min_gpa': float(job.min_gpa) if job.min_gpa else 0.0,
            'max_backlogs': job.max_backlogs,
            'gender_eligibility': job.gender_eligibility,
            'admin_id': job.admin_id
        }
        
        return jsonify({'message': 'Job retrieved successfully', 'job': job_data}), 200
        
    except Exception as e:

        return jsonify({'message': 'Failed to retrieve job', 'error': str(e)}), 500

@main.route('/jobs', methods=['GET'])
def get_all_jobs():
    """Get all job postings"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)

        # Correctly applying pagination
        paginated_jobs = Jobs.query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        jobs = paginated_jobs.items

        # Build the response data with all requested fields
        job_data = []
        for job in jobs:
            company = Companies.query.get(job.company_id)
            job_data.append({
                'id': job.job_id,
                'role': job.role,
                'company_id': job.company_id,
                'company_name': company.company_name if company else "Unknown",
                'job_location': job.job_location,
                'package': float(job.package) if job.package else 0.0,
                'posted_date': job.posted_date.strftime('%Y-%m-%d'),
                'date_of_interview': job.date_of_interview.strftime('%Y-%m-%d'),
                'last_date_to_apply': job.last_date_to_apply.strftime('%Y-%m-%d'),
                'min_gpa': float(job.min_gpa) if job.min_gpa else 0.0,
                'max_backlogs': job.max_backlogs,
                'gender_eligibility': job.gender_eligibility
            })

        # Build pagination metadata
        pagination_info = {
            'total': paginated_jobs.total,
            'page': paginated_jobs.page,
            'pages': paginated_jobs.pages,
            'per_page': paginated_jobs.per_page,
        }

        # Return the data with pagination info
        return jsonify({
            'jobs': job_data,
            'pagination': pagination_info
        }), 200

    except Exception as e:
        print("Error:", str(e))  # Debugging
        return jsonify({'message': 'Failed to retrieve jobs', 'error': str(e)}), 500

@main.route('/jobs/<int:job_id>/eligibility', methods=['GET'])
@jwt_required()
def check_eligibility(job_id):
    student_id = get_jwt_identity()
    student = Students.query.get(student_id)
    job = Jobs.query.get_or_404(job_id)

    # Check eligibility criteria
    eligible = (
        student.gpa >= job.min_gpa and
        student.backlogs <= job.max_backlogs 
    )

    # Check if the student has already applied
    already_applied = Applications.query.filter_by(student_id=student_id, job_id=job_id).first() is not None

    return jsonify({'eligible': eligible, 'already_applied': already_applied}), 200

@main.route('/<int:job_id>/register', methods=['POST'])
@jwt_required()
def register_job(job_id):
    """
    Register a student for a job posting with eligibility checks and notifications.
    """
    try:
        # Get JWT claims and user identity
        claims = get_jwt()
        user_id = get_jwt_identity()

        # Role-based access control
        # if claims.get('role') not in ['student']:
        #     return jsonify({'message': 'Unauthorized: Student role required'}), 403

        # Fetch job and student details
        job = Jobs.query.get_or_404(job_id)
        student = Students.query.get_or_404(user_id)

        # Check if already registered
        if Applications.query.filter_by(student_id=student.student_id, job_id=job.job_id).first():
            return jsonify({'message': 'You have already registered for this job'}), 400

        # placed_record = Placed_Students.query.filter_by(student_id=student.student_id).first()
        # if placed_record:
        #     current_package = placed_record.salary_offered
        #     if job.package < (current_package * 1.5):
        #         return jsonify({
        #             'message': f'Placed students can only register for jobs offering at least {current_package * 1.5} (1.5x current package of {current_package})'
        #         }), 403
        # Eligibility checks
        # if not is_student_eligible(student, job):
        #     return jsonify({'message': 'You are not eligible for this job'}), 403

        # Check application deadline
        if job.last_date_to_apply < datetime.now().date():
            return jsonify({'message': 'Application deadline has passed'}), 400

        # Create new registration
        registration = Applications(
            job_id=job_id,
            student_id=user_id,
            status='applied',
            applied_date=datetime.now().date()
        )
        db.session.add(registration)
        db.session.commit()

        # Send confirmation email
        # send_registration_confirmation(student, job)

        return jsonify({
            'message': 'Successfully registered for the job',
            'application_id': registration.application_id
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to register for job', 'error': str(e)}), 500


@main.route('/student/applied-jobs', methods=['GET'])
@jwt_required()
def get_student_applied_jobs():
    """
    API endpoint to get all jobs a specific student has applied to.
    The student_id is extracted from the JWT token.
    """
    try:
        # Fetch the student
        student_id = get_jwt_identity()
        student = Students.query.get(student_id)
        if not student:
            raise Exception("Student not found")

        # Prepare student details
        student_details = {
            'student_id': student.student_id,
            'full_name': f"{student.first_name} {student.last_name}",
            'email': student.email,
            'roll_number': student.reg_no,
            'cgpa': float(student.current_gpa) if student.current_gpa else None
        }

        # Query all applications for the given student_id
        applications = Applications.query.filter_by(student_id=student_id).all()
        print(applications)
        if not applications:
            return {
                'student': student_details,
                'applications': []
            }

        # Prepare the list of applied jobs
        applied_jobs = []
        for app in applications:
            job = app.job
            if not job:
                continue

            company = job.company if job else None
            job_data = {
                'application_id': app.application_id,
                'job_id': job.job_id,
                'job_role': job.role if job else "Unknown",
                'job_package': float(job.package) if job and job.package else None,
                'job_location': job.job_location if job else None,
                'company': {
                    'company_id': company.company_id if company else None,
                    'company_name': company.company_name if company else "Unknown",
                    'website': company.website if company and company.website else None,
                    'company_type': company.company_type if company and company.company_type else None
                },
                'interview_date': job.date_of_interview.strftime('%b. %d, %Y') if job and job.date_of_interview else "TBD",
                'published_on': job.posted_date.strftime('%b. %d, %Y, %I:%M %p.') if job and job.posted_date else "Unknown",
                'last_date_to_apply': job.last_date_to_apply.strftime('%b. %d, %Y, %I:%M %p.') if job and job.last_date_to_apply else "Unknown",
                'applied_date': app.applied_date.strftime('%b. %d, %Y, %I:%M %p.') if app.applied_date else "Unknown",
                'job_status': app.status
            }

            # Determine job status (Upcoming, Ongoing, Completed, Offers)
            current_date = datetime.now().date()
            interview_date = job.date_of_interview if job and job.date_of_interview else None
            last_date_to_apply = job.last_date_to_apply if job and job.last_date_to_apply else None

            if interview_date and interview_date < current_date:
                job_status = "Completed"
            elif last_date_to_apply and last_date_to_apply < current_date:
                job_status = "Completed"
            elif interview_date and interview_date == current_date:
                job_status = "Ongoing"
            else:
                job_status = "Upcoming"

            # if app.status == "offered":
            #     job_status = "Offers"

            job_data['job_status'] = job_status
            applied_jobs.append(job_data)

        return {
            'student': student_details,
            'applications': applied_jobs,
            'total_applications': len(applied_jobs)
        }

    except Exception as e:
        raise Exception(f"Error retrieving student applications: {str(e)}")

@main.route('/student/eligible-jobs', methods=['GET'])
@jwt_required()
def get_eligible_jobs():
    try:
        # Get the current student's ID from JWT token
        student_id = get_jwt_identity()

        # Fetch the student
        student = Students.query.filter_by(student_id=student_id).first()
        if not student:
            return jsonify({"error": "Student not found"}), 404

        # Get student's CGPA
        student_cgpa = student.current_gpa
        if student_cgpa is None:
            return jsonify({"error": "Student CGPA not available"}), 400

        # Fetch all jobs and filter by eligibility (min_gpa <= student_cgpa)
        eligible_jobs = Jobs.query.filter(Jobs.min_gpa <= student_cgpa).all()
        eligible_jobs_count = len(eligible_jobs)

        # Optionally, exclude jobs the student has already applied to
        applied_job_ids = [app.job_id for app in student.applications]
        eligible_jobs = [job for job in eligible_jobs if job.job_id not in applied_job_ids]
        eligible_jobs_count_excluding_applied = len(eligible_jobs)
       
        # Serialize eligible jobs (optional, for detailed response)
        eligible_jobs_list = [{
            "job_id": job.job_id,
            "job_role": job.role,
            "min_gpa": job.min_gpa,
            "job_location": job.job_location,
            "package": job.package,
            "posted_date": job.posted_date.isoformat() if job.posted_date else None,
            "last_date_to_apply": job.last_date_to_apply.isoformat() if job.last_date_to_apply else None
        } for job in eligible_jobs]

        return jsonify({
            "student_id": student_id,
            "cgpa": student_cgpa,
            "eligible_jobs_count": eligible_jobs_count,
            "eligible_jobs_count_excluding_applied": eligible_jobs_count_excluding_applied,
            "eligible_jobs": eligible_jobs_list
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@main.route('/tpo/jobs', methods=['GET'])
@jwt_required()
def get_tpo_jobs():
    try:
        tpo_identity = get_jwt_identity()  # e.g., TPO's email or ID
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)

        admin = Admin_Users.query.get_or_404(tpo_identity)
        # Query jobs created by the TPO
        jobs_query = Jobs.query.filter_by(admin_id=admin.admin_id).paginate(
            page=page, per_page=per_page, error_out=False
        )

        jobs = [{
            'job_id': job.job_id,
            'company_name': Companies.query.filter_by(company_id=job.company_id).first().company_name if job.company_id else "Unknown",
            'job_role': job.role,
            'job_location': job.job_location,
            'min_gpa': job.min_gpa,
            'package': job.package,
            'posted_date': job.posted_date.isoformat() if job.posted_date else None,
            'last_date_to_apply': job.last_date_to_apply.isoformat() if job.last_date_to_apply else None,
            'created_by': job.created_by
        } for job in jobs_query.items]

        return jsonify({
            'jobs': jobs,
            'total': jobs_query.total,
            'pages': jobs_query.pages,
            'current_page': jobs_query.page
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500