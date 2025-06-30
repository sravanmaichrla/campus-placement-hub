from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.database import db
# from app.models import Job, JobRegistered
from app.utils import save_file
import uuid
import os
from app.models import Students,Admin_Users,Jobs,Companies, Placed_Students,Applications
from datetime import datetime, timedelta, date
main = Blueprint('placed', __name__) 

# Add a new placed student
@main.route('/placed_students', methods=['POST'])
def add_placed_student():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['student_id', 'company_id', 'job_id']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        # Create new placed student instance
        new_placement = Placed_Students(
            student_id=data['student_id'],
            company_id=data['company_id'],
            job_id=data['job_id'],
            date_of_interview=datetime.strptime(data.get('date_of_interview'), '%Y-%m-%d').date() if data.get('date_of_interview') else None,
            offer_letter_url=data.get('offer_letter_url'),
            joining_date=datetime.strptime(data.get('joining_date'), '%Y-%m-%d').date() if data.get('joining_date') else None,
            salary_offered=data.get('salary_offered')
        )

        db.session.add(new_placement)
        db.session.commit()

        return jsonify({
            'message': 'Placed student added successfully',
            'placement_id': new_placement.placement_id
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Update existing placed student
@main.route('/placed_students/<int:placement_id>', methods=['PUT'])
def update_placed_student(placement_id):
    try:
        placement = Placed_Students.query.get_or_404(placement_id)
        data = request.get_json()

        # Update fields if they exist in the request
        if 'student_id' in data:
            placement.student_id = data['student_id']
        if 'company_id' in data:
            placement.company_id = data['company_id']
        if 'job_id' in data:
            placement.job_id = data['job_id']
        if 'date_of_interview' in data:
            placement.date_of_interview = datetime.strptime(data['date_of_interview'], '%Y-%m-%d').date() if data['date_of_interview'] else None
        if 'offer_letter_url' in data:
            placement.offer_letter_url = data['offer_letter_url']
        if 'joining_date' in data:
            placement.joining_date = datetime.strptime(data['joining_date'], '%Y-%m-%d').date() if data['joining_date'] else None
        if 'salary_offered' in data:
            placement.salary_offered = data['salary_offered']

        db.session.commit()

        return jsonify({'message': 'Placed student updated successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Delete a placed student
@main.route('/placed_students/<int:placement_id>', methods=['DELETE'])
def delete_placed_student(placement_id):
    try:
        placement = Placed_Students.query.get_or_404(placement_id)
        
        db.session.delete(placement)
        db.session.commit()

        return jsonify({'message': 'Placed student deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Optional: Get a specific placed student (for testing/verification)
@main.route('/placed_students/<int:placement_id>', methods=['GET'])
def get_placed_student(placement_id):
    try:
        placement = Placed_Students.query.get_or_404(placement_id)
        student = Students.query.get(placement.student_id)
        return jsonify({
            'placement_id': placement.placement_id,
            'student_id': placement.student_id,
            'company_id': placement.company_id,
            'job_id': placement.job_id,
            'date_of_interview': placement.date_of_interview.isoformat() if placement.date_of_interview else None,
            'offer_letter_url': placement.offer_letter_url,
            'joining_date': placement.joining_date.isoformat() if placement.joining_date else None,
            'salary_offered': float(placement.salary_offered) if placement.salary_offered else None
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@main.route('/companies', methods=['GET'])
@jwt_required()
def get_companies():
    companies = Companies.query.all()
    return jsonify([{
        'company_id': c.company_id,
        'company_name': c.company_name
    } for c in companies]), 200

# Fetch students who applied to a company’s jobs
@main.route('/companies/<int:company_id>/students', methods=['GET'])
@jwt_required()
def get_company_students(company_id):
    company = Companies.query.get_or_404(company_id)
    # Assuming students who applied to jobs from this company
    students = db.session.query(Students).join(Applications).join(Jobs).filter(
        Jobs.company_id == company.company_id
    ).all()
    print(students)
    return jsonify({
        'students': [{
            'student_id': s.student_id,
            'first_name': s.first_name,
            'last_name': s.last_name,
            'reg_no': s.reg_no
        } for s in students]
    }), 200

# Fetch jobs offered by a company
@main.route('/companies/<int:company_id>/jobs', methods=['GET'])
@jwt_required()
def get_company_jobs(company_id):
    company = Companies.query.get_or_404(company_id)
    jobs = Jobs.query.filter_by(company_id=company.company_id).all()
    return jsonify({
        'jobs': [{
            'job_id': j.job_id,
            'job_role': j.role,
            # 'company_name': 
        } for j in jobs]
    }), 200