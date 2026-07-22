# Smart Waste Collection Request Portal 🌿

A modern, responsive, full-stack Smart City web application for reporting, managing, and tracking urban waste collection requests in real-time. Built with **HTML5**, **CSS3**, **Bootstrap 5**, **JavaScript**, **Python Flask**, **Chart.js**, and **Leaflet Maps**.

---

## 🚀 Key Features

- **7 Dedicated Pages & Portals**:
  1. **Home**: Hero landing page with "Report Waste" CTA, dynamic statistics counters, feature cards, and contact section.
  2. **Login**: Glassmorphic login card with one-click quick-fill demo presets for Citizen, Admin, and Worker.
  3. **Register**: Citizen registration portal with validation.
  4. **Waste Report Form**: Photo upload drag-and-drop zone with instant thumbnail preview, waste category dropdown, HTML5 auto-detect GPS button, and interactive Leaflet map pin picker.
  5. **User Dashboard**: Citizen complaint timeline, real-time status tracker progress bar, live search, status filtering, and before/after cleanup proof viewer.
  6. **Admin Dashboard**: Municipal command center featuring total statistics, Chart.js analytics (Category Breakdown, Resolution Status, Monthly Trend), search/filter tools, worker dispatch modal, and resolution verification.
  7. **Worker Portal**: Field operator portal to view assigned tasks, update status (Assigned → In Progress → Completed), upload "Before Cleanup" and "After Cleanup" proof photos, and record resolution notes.

- **Design System & UX**:
  - Curated **Eco-Green & Emerald Theme** with smooth rounded cards, glassmorphism headers, and subtle micro-animations.
  - **Dark Mode Toggle**: Built-in light/dark theme switcher with persistent `localStorage` preference.
  - **Font Awesome 6.4 & Bootstrap 5**: Clean icons and responsive grid layout across desktop and mobile screens.
  - **Dynamic Toasts**: Dynamic notification toasts for instant user feedback.

- **Backend & Database**:
  - **Flask RESTful APIs**: Clean session-based authentication and role-based access control (`user`, `admin`, `worker`).
  - **Dual Database Support**: Defaults to **SQLite** (`smart_waste.db`) out-of-the-box for zero-setup execution, with built-in **MySQL** database configuration options in `config.py`.

---

## 🔑 Demo User Accounts (Auto-Seeded)

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Citizen (User)** | `user@example.com` | `user123` | File waste reports, track status timeline, view cleanup proof |
| **Admin** | `admin@smartcity.gov` | `admin123` | Access command center, view analytics charts, assign workers to tasks |
| **Field Worker** | `worker@smartcity.gov` | `worker123` | View assigned collection tasks, upload before/after photos, update status |

---

## 🛠️ Quick Start Guide

### Prerequisites
- Python 3.8+

### Installation & Run

1. Clone or navigate to the project directory:
   ```bash
   cd d:/project
   ```

2. Install Python dependencies:
   ```bash
   pip install flask flask-cors pillow
   ```

3. Launch the Flask application:
   ```bash
   python app.py
   ```

4. Open your web browser and navigate to:
   ```
   http://127.0.0.1:5000
   ```

---

## 📂 Project Structure

```
d:\project\
├── app.py                      # Flask backend application routes & API endpoints
├── config.py                   # Environment & Database settings (SQLite / MySQL)
├── database.py                 # DB schema creation & initial seed data script
├── README.md                   # Project documentation
├── req.md                      # Project requirements specification
├── static\
│   ├── css\
│   │   └── style.css           # Eco-green design system, dark mode, card animations
│   ├── js\
│   │   ├── main.js             # Theme switcher & global toast notifications
│   │   ├── location.js         # Leaflet interactive map pin picker & GPS auto-detection
│   │   ├── charts.js           # Chart.js analytics graphs for Admin dashboard
│   │   └── dashboard.js        # Search, filters, assignment modal & image preview logic
│   └── uploads\                # Directory for user & worker uploaded photos
└── templates\
    ├── base.html               # Shared navbar, header, footer, toast container
    ├── index.html              # Hero landing page
    ├── login.html              # Login page with demo autofill presets
    ├── register.html           # Registration form
    ├── report.html             # Waste report form with photo upload & map pin picker
    ├── user_dashboard.html     # Citizen dashboard & progress tracker
    ├── admin_dashboard.html    # Command center & analytics charts
    └── worker_dashboard.html   # Field worker portal for task management
```
