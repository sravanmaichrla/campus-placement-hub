from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity,get_jwt
from app.database import db
# from app.models import Job, JobRegistered
from app.utils import save_file
import uuid
import os
from app.models import Students,Admin_Users,Jobs,Companies, Placed_Students,Applications


main = Blueprint('placements', __name__)

@main.route('/add-placed-students', methods=['POST'])
@jwt_required()
def create_placed_student():
    """
    Create a new placed student record.
    Expects JSON: {student_id, company_id, job_id, date_of_interview, offer_letter_url, joining_date, salary_offered, placement_status}
    """
    claims = get_jwt()
    if claims.get('role') not in ['admin','cdpc']:
        return jsonify({'message': 'Unauthorized: Admin privileges required'}), 403

    try:
        data = request.get_json()
        if not all(k in data for k in ['student_id', 'company_id', 'job_id', 'salary_offered']):
            return jsonify({'message': 'Missing required fields'}), 400

        # Validate foreign keys
        student = Students.query.get(data['reg_no'])
        company = Companies.query.get(data['company_id'])
        job = Jobs.query.get(data['job_id'])
        if not student:
            return jsonify({'message': 'Student not found'}), 404
        if not company:
            return jsonify({'message': 'Company not found'}), 404
        if not job:
            return jsonify({'message': 'Job not found'}), 404

        # Parse dates if provided
        date_of_interview = datetime.strptime(data.get('date_of_interview'), '%Y-%m-%d').date() if data.get('date_of_interview') else None
        joining_date = datetime.strptime(data.get('joining_date'), '%Y-%m-%d').date() if data.get('joining_date') else None

        # Check if student is already placed
        # existing_placement = Placed_Students.query.filter_by(student_id=data['student_id']).first()
        # if existing_placement:
        #     return jsonify({'message': 'Student is already placed'}), 409

        # Create new record
        placed_student = Placed_Students(
            student_id=data['student_id'],
            company_id=data['company_id'],
            job_id=data['job_id'],
            date_of_interview=date_of_interview,
            offer_letter_url=data.get('offer_letter_url', ''),
            joining_date=joining_date,
            salary_offered=float(data['salary_offered']),
        )
        db.session.add(placed_student)
        db.session.commit()

        return jsonify({
            'message': 'Placed student record created successfully',
            'placement_id': placed_student.placement_id
        }), 201

    except ValueError as e:
        db.session.rollback()
        return jsonify({'message': 'Invalid date format, use YYYY-MM-DD', 'error': str(e)}), 400
    except IntegrityError as e:
        db.session.rollback()
        return jsonify({'message': 'Database integrity error', 'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating placed student: {str(e)}")
        return jsonify({'message': 'Failed to create placed student', 'error': str(e)}), 500

# DELETE: Remove a placed student record
@main.route('/delete-placed-students/<int:placement_id>', methods=['DELETE'])
@jwt_required()
def delete_placed_student(placement_id):
    """
    Delete a placed student record by placement_id.
    """
    claims = get_jwt()
    if claims.get('role') not in ['admin','cdpc']:
        return jsonify({'message': 'Unauthorized: Admin privileges required'}), 403

    try:
        placed_student = Placed_Students.query.get_or_404(placement_id)
        db.session.delete(placed_student)
        db.session.commit()

        return jsonify({'message': f'Placed student record {placement_id} deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting placed student {placement_id}: {str(e)}")
        return jsonify({'message': 'Failed to delete placed student', 'error': str(e)}), 500

# PUT: Update a placed student record
@main.route('/edit-placed-students/<int:placement_id>', methods=['PUT'])
@jwt_required()
def update_placed_student(placement_id):
    """
    Update an existing placed student record.
    Expects JSON with any of: {student_id, company_id, job_id, date_of_interview, offer_letter_url, joining_date, salary_offered, placement_status}
    """
    claims = get_jwt()
    if claims.get('role') not in ['admin','cdpc']:
        return jsonify({'message': 'Unauthorized: Admin privileges required'}), 403

    try:
        placed_student = Placed_Students.query.get_or_404(placement_id)
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No data provided for update'}), 400

        # Update fields if provided
        if 'student_id' in data:
            student = Students.query.get(data['student_id'])
            if not student:
                return jsonify({'message': 'Student not found'}), 404
            placed_student.student_id = data['student_id']
        
        if 'company_id' in data:
            company = Companies.query.get(data['company_id'])
            if not company:
                return jsonify({'message': 'Company not found'}), 404
            placed_student.company_id = data['company_id']
        
        if 'job_id' in data:
            job = Jobs.query.get(data['job_id'])
            if not job:
                return jsonify({'message': 'Job not found'}), 404
            placed_student.job_id = data['job_id']
        
        if 'date_of_interview' in data:
            placed_student.date_of_interview = datetime.strptime(data['date_of_interview'], '%Y-%m-%d').date() if data['date_of_interview'] else None
        
        if 'offer_letter_url' in data:
            placed_student.offer_letter_url = data['offer_letter_url']
        
        if 'joining_date' in data:
            placed_student.joining_date = datetime.strptime(data['joining_date'], '%Y-%m-%d').date() if data['joining_date'] else None
        
        if 'salary_offered' in data:
            placed_student.salary_offered = float(data['salary_offered'])
        

        db.session.commit()

        return jsonify({'message': f'Placed student record {placement_id} updated successfully'}), 200

    except ValueError as e:
        db.session.rollback()
        return jsonify({'message': 'Invalid date format, use YYYY-MM-DD', 'error': str(e)}), 400
    except IntegrityError as e:
        db.session.rollback()
        return jsonify({'message': 'Database integrity error', 'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating placed student {placement_id}: {str(e)}")
        return jsonify({'message': 'Failed to update placed student', 'error': str(e)}), 500


# GET: Retrieve a single placed student (for completeness, similar to your existing report)
@main.route('/all-placed-students', methods=['GET'])
@jwt_required()
def get_all_placed_students():
    """
    Retrieve a paginated list of all placed students.
    Query Parameters:
        - page (int): Page number (default: 1)
        - per_page (int): Number of items per page (default: 10)
    """
    claims = get_jwt()
    if claims.get('role') not in ['admin', 'cdpc']:
        return jsonify({'message': 'Unauthorized: Admin or CDPC privileges required'}), 403

    try:
        # Get pagination parameters from query string
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)

        # Ensure reasonable limits
        if per_page > 100:  # Optional: Cap the maximum items per page
            per_page = 100
        if page < 1:
            page = 1

        # Query with pagination
        paginated_query = Placed_Students.query.paginate(
            page=page,
            per_page=per_page,
            error_out=False  # Returns empty list if page is out of range instead of 404
        )

        # Build report for each placed student
        report = [{
            'placement_id': ps.placement_id,
            'student_id': ps.student_id,
            'student_name': f"{Students.query.get(ps.student_id).first_name} {Students.query.get(ps.student_id).last_name}",
            'reg_no': Students.query.get(ps.student_id).reg_no,
            'company_name': Companies.query.get(ps.company_id).company_name.capitalize(),
            'job_role': Jobs.query.get(ps.job_id).role,
            'salary_offered': float(ps.salary_offered) if ps.salary_offered else None,
            'joining_date': ps.joining_date.strftime('%Y-%m-%d') if ps.joining_date else None,
            'date_of_interview': ps.date_of_interview.strftime('%Y-%m-%d') if ps.date_of_interview else None,
            'offer_letter_url': ps.offer_letter_url,
            'placement_status': ps.status  # Added for completeness
        } for ps in paginated_query.items]

        # Response with pagination metadata
        response = {
            'message': 'List of placed students',
            'data': report,
            'pagination': {
                'total': paginated_query.total,
                'pages': paginated_query.pages,
                'current_page': paginated_query.page,
                'per_page': paginated_query.per_page,
                'has_next': paginated_query.has_next,
                'has_prev': paginated_query.has_prev
            }
        }

        return jsonify(response), 200

    except Exception as e:
        current_app.logger.error(f"Error retrieving placed students: {str(e)}")
        return jsonify({'message': 'Failed to retrieve placed students', 'error': str(e)}), 500



@main.route('/get/<int:student_id>', methods=['GET'])
@jwt_required()
def get_student_placement_company(student_id):
    try:
        if not student_id:
            return jsonify({'message': 'student_id is required'}), 400

        # claims = get_jwt()
        # user_id = get_jwt_identity()

        # # If the user is a student, ensure they can only access their own data
        # if claims.get('role') == 'student' and user_id != student_id:
        #     return jsonify({'message': 'Unauthorized: You can only access your own data'}), 403

        # Check if the student exists
        student = Students.query.get(student_id)
        if not student:
            return jsonify({'message': 'Student not found'}), 404

        # Query placement records for the student
        placements = Placed_Students.query.filter_by(student_id=student.student_id).all()
        if not placements:
            return jsonify({'message': 'Student has not been placed yet'}), 404

        # Build response
        data = [
            {
                'id': placement.placement_id,
                'student_id': student_id,
                'student_name': f"{student.first_name} {student.last_name}",
                'reg_no': student.reg_no,
                'company_id': placement.company_id,
                'company_name': Companies.query.get(placement.company_id).company_name.capitalize(),
                'job_role': Jobs.query.get(placement.job_id).role,
                'salary_offered': float(placement.salary_offered) if placement.salary_offered else None,
                'joining_date': placement.joining_date.strftime('%Y-%m-%d') if placement.joining_date else None,
                'date_of_interview': placement.date_of_interview.strftime('%Y-%m-%d') if placement.date_of_interview else None,
                'offer_letter_url': placement.offer_letter_url if placement.offer_letter_url else None,
                'status': placement.status if placement.status else 'Not Submitted'
            } for placement in placements
        ]

        return jsonify({'message': f'Placement details for student {student.first_name} {student.last_name}', 'data': data}), 200

    except Exception as e:
        current_app.logger.error(f"Error retrieving placement company for student: {str(e)}")
        return jsonify({'message': 'Failed to retrieve placement company', 'error': str(e)}), 500


@main.route('/upload-offer-letter', methods=['POST'])
@jwt_required()
def upload_offer_letter():
    try:
        user_id = get_jwt_identity()
        claims = get_jwt()

        # if claims.get('role') != 'student':
        #     return jsonify({'message': 'Unauthorized: Student privileges required'}), 403

        # if 'student_id' not in request.form or int(request.form['student_id']) != user_id:
        #     return jsonify({'message': 'Unauthorized: You can only upload your own offer letter'}), 403

        if 'placement_id' not in request.form:
            return jsonify({'message': 'Placement ID is required'}), 400

        student_id = int(request.form['student_id'])
        placement_id = int(request.form['placement_id'])
        placement_status = request.form.get('status', '')
        placement = Placed_Students.query.filter_by(student_id = student_id , placement_id = placement_id).first()
        # Validate placement_status
        if placement_status and placement_status not in ['Yes', 'No']:
            return jsonify({'message': 'Invalid placement status. Must be "Yes" or "No"'}), 400
        
        offer_letter_url = request.files.get('offer_letter_url')
        if offer_letter_url:
            offer_path = save_file(
                offer_letter_url, current_app.config['UPLOAD_FOLDER'], 'student', 'offerletters', str(student_id))
            if offer_path:
                placement.offer_letter_url = offer_path
            elif offer_path is None:
                return jsonify({'message': 'Invalid resume file type'}), 400

        # Update the Placed_Students record
        
        if not placement or placement.student_id != student_id:
            return jsonify({'message': 'Placement record not found or unauthorized'}), 404

        if placement_status:
            placement.status = placement_status

        db.session.commit()

        return jsonify({
            'message': 'Details updated successfully',
            'offer_letter': placement.offer_letter_url,
            'placement_status': placement.status,
            'placement_id': placement_id
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error updating placement details: {str(e)}")
        return jsonify({'message': 'Failed to update placement details', 'error': str(e)}), 500