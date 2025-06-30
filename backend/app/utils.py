import os
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, get_jwt
from werkzeug.utils import secure_filename


def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def save_file(file, upload_folder, context='jobs', file_type='file', identifier=None):
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        name, ext = os.path.splitext(filename)
        unique_name = f"{name}_{identifier}{ext}" if identifier else filename

        # Define subfolder structure: e.g., 'jobs/images', 'assignments/files'
        subfolder = os.path.join(
            context, 'images' if file_type == 'image' else 'files')
        destination_folder = os.path.join(upload_folder, subfolder)

        # Ensure the subdirectory exists
        if not os.path.exists(destination_folder):
            os.makedirs(destination_folder)

        # Save the file
        file_path = os.path.join(destination_folder, unique_name)
        file.save(file_path)

        # Return the relative path (e.g., 'jobs/images/image_1.jpg')
        return os.path.join(subfolder, unique_name)
    return None


