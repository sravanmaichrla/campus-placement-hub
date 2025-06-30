from flask import Flask, send_from_directory
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_mail import Mail
from config import Config
from app.database import db
import redis
import os
from datetime import date
from flask_admin import Admin
from app.admin import *
from dotenv import load_dotenv

load_dotenv()


migrate = Migrate()
bcrypt = Bcrypt()
jwt = JWTManager()
mail = Mail()
admin = Admin()


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)
    admin.init_app(app)
    CORS(app)
    # CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}},supports_credentials=True)

    print("Loaded JWT_SECRET_KEY:", app.config["JWT_SECRET_KEY"])

    # Initialize Redis
    app.redis = redis.Redis(
        host=app.config['REDIS_HOST'],
        port=app.config['REDIS_PORT'],
        password=app.config['REDIS_PASSWORD'],
        decode_responses=True  # Returns strings instead of bytes
    )

    # Ensure uploads folder exists
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])

    
    # Import and register models
    from app.models import Students, Jobs, Companies, Applications, Placed_Students, Admin_Users
    
    from app.routes import auth, users, jobs,reports,placed,applications
    app.register_blueprint(auth.main, url_prefix='/auth')
    app.register_blueprint(users.main, url_prefix='/users')
    app.register_blueprint(jobs.main, url_prefix='/job')
    app.register_blueprint(reports.main, url_prefix='/reports')
    app.register_blueprint(placed.main, url_prefix='/placements')
    app.register_blueprint(applications.main, url_prefix='/placed')
    
    
    @app.route('/uploads/<path:filename>')
    def serve_uploaded_file(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    
    admin.add_view(StudentsAdmin(Students, db.session))
    admin.add_view(AdminUsersAdmin(Admin_Users, db.session))
    admin.add_view(JobsAdmin(Jobs, db.session))
    admin.add_view(CompaniesAdmin(Companies, db.session))
    admin.add_view(ApplicationsAdmin(Applications, db.session))
    admin.add_view(PlacedStudentsAdmin(Placed_Students, db.session))

    
    return app