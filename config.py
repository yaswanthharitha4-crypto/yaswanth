import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'smart-waste-collection-secret-key-2026'
    
    # Database Configuration: Defaults to SQLite for instant local setup
    # To use MySQL, set USE_MYSQL = True and configure MySQL credentials below
    USE_MYSQL = os.environ.get('USE_MYSQL', 'False').lower() == 'true'
    
    MYSQL_HOST = os.environ.get('MYSQL_HOST', 'localhost')
    MYSQL_USER = os.environ.get('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', '')
    MYSQL_DB = os.environ.get('MYSQL_DB', 'smart_waste_db')
    MYSQL_PORT = int(os.environ.get('MYSQL_PORT', 3306))
    
    # SQLite fallback path
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(BASE_DIR, 'smart_waste.db')}"
    
    # File Uploads
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'gif'}
