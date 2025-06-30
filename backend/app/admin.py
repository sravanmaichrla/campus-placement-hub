from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView
from flask_admin.model import filters

from flask_admin.babel import lazy_gettext
from flask_admin.contrib.sqla import tools
from sqlalchemy.sql import not_, or_

# Initialize admin instance (without app for now)
admin = Admin(name='Admin Panel', template_mode='bootstrap4')

class StudentsAdmin(ModelView):
    column_list = ('student_id', 'first_name', 'last_name','reg_no', 'email', 'contact_no', 'gender','dob',
                  'degree', 'batch', 'specialization', 'current_gpa',
                  'backlogs')
    column_searchable_list = ('email', 'reg_no','backlogs','current_gpa','gender')
    column_filters = ('reg_no','gender','backlogs')
    form_excluded_columns = ('applications', 'placed_students')
    can_export = True


class AdminUsersAdmin(ModelView):
    column_list = ('admin_id', 'admin_name', 'email', 'role', 'department')
    column_searchable_list = ('admin_name', 'email')
    column_filters = ('role', 'department')
    form_excluded_columns = ('password_hash', 'jobs')
    can_export = True

class JobsAdmin(ModelView):
    column_list = ('job_id', 'company_id','company_name','role', 'job_location', 'package', 
                  'posted_date', 'last_date_to_apply', 'min_gpa','date_of_interview')
    column_searchable_list = ('role', 'job_location')
    column_filters = ('posted_date', 'last_date_to_apply', 'min_gpa', 'company_id')
    form_excluded_columns = ('applications', 'placed_students')
    can_export = True

class CompaniesAdmin(ModelView):
    column_list = ('company_id', 'company_name', 'company_type', 'website', 'contact_person')
    column_searchable_list = ('company_name', 'company_type', 'contact_person')
    column_filters = ('company_type',)
    form_excluded_columns = ('jobs',)
    can_export = True

class ApplicationsAdmin(ModelView):
    column_list = ('application_id', 'job_id', 'student_id', 'status', 'applied_date')
    column_searchable_list = ('status','student_id')
    column_filters = ('status', 'applied_date', 'job_id')
    can_export = True

class PlacedStudentsAdmin(ModelView):
    column_list = ('placement_id','student_id','company_id','reg_no','first_name','last_name','specialization','degree','role','salary_offered','date_of_interview','job_location'
                   )
    column_searchable_list = ('placement_id',)
    column_filters = ('salary_offered',)
    can_export = True