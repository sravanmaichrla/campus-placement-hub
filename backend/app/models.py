from app.database import db
from datetime import date
import datetime
class Students(db.Model):
    __tablename__ = 'student'
    student_id = db.Column(db.Integer, primary_key=True)
    reg_no = db.Column(db.String(255), nullable=False, unique=True)
    email = db.Column(db.String(255), nullable=False, unique=True)
    password = db.Column(db.String(255), nullable=False)
    contact_no = db.Column(db.String(10))
    gender = db.Column(db.String(255))
    first_name = db.Column(db.String(255), nullable=False)
    last_name = db.Column(db.String(255), nullable=False)
    batch = db.Column(db.String(255))
    specialization = db.Column(db.String(255))
    degree = db.Column(db.String(255))
    skills = db.Column(db.Text)
    current_gpa = db.Column(db.Float(10, 2))
    resume_url = db.Column(db.String(255))
    backlogs = db.Column(db.Integer,default=0)
    certificate_urls = db.Column(db.Text)
    dob = db.Column(db.Date)
    picture = db.Column(db.String(255), nullable=True)
    role = db.Column(db.String(8), default='student')

    # father_mobile_no = db.Column(db.Integer)
    # father_name = db.Column(db.String(255), nullable=False)
    # mother_name = db.Column(db.String(255), nullable=False)
    # Relationships
    applications = db.relationship('Applications', backref='student')
    placed_students = db.relationship('Placed_Students', backref='student')
    
    def __repr__(self):
        return f'<Student {self.name}>'

# class Student_details(db.Model):
#     __tablename__ = 'student_acadamic_details'
#     registered_id = db.Column(db.String(255), primary_key=True)
#     student_id = db.Column(db.Integer, db.ForeignKey('student.student_id'), nullable=False)

#     # placement_policy = db.Column(db.String(255))
    
    def __repr__(self):
        return f'<StudentDetails {self.first_name} {self.last_name}>'

class Admin_Users(db.Model):
    __tablename__ = 'admin_details'
    admin_id = db.Column(db.Integer, primary_key=True)
    admin_name = db.Column(db.String(255), nullable=False)
    password = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True)
    role = db.Column(db.String(255), nullable=False)
    department = db.Column(db.String(255))
    
    # Added relationship to jobs
    jobs = db.relationship('Jobs', backref='admin')
    
    def __repr__(self):
        return f'<Admin {self.username}>'

class Jobs(db.Model):
    __tablename__ = 'jobs'
    job_id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.company_id'), nullable=False)
    job_location = db.Column(db.String(255))
    role = db.Column(db.String(255))
    package = db.Column(db.Float(10, 2))
    job_description = db.Column(db.Text)
    service_agreement = db.Column(db.Text)
    links_for_registrations = db.Column(db.String(255))
    files = db.Column(db.String(255))
    posted_date = db.Column(db.Date, default=lambda: datetime.utcnow().date())
    last_date_to_apply = db.Column(db.Date)
    date_of_interview = db.Column(db.Date)
    created_by = db.Column(db.String(255))
    min_gpa = db.Column(db.Float(10, 2))
    max_backlogs = db.Column(db.Integer)
    gender_eligibility = db.Column(db.String(6))
    admin_id = db.Column(db.Integer, db.ForeignKey('admin_details.admin_id'))
    
    # Relationships
    applications = db.relationship('Applications', backref='job')
    placed_students = db.relationship('Placed_Students', backref='job')
    
    def __repr__(self):
        return f'<Job {self.role} at {self.company.company_name}>'

class Companies(db.Model):
    __tablename__ = 'companies'
    company_id = db.Column(db.Integer, primary_key=True)
    company_name = db.Column(db.String(255), nullable=False)
    company_type = db.Column(db.String(255))
    website = db.Column(db.String(255))
    description = db.Column(db.Text)
    contact_person = db.Column(db.String(255))
    address = db.Column(db.String(255))
    
    # Relationships
    jobs = db.relationship('Jobs', backref='company')
    
    def __repr__(self):
        return f'<Company {self.company_name}>'

class Applications(db.Model):
    __tablename__ = 'job_applied_students'
    application_id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.job_id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('student.student_id'), nullable=False)
    status = db.Column(db.String(255),default="pending")
    applied_date = db.Column(db.Date, default=datetime.datetime.now())
    

    def __repr__(self):
        return f'<Application {self.application_id}>'

class Placed_Students(db.Model):
    __tablename__ = 'placed_students'
    placement_id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student.student_id'), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.company_id'), nullable=False)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.job_id'), nullable=False)
    date_of_interview = db.Column(db.Date)
    offer_letter_url = db.Column(db.String(255))
    joining_date = db.Column(db.Date)
    salary_offered = db.Column(db.Float(10, 2))
    status = db.Column(db.String(255), default="pending")
    def __repr__(self):
        return f'<PlacedStudent {self.placement_id}>'
