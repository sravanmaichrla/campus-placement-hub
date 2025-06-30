from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required,get_jwt,get_jwt_identity
from app.models import Jobs, Students, Companies, Placed_Students, Applications
from app.utils import save_file
from sqlalchemy import func
from io import BytesIO
from app.database import db
import pandas as pd
from openpyxl import Workbook  # For creating and manipulating Excel files
from flask import send_file

main = Blueprint('reports', __name__)

@main.route('/placed-students', methods=['GET'])
@jwt_required()
def report_placed_students():
    claims = get_jwt()
    if claims.get('role') not in ['admin', 'cdpc']:  # Fixed 'cdpo' to 'cdpc'
        return jsonify({'message': 'Unauthorized: Admin or CDPC role required'}), 403

    year = request.args.get('year', type=int)
    query = Placed_Students.query
    if year:
        query = query.filter(db.extract('year', Placed_Students.joining_date) == year)

    placed_students = query.all()
    print(len(placed_students))
    report = [{
        'placement_id': ps.placement_id,
        'student_Reg': Students.query.get(ps.student_id).reg_no,
        'student_name': f"{Students.query.get(ps.student_id).first_name} {Students.query.get(ps.student_id).last_name}",
        'company_name': Companies.query.get(ps.company_id).company_name.capitalize(),
        'job_role': Jobs.query.get(ps.job_id).role,
        'salary_offered': float(ps.salary_offered) if ps.salary_offered else None,
        'joining_date': ps.joining_date.strftime('%Y-%m-%d') if ps.joining_date else None,
        'branch': Students.query.get(ps.student_id).specialization,
        'gender': Students.query.get(ps.student_id).gender
    } for ps in placed_students]

    if request.args.get('format') == 'excel':
        return generate_excel(report, 'placed_students.xlsx', [
            'Placement ID', 'Roll No', 'Student Name', 'Company Name', 'Job Role', 
            'Salary Offered', 'Joining Date', 'Branch', 'Gender'
        ])

    return jsonify({'message': 'Placed students report', 'data': report, 'total': len(report)}), 200

@main.route('/eligible-students/<int:job_id>', methods=['GET'])
@jwt_required()
def report_eligible_students(job_id):
    claims = get_jwt()
    if claims.get('role') not in ['admin', 'cdpc']:
        return jsonify({'message': 'Unauthorized: Admin or CDPC role required'}), 403

    job = Jobs.query.get_or_404(job_id)
    all_students = Students.query.all()
    eligible_students = [
        student for student in all_students
        if is_student_eligible(student, job) and (
            not Placed_Students.query.filter_by(student_id=student.id).first() or
            job.package >= (Placed_Students.query.filter_by(student_id=student.id).first().salary_offered * 1.5)
        )
    ]

    report = [{
        'Name': f"{student.first_name} {student.last_name}",
        'Registration No.': student.reg_no,
        'email': student.email,
        'gender': student.gender,
        'cgpa': float(student.current_gpa) if student.current_gpa else None,
        'branch': student.specialization,
        'backlogs': student.backlogs if hasattr(student, 'backlogs') else None
    } for student in eligible_students]

    if request.args.get('format') == 'excel':
        return generate_excel(report, f'eligible_students_job_{job_id}.xlsx', [
            'Name', 'Registration No.', 'Email', 'Gender', 'CGPA', 'Branch', 'Backlogs'
        ])

    return jsonify({'message': f'Eligible students for job {job_id}', 'data': report, 'total': len(report)}), 200

@main.route('/total-companies', methods=['GET'])
@jwt_required()
def report_total_companies():
    claims = get_jwt()
    if claims.get('role') not in ['admin', 'cdpc']:
        return jsonify({'message': 'Unauthorized: Admin or CDPC role required'}), 403

    total = Companies.query.count()
    report = [{'total_companies': total}]

    if request.args.get('format') == 'excel':
        return generate_excel(report, 'total_companies.xlsx', ['Total Companies'])

    return jsonify({'message': 'Total companies', 'data': {'total_companies': total}}), 200

@main.route('/total-jobs', methods=['GET'])
@jwt_required()
def report_total_jobs():
    claims = get_jwt()
    if claims.get('role') not in ['admin', 'cdpc']:
        return jsonify({'message': 'Unauthorized: Admin or CDPC role required'}), 403

    year = request.args.get('year', type=int)
    query = Jobs.query
    if year:
        query = query.filter(db.extract('year', Jobs.posted_date) == year)
    total = query.count()
    report = [{'total_jobs': total}]

    if request.args.get('format') == 'excel':
        return generate_excel(report, 'total_jobs.xlsx', ['Total Jobs'])

    return jsonify({'message': 'Total jobs', 'data': {'total_jobs': total}}), 200

@main.route('/highest-packages', methods=['GET'])
@jwt_required()
def report_highest_packages():
    claims = get_jwt()
    if claims.get('role') not in ['admin', 'cdpc']:
        return jsonify({'message': 'Unauthorized: Admin or CDPC role required'}), 403

    year = request.args.get('year', type=int)
    job_query = Jobs.query
    placement_query = Placed_Students.query
    if year:
        job_query = job_query.filter(db.extract('year', Jobs.posted_date) == year)
        placement_query = placement_query.filter(db.extract('year', Placed_Students.joining_date) == year)

    highest_job = job_query.order_by(Jobs.package.desc()).first()
    highest_placement = placement_query.order_by(Placed_Students.salary_offered.desc()).first()

    report = []
    if highest_job:
        report.append({
            'type': 'Job', 'role': highest_job.role,
            'company_name': Companies.query.get(highest_job.company_id).company_name,
            'package': float(highest_job.package) if highest_job.package else None
        })
    if highest_placement:
        student = Students.query.get(highest_placement.student_id)
        report.append({
            'type': 'Placement', 'student_name': f"{student.first_name} {student.last_name}",
            'company_name': Companies.query.get(highest_placement.company_id).company_name,
            'package': float(highest_placement.salary_offered) if highest_placement.salary_offered else None
        })

    if request.args.get('format') == 'excel':
        return generate_excel(report, 'highest_packages.xlsx', ['Type', 'Role/Student Name', 'Company Name', 'Package'])

    return jsonify({'message': 'Highest packages', 'data': report}), 200

@main.route('/students-placed-per-company', methods=['GET'])
@jwt_required()
def report_students_placed_per_company():
    claims = get_jwt()
    if claims.get('role') not in ['admin', 'cdpc']:
        return jsonify({'message': 'Unauthorized: Admin or CDPC role required'}), 403

    year = request.args.get('year', type=int)
    query = db.session.query(Placed_Students.company_id, func.count(Placed_Students.placement_id).label('count'))
    if year:
        query = query.filter(db.extract('year', Placed_Students.joining_date) == year)
    placement_counts = query.group_by(Placed_Students.company_id).all()

    report = [{
        'company_id': cid,
        'company_name': Companies.query.get(cid).company_name,
        'students_placed': count
    } for cid, count in placement_counts]

    if request.args.get('format') == 'excel':
        return generate_excel(report, 'students_placed_per_company.xlsx', ['Company ID', 'Company Name', 'Students Placed'])

    return jsonify({'message': 'Students placed per company', 'data': report, 'total': len(report)}), 200

@main.route('/applied-students/<int:job_id>', methods=['GET'])
@jwt_required()
def get_job_applied_students(job_id):
    """
    API endpoint to get all students who applied for a specific job.
    Only accessible to admins (TPO).
    
    Args:
        job_id (int): The ID of the job to query.
        download (query param): If set to 'excel', returns an Excel file.
        
    Returns:
        JSON response with the job details and list of applied students, or an Excel file.
    """
    try:
        # Authorization check: Only admins (TPO) can access
        claims = get_jwt()
        if claims.get('role') not in ['admin', 'cdpc']:
            return jsonify({'message': 'Unauthorized: Admin or CDPC role required'}), 403

        # Fetch the job
        job = Jobs.query.get(job_id)
        if not job:
            return jsonify({'message': 'Job not found'}), 404

        # Fetch the company
        company = job.company if job else None
        if not company:
            return jsonify({'message': 'Company not found for this job'}), 404

        # Prepare job details
        job_details = {
            'job_id': job.job_id,
            'job_role': job.role,
            'company_name': company.company_name
        }

        # Query all applications for the given job_id
        applications = Applications.query.filter_by(job_id=job_id).all()
        applied_students = []
        for app in applications:
            student = app.student
            if not student:
                continue

            student_data = {
                'application_id': app.application_id,
                'student_id': student.student_id,
                'full_name': f"{student.first_name} {student.last_name}",
                'roll_number': student.reg_no,
                'email': student.email,
                'branch': student.specialization if student.specialization else "N/A",
                'cgpa': float(student.current_gpa) if student.current_gpa else None,
                'applied_date': app.applied_date.strftime('%b. %d, %Y, %I:%M %p.') if app.applied_date else "N/A"
            }
            applied_students.append(student_data)
        
        filename = f"applied_students_{job_details['company_name']}.xlsx"
        # if request.args.get('format') == 'excel':
        #     return generate_excel(applied, 'applied_students_{job_details['company_name']}.xlsx', ['Roll Number', 'Full Name', 'Email','Branch','CGPA'])
        # Check if the request is for an Excel download
        # download_format = request.args.get('download', '').lower()
        if request.args.get('format') == 'excel':
            return generate_excel(applied_students, filename, ['Roll Number', 'Full Name', 'Email','Branch','CGPA'])

        # If not downloading, return JSON response
        return jsonify({
            'job': job_details,
            'students': applied_students
        }), 200

    except Exception as e:
        return jsonify({
            'message': 'Failed to retrieve applied students',
            'error': str(e)
        }), 500

@main.route('/placed-students-breakdown', methods=['GET'])
@jwt_required()
def report_placed_students_breakdown():
    claims = get_jwt()
    if claims.get('role') not in ['admin', 'cdpc']:
        return jsonify({'message': 'Unauthorized: Admin or CDPC role required'}), 403

    year = request.args.get('year', type=int)
    gender = request.args.get('gender')
    company_id = request.args.get('company_id', type=int)

    query = db.session.query(
        Students.gender,
        Placed_Students.company_id,
        Companies.company_name,
        func.count(Placed_Students.placement_id).label('count'),
        func.avg(Placed_Students.salary_offered).label('avg_salary')
    ).join(Placed_Students, Students.student_id == Placed_Students.student_id)\
     .join(Companies, Placed_Students.company_id == Companies.company_id)

    if year:
        query = query.filter(db.extract('year', Placed_Students.joining_date) == year)
    # if branch:
    #     query = query.filter(Students.specialization == branch)
    if gender:
        query = query.filter(Students.gender == gender)
    if company_id:
        query = query.filter(Placed_Students.company_id == company_id)

    breakdown = query.group_by(Students.specialization, Students.gender, Placed_Students.company_id, Companies.company_name).all()

    report = [{
        # 'branch': b.specialization,
        'gender': b.gender,
        'company_name': b.company_name,
        'students_placed': b.count,
        'avg_salary': float(b.avg_salary) if b.avg_salary else None
    } for b in breakdown]

    if request.args.get('format') == 'excel':
        return generate_excel(report, 'placed_students_breakdown.xlsx', [
            'Company Name', 'Branch', 'Gender', 'Students Placed', 'Average Salary'
        ])

    return jsonify({'message': 'Placed students breakdown', 'data': report, 'total': len(report)}), 200

def generate_excel(data, filename, headers):
    wb = Workbook()
    ws = wb.active
    ws.title = "Report"
    ws.append(headers)
    for row in data:
        values = [row.get(h.lower().replace(' ', '_').replace('.', ''), '') for h in headers]
        ws.append(values)
    excel_file = BytesIO()
    wb.save(excel_file)
    excel_file.seek(0)
    return send_file(
        excel_file,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=filename
    )

def is_student_eligible(student, job):
    if job.gender_eligibility != 'all' and student.gender != job.gender_eligibility:
        return False
    if job.min_gpa and job.min_gpa > 0 and student.current_gpa < job.min_gpa:
        return False
    if hasattr(student, 'backlogs') and job.max_backlogs is not None:
        if student.backlogs > job.max_backlogs:
            return False
    if job.eligible_branches:
        eligible_branches = [branch.strip() for branch in job.eligible_branches.split(',')]
        if student.branch not in eligible_branches:
            return False
    return True