import os
import sys
import json
from datetime import datetime
from functools import wraps

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

from config import Config
from database import get_db_connection, init_db


app = Flask(__name__)
app.config.from_object(Config)

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize database on start
with app.app_context():
    init_db()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# Decorators for Authentication & Role Access
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to access this page.', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def role_required(role):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user_id' not in session or session.get('role') != role:
                flash(f'Access denied. {role.capitalize()} privileges required.', 'danger')
                return redirect(url_for('index'))
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# --- ROUTES ---

@app.route('/')
def index():
    conn = get_db_connection()
    total = conn.execute("SELECT COUNT(*) FROM reports").fetchone()[0]
    completed = conn.execute("SELECT COUNT(*) FROM reports WHERE status = 'Completed'").fetchone()[0]
    pending = conn.execute("SELECT COUNT(*) FROM reports WHERE status = 'Pending'").fetchone()[0]
    workers = conn.execute("SELECT COUNT(*) FROM workers").fetchone()[0]
    conn.close()
    
    stats = {
        'total': total,
        'completed': completed,
        'pending': pending,
        'workers': workers
    }
    return render_template('index.html', stats=stats)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '').strip()

        conn = get_db_connection()
        user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        conn.close()

        if user and check_password_hash(user['password'], password):
            session['user_id'] = user['id']
            session['user_name'] = user['name']
            session['user_email'] = user['email']
            session['role'] = user['role']

            flash(f"Welcome back, {user['name']}!", 'success')
            
            if user['role'] == 'admin':
                return redirect(url_for('admin_dashboard'))
            elif user['role'] == 'worker':
                return redirect(url_for('worker_dashboard'))
            else:
                return redirect(url_for('user_dashboard'))
        else:
            flash('Invalid email or password. Please try again.', 'danger')

    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        email = request.form.get('email', '').strip()
        phone = request.form.get('phone', '').strip()
        address = request.form.get('address', '').strip()
        password = request.form.get('password', '').strip()
        confirm_password = request.form.get('confirm_password', '').strip()

        if password != confirm_password:
            flash('Passwords do not match.', 'danger')
            return render_template('register.html')

        conn = get_db_connection()
        existing = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        
        if existing:
            conn.close()
            flash('Email address is already registered.', 'warning')
            return render_template('register.html')

        hashed_pw = generate_password_hash(password)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO users (name, email, password, role, phone, address)
            VALUES (?, ?, ?, 'user', ?, ?)
        ''', (name, email, hashed_pw, phone, address))
        conn.commit()
        conn.close()

        flash('Registration successful! Please log in.', 'success')
        return redirect(url_for('login'))

    return render_template('register.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))

@app.route('/report', methods=['GET', 'POST'])
@login_required
def report_waste():
    if request.method == 'POST':
        waste_type = request.form.get('waste_type')
        description = request.form.get('description', '')
        latitude = request.form.get('latitude', type=float)
        longitude = request.form.get('longitude', type=float)
        address = request.form.get('address', '')
        phone = request.form.get('phone', '')

        # Image Handling
        image_url = None
        if 'image' in request.files:
            file = request.files['image']
            if file and file.filename != '' and allowed_file(file.filename):
                filename = secure_filename(f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}")
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)
                image_url = url_for('static', filename=f'uploads/{filename}')

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO reports (
                user_id, user_name, user_phone, waste_type, description, image_url,
                latitude, longitude, address, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
        ''', (
            session['user_id'], session['user_name'], phone, waste_type,
            description, image_url, latitude, longitude, address
        ))
        conn.commit()
        conn.close()

        flash('Waste report submitted successfully! Tracking number generated.', 'success')
        return redirect(url_for('user_dashboard'))

    return render_template('report.html')

@app.route('/user-dashboard')
@login_required
def user_dashboard():
    conn = get_db_connection()
    reports = conn.execute('''
        SELECT * FROM reports WHERE user_id = ? ORDER BY created_at DESC
    ''', (session['user_id'],)).fetchall()

    stats = {
        'total': len(reports),
        'pending': len([r for r in reports if r['status'] == 'Pending']),
        'in_progress': len([r for r in reports if r['status'] in ['Assigned', 'In Progress']]),
        'completed': len([r for r in reports if r['status'] == 'Completed'])
    }
    conn.close()
    return render_template('user_dashboard.html', reports=reports, stats=stats)

@app.route('/admin-dashboard')
@login_required
@role_required('admin')
def admin_dashboard():
    conn = get_db_connection()
    reports = conn.execute('SELECT * FROM reports ORDER BY created_at DESC').fetchall()
    workers = conn.execute('SELECT * FROM users WHERE role = "worker"').fetchall()
    
    total = len(reports)
    pending = len([r for r in reports if r['status'] == 'Pending'])
    in_progress = len([r for r in reports if r['status'] in ['Assigned', 'In Progress']])
    completed = len([r for r in reports if r['status'] == 'Completed'])

    stats = {
        'total': total,
        'pending': pending,
        'in_progress': in_progress,
        'completed': completed,
        'workers_count': len(workers)
    }
    conn.close()
    return render_template('admin_dashboard.html', reports=reports, workers=workers, stats=stats)

@app.route('/worker-dashboard')
@login_required
@role_required('worker')
def worker_dashboard():
    conn = get_db_connection()
    tasks = conn.execute('''
        SELECT * FROM reports WHERE worker_id = ? ORDER BY created_at DESC
    ''', (session['user_id'],)).fetchall()

    stats = {
        'total_assigned': len(tasks),
        'in_progress': len([t for t in tasks if t['status'] in ['Assigned', 'In Progress']]),
        'completed': len([t for t in tasks if t['status'] == 'Completed'])
    }
    conn.close()
    return render_template('worker_dashboard.html', tasks=tasks, stats=stats)

# --- API ENDPOINTS ---

@app.route('/api/stats')
def get_api_stats():
    conn = get_db_connection()
    
    # Reports by status
    status_counts = conn.execute('''
        SELECT status, COUNT(*) as count FROM reports GROUP BY status
    ''').fetchall()
    
    # Reports by category
    category_counts = conn.execute('''
        SELECT waste_type, COUNT(*) as count FROM reports GROUP BY waste_type
    ''').fetchall()

    conn.close()
    
    return jsonify({
        'status': {row['status']: row['count'] for row in status_counts},
        'categories': {row['waste_type']: row['count'] for row in category_counts}
    })

@app.route('/api/reports/<int:report_id>/assign', methods=['POST'])
@login_required
@role_required('admin')
def assign_worker(report_id):
    data = request.get_json() or {}
    worker_id = data.get('worker_id')
    
    if not worker_id:
        return jsonify({'error': 'Worker ID required'}), 400

    conn = get_db_connection()
    worker = conn.execute('SELECT * FROM users WHERE id = ? AND role = "worker"', (worker_id,)).fetchone()
    if not worker:
        conn.close()
        return jsonify({'error': 'Worker not found'}), 404

    cursor = conn.cursor()
    cursor.execute('''
        UPDATE reports 
        SET worker_id = ?, worker_name = ?, status = 'Assigned', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (worker['id'], worker['name'], report_id))
    
    # Update active task count
    cursor.execute('UPDATE workers SET active_tasks = active_tasks + 1 WHERE user_id = ?', (worker['id'],))
    
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': f'Task assigned to {worker["name"]}'})

@app.route('/api/reports/<int:report_id>/status', methods=['POST'])
@login_required
def update_report_status(report_id):
    status = request.form.get('status')
    worker_notes = request.form.get('notes', '')
    
    conn = get_db_connection()
    report = conn.execute('SELECT * FROM reports WHERE id = ?', (report_id,)).fetchone()
    
    if not report:
        conn.close()
        return jsonify({'error': 'Report not found'}), 404

    # Permission check: must be admin or assigned worker
    if session.get('role') != 'admin' and report['worker_id'] != session.get('user_id'):
        conn.close()
        return jsonify({'error': 'Unauthorized'}), 403

    before_image = report['before_image']
    after_image = report['after_image']

    if 'before_image' in request.files:
        file = request.files['before_image']
        if file and allowed_file(file.filename):
            fname = secure_filename(f"before_{report_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}")
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], fname))
            before_image = url_for('static', filename=f'uploads/{fname}')

    if 'after_image' in request.files:
        file = request.files['after_image']
        if file and allowed_file(file.filename):
            fname = secure_filename(f"after_{report_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}")
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], fname))
            after_image = url_for('static', filename=f'uploads/{fname}')

    cursor = conn.cursor()
    cursor.execute('''
        UPDATE reports 
        SET status = ?, worker_notes = ?, before_image = ?, after_image = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (status, worker_notes, before_image, after_image, report_id))

    if status == 'Completed' and report['worker_id']:
        cursor.execute('''
            UPDATE workers 
            SET active_tasks = MAX(0, active_tasks - 1), completed_tasks = completed_tasks + 1 
            WHERE user_id = ?
        ''', (report['worker_id'],))

    conn.commit()
    conn.close()

    flash(f'Report #{report_id} updated to {status}.', 'success')
    return redirect(request.referrer or url_for('index'))

if __name__ == '__main__':
    app.run(debug=True, port=5000)
