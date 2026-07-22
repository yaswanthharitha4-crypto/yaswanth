/**
 * SMART WASTE COLLECTION REQUEST PORTAL - PURE FRONTEND APP LOGIC
 */

// Initial Seed State for LocalStorage Database
const DEFAULT_REPORTS = [
  {
    id: 101,
    user_name: "Alex Citizen",
    user_phone: "+1-555-0144",
    waste_type: "Organic Waste",
    description: "Overflowing organic waste bin near central market entrance.",
    image_url: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80",
    latitude: 28.6139,
    longitude: 77.2090,
    address: "Central Market Square, Sector 3",
    status: "Assigned",
    worker_id: 2,
    worker_name: "John Sanitation Worker",
    before_image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80",
    after_image: null,
    worker_notes: "Dispatched team to collect organic bin.",
    created_at: "2026-07-20 09:30:00"
  },
  {
    id: 102,
    user_name: "Alex Citizen",
    user_phone: "+1-555-0144",
    waste_type: "E-Waste",
    description: "Discarded old computer monitor and batteries on pavement.",
    image_url: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=600&q=80",
    latitude: 28.6210,
    longitude: 77.2150,
    address: "Oak Avenue near IT Park",
    status: "Pending",
    worker_id: null,
    worker_name: null,
    before_image: null,
    after_image: null,
    worker_notes: null,
    created_at: "2026-07-21 14:15:00"
  },
  {
    id: 103,
    user_name: "Alex Citizen",
    user_phone: "+1-555-0144",
    waste_type: "Recyclable Plastic",
    description: "Plastic bottles and cardboard pile outside Community Center.",
    image_url: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80",
    latitude: 28.6080,
    longitude: 77.2010,
    address: "Community Park Entrance, Gate 2",
    status: "Completed",
    worker_id: 3,
    worker_name: "Maria Eco Collector",
    before_image: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80",
    after_image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80",
    worker_notes: "Area cleaned and plastic sent to recycling facility.",
    created_at: "2026-07-19 11:00:00"
  },
  {
    id: 104,
    user_name: "Alex Citizen",
    user_phone: "+1-555-0144",
    waste_type: "Hazardous Waste",
    description: "Chemical paint cans left unattended by building construction site.",
    image_url: "https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?auto=format&fit=crop&w=600&q=80",
    latitude: 28.6180,
    longitude: 77.2220,
    address: "Industrial Complex, Block B",
    status: "In Progress",
    worker_id: 2,
    worker_name: "John Sanitation Worker",
    before_image: "https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?auto=format&fit=crop&w=600&q=80",
    after_image: null,
    worker_notes: "Containment team on site securing hazardous materials.",
    created_at: "2026-07-22 08:45:00"
  }
];

const DEFAULT_WORKERS = [
  { id: 2, name: "John Sanitation Worker", email: "worker@smartcity.gov", phone: "+1-555-0192", active_tasks: 2, completed_tasks: 12 },
  { id: 3, name: "Maria Eco Collector", email: "maria@smartcity.gov", phone: "+1-555-0198", active_tasks: 1, completed_tasks: 8 }
];

// App State
let currentUser = JSON.parse(localStorage.getItem('eco_user')) || null;
let reportsData = JSON.parse(localStorage.getItem('eco_reports')) || DEFAULT_REPORTS;
let workersData = JSON.parse(localStorage.getItem('eco_workers')) || DEFAULT_WORKERS;

let mapInstance = null;
let markerInstance = null;
let activeCharts = {};

// Save to LocalStorage
function saveState() {
  localStorage.setItem('eco_reports', JSON.stringify(reportsData));
  localStorage.setItem('eco_workers', JSON.stringify(workersData));
  if (currentUser) {
    localStorage.setItem('eco_user', JSON.stringify(currentUser));
  } else {
    localStorage.removeItem('eco_user');
  }
}

// DOM Loaded
document.addEventListener('DOMContentLoaded', () => {
  saveState();
  initTheme();
  updateAuthUI();
  showView('home');

  // Event Listeners
  setupFormListeners();
});

// View Navigation Router
function showView(viewId) {
  const views = document.querySelectorAll('.view-section');
  views.forEach(v => v.classList.remove('active'));

  const target = document.getElementById(`view-${viewId}`);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // View-specific initializations
  if (viewId === 'home') {
    renderHomeStats();
  } else if (viewId === 'report') {
    initReportMap();
  } else if (viewId === 'user-dashboard') {
    renderUserDashboard();
  } else if (viewId === 'admin-dashboard') {
    renderAdminDashboard();
  } else if (viewId === 'worker-dashboard') {
    renderWorkerDashboard();
  }
}

// Dark Mode Switcher
function initTheme() {
  const savedTheme = localStorage.getItem('eco_theme') || 'light';
  document.documentElement.setAttribute('data-bs-theme', savedTheme);
  updateThemeIcon(savedTheme);

  document.getElementById('themeToggleBtn')?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-bs-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-bs-theme', next);
    localStorage.setItem('eco_theme', next);
    updateThemeIcon(next);
    showToast(`Switched to ${next} mode`, 'info');
  });
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('themeIcon');
  if (icon) {
    icon.className = theme === 'dark' ? 'fa-solid fa-sun text-warning' : 'fa-solid fa-moon text-secondary';
  }
}

// Toast Engine
function showToast(message, type = 'success') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    toastContainer.style.zIndex = '9999';
    document.body.appendChild(toastContainer);
  }

  const toastId = 'toast-' + Date.now();
  const bgClass = type === 'success' ? 'bg-success text-white' : 
                  type === 'danger' ? 'bg-danger text-white' : 
                  type === 'warning' ? 'bg-warning text-dark' : 'bg-info text-white';

  const toastHtml = `
    <div id="${toastId}" class="toast align-items-center ${bgClass} border-0 shadow-lg" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body fw-bold">
          <i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-info'} me-2"></i>
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;

  toastContainer.insertAdjacentHTML('beforeend', toastHtml);
  const toastEl = document.getElementById(toastId);
  const bsToast = new bootstrap.Toast(toastEl, { delay: 4000 });
  bsToast.show();

  toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

// Authentication & Quick Autofill
function updateAuthUI() {
  const authButtons = document.getElementById('navAuthButtons');
  const userDropdown = document.getElementById('navUserDropdown');
  const userNameLabel = document.getElementById('navUserName');
  const userRoleBadge = document.getElementById('navUserRole');

  if (currentUser) {
    if (authButtons) authButtons.style.display = 'none';
    if (userDropdown) userDropdown.style.display = 'block';
    if (userNameLabel) userNameLabel.textContent = currentUser.name;
    if (userRoleBadge) userRoleBadge.textContent = currentUser.role.toUpperCase();
  } else {
    if (authButtons) authButtons.style.display = 'flex';
    if (userDropdown) userDropdown.style.display = 'none';
  }
}

function quickFillLogin(email, password) {
  document.getElementById('loginEmail').value = email;
  document.getElementById('loginPassword').value = password;
  showToast(`Autofilled credentials for ${email}`, 'info');
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();

  if (email.includes('admin')) {
    currentUser = { id: 1, name: "SmartCity Admin", email: email, role: "admin" };
    saveState();
    updateAuthUI();
    showToast("Welcome back, SmartCity Admin!", "success");
    showView('admin-dashboard');
  } else if (email.includes('worker') || email.includes('maria')) {
    const w = workersData.find(w => w.email === email) || workersData[0];
    currentUser = { id: w.id, name: w.name, email: email, role: "worker" };
    saveState();
    updateAuthUI();
    showToast(`Welcome back, ${w.name}!`, "success");
    showView('worker-dashboard');
  } else {
    currentUser = { id: 99, name: "Alex Citizen", email: email, role: "user" };
    saveState();
    updateAuthUI();
    showToast("Login successful!", "success");
    showView('user-dashboard');
  }
}

function handleLogout() {
  currentUser = null;
  saveState();
  updateAuthUI();
  showToast("You have been logged out.", "info");
  showView('home');
}

// Render Home Page Counters
function renderHomeStats() {
  const total = reportsData.length;
  const completed = reportsData.filter(r => r.status === 'Completed').length;
  const pending = reportsData.filter(r => r.status === 'Pending').length;
  const workers = workersData.length;

  document.getElementById('homeStatTotal').textContent = total;
  document.getElementById('homeStatCompleted').textContent = completed;
  document.getElementById('homeStatPending').textContent = pending;
  document.getElementById('homeStatWorkers').textContent = workers;
}

// Leaflet Map & GPS Auto-Detect
function initReportMap() {
  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  if (mapInstance) {
    mapInstance.remove();
  }

  const defaultLat = 28.6139;
  const defaultLng = 77.2090;

  mapInstance = L.map('map').setView([defaultLat, defaultLng], 14);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(mapInstance);

  const ecoIcon = L.divIcon({
    className: 'custom-eco-pin',
    html: '<div style="background-color:#10b981; color:white; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(0,0,0,0.3); border:2px solid white;"><i class="fa-solid fa-dumpster"></i></div>',
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });

  markerInstance = L.marker([defaultLat, defaultLng], { draggable: true, icon: ecoIcon }).addTo(mapInstance);
  markerInstance.bindPopup("<b>Collection Point</b><br>Drag pin or click map to set point.").openPopup();

  const updateCoords = (lat, lng) => {
    document.getElementById('reportLat').value = lat.toFixed(6);
    document.getElementById('reportLng').value = lng.toFixed(6);
  };

  updateCoords(defaultLat, defaultLng);

  markerInstance.on('dragend', (e) => {
    const c = e.target.getLatLng();
    updateCoords(c.lat, c.lng);
    fetchAddress(c.lat, c.lng);
  });

  mapInstance.on('click', (e) => {
    markerInstance.setLatLng(e.latlng);
    updateCoords(e.latlng.lat, e.latlng.lng);
    fetchAddress(e.latlng.lat, e.latlng.lng);
  });

  // Setup Photo Preview Handler
  const imgInput = document.getElementById('reportImageFile');
  if (imgInput) {
    imgInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          document.getElementById('reportImagePreview').innerHTML = `
            <img src="${evt.target.result}" class="image-preview-thumb img-thumbnail shadow-sm mt-2" alt="Waste Preview">
          `;
        };
        reader.readAsDataURL(file);
      }
    };
  }
}

function detectGPSLocation() {
  const btn = document.getElementById('btn-detect-gps');
  if (!navigator.geolocation) {
    showToast('Geolocation is not supported by your browser.', 'danger');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i> Detecting...';

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      if (mapInstance && markerInstance) {
        mapInstance.setView([lat, lng], 16);
        markerInstance.setLatLng([lat, lng]);
      }

      document.getElementById('reportLat').value = lat.toFixed(6);
      document.getElementById('reportLng').value = lng.toFixed(6);
      fetchAddress(lat, lng);

      showToast('GPS Location Detected!', 'success');
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-location-crosshairs me-1"></i> Auto-Detect GPS Location';
    },
    (err) => {
      showToast('Could not retrieve GPS location. Drag map pin to set location.', 'warning');
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-location-crosshairs me-1"></i> Auto-Detect GPS Location';
    }
  );
}

function fetchAddress(lat, lng) {
  fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
    .then(res => res.json())
    .then(data => {
      if (data && data.display_name) {
        document.getElementById('reportAddress').value = data.display_name;
      }
    })
    .catch(() => {});
}

// Waste Report Form Submission
function handleReportSubmit(e) {
  e.preventDefault();

  const wasteType = document.getElementById('reportWasteType').value;
  const phone = document.getElementById('reportPhone').value;
  const description = document.getElementById('reportDescription').value;
  const address = document.getElementById('reportAddress').value;
  const lat = parseFloat(document.getElementById('reportLat').value);
  const lng = parseFloat(document.getElementById('reportLng').value);

  const previewImg = document.querySelector('#reportImagePreview img');
  const imageUrl = previewImg ? previewImg.src : 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80';

  const newReport = {
    id: 100 + reportsData.length + 1,
    user_name: currentUser ? currentUser.name : "Alex Citizen",
    user_phone: phone || "+1-555-0144",
    waste_type: wasteType,
    description: description || "Waste collection request filed by resident.",
    image_url: imageUrl,
    latitude: lat,
    longitude: lng,
    address: address || "City Location",
    status: "Pending",
    worker_id: null,
    worker_name: null,
    before_image: imageUrl,
    after_image: null,
    worker_notes: null,
    created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
  };

  reportsData.unshift(newReport);
  saveState();
  showToast("Waste report filed successfully! Tracking # generated.", "success");
  showView('user-dashboard');
}

// Citizen Dashboard Render
function renderUserDashboard() {
  const container = document.getElementById('userReportsList');
  if (!container) return;

  const total = reportsData.length;
  const pending = reportsData.filter(r => r.status === 'Pending').length;
  const inProgress = reportsData.filter(r => ['Assigned', 'In Progress'].includes(r.status)).length;
  const completed = reportsData.filter(r => r.status === 'Completed').length;

  document.getElementById('userStatTotal').textContent = total;
  document.getElementById('userStatPending').textContent = pending;
  document.getElementById('userStatInProgress').textContent = inProgress;
  document.getElementById('userStatCompleted').textContent = completed;

  if (reportsData.length === 0) {
    container.innerHTML = `
      <div class="eco-card p-5 text-center">
        <i class="fa-solid fa-box-open fs-1 text-muted mb-3"></i>
        <h5 class="fw-bold">No reports filed yet</h5>
        <button class="btn btn-eco-primary rounded-pill mt-2" onclick="showView('report')">File First Request</button>
      </div>
    `;
    return;
  }

  container.innerHTML = reportsData.map(r => `
    <div class="eco-card p-4 mb-3 report-item" data-status="${r.status}" data-category="${r.waste_type}">
      <div class="row align-items-center g-3">
        <div class="col-md-2 text-center">
          <img src="${r.image_url}" class="img-fluid rounded-3 shadow-sm" style="height:85px; width:100%; object-fit:cover;" alt="Report Photo">
        </div>
        <div class="col-md-6">
          <div class="d-flex align-items-center gap-2 mb-1">
            <span class="badge bg-secondary-subtle text-secondary fw-bold">Report #${r.id}</span>
            <span class="badge badge-${r.status.toLowerCase().replace(' ', '-')}">${r.status}</span>
          </div>
          <h5 class="fw-bold mb-1">${r.waste_type}</h5>
          <p class="text-muted small mb-1"><i class="fa-solid fa-location-dot text-danger me-1"></i> ${r.address}</p>
          <small class="text-muted"><i class="fa-regular fa-clock me-1"></i> Logged: ${r.created_at}</small>
          ${r.worker_name ? `<br><small class="text-success fw-semibold"><i class="fa-solid fa-user-check me-1"></i> Assigned: ${r.worker_name}</small>` : ''}
        </div>
        <div class="col-md-4 text-md-end">
          <div class="progress mb-2" style="height: 8px;">
            <div class="progress-bar bg-success" style="width: ${r.status === 'Pending' ? '25%' : r.status === 'Assigned' ? '50%' : r.status === 'In Progress' ? '75%' : '100%'}"></div>
          </div>
          <small class="text-muted d-block mb-2">Status: <strong>${r.status}</strong></small>
          ${(r.status === 'Completed' || r.after_image) ? `
            <button class="btn btn-sm btn-outline-success rounded-pill" onclick="openProofModal('${r.before_image || r.image_url}', '${r.after_image}', '${r.worker_notes || ''}')">
              <i class="fa-solid fa-images me-1"></i> View Before & After Proof
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

// Admin Dashboard Render & Charts
function renderAdminDashboard() {
  const tableBody = document.getElementById('adminTableBody');
  if (!tableBody) return;

  const total = reportsData.length;
  const pending = reportsData.filter(r => r.status === 'Pending').length;
  const inProgress = reportsData.filter(r => ['Assigned', 'In Progress'].includes(r.status)).length;
  const completed = reportsData.filter(r => r.status === 'Completed').length;

  document.getElementById('adminStatTotal').textContent = total;
  document.getElementById('adminStatPending').textContent = pending;
  document.getElementById('adminStatInProgress').textContent = inProgress;
  document.getElementById('adminStatCompleted').textContent = completed;

  tableBody.innerHTML = reportsData.map(r => `
    <tr class="report-item" data-status="${r.status}" data-category="${r.waste_type}">
      <td class="ps-4 fw-bold">#${r.id}</td>
      <td><strong>${r.user_name}</strong><br><small class="text-muted">${r.user_phone}</small></td>
      <td><span class="badge bg-body-secondary text-dark border">${r.waste_type}</span></td>
      <td><div class="text-truncate" style="max-width: 200px;" title="${r.address}"><i class="fa-solid fa-location-dot text-danger me-1"></i> ${r.address}</div></td>
      <td><img src="${r.image_url}" class="rounded img-thumbnail" style="width:40px; height:40px; object-fit:cover;"></td>
      <td><span class="badge badge-${r.status.toLowerCase().replace(' ', '-')}">${r.status}</span></td>
      <td>${r.worker_name ? `<span class="text-success fw-semibold"><i class="fa-solid fa-user-check me-1"></i> ${r.worker_name}</span>` : '<span class="text-warning small"><i class="fa-solid fa-circle-exclamation me-1"></i> Unassigned</span>'}</td>
      <td class="text-end pe-4">
        <button class="btn btn-sm btn-eco-primary rounded-pill px-3" onclick="openAssignModal(${r.id}, '${r.address}')">
          <i class="fa-solid fa-user-plus me-1"></i> Assign
        </button>
        ${(r.status === 'Completed' || r.after_image) ? `
          <button class="btn btn-sm btn-outline-success rounded-pill ms-1" onclick="openProofModal('${r.before_image || r.image_url}', '${r.after_image}', '${r.worker_notes || ''}')">
            <i class="fa-solid fa-images"></i>
          </button>
        ` : ''}
      </td>
    </tr>
  `).join('');

  renderAdminCharts();
}

function renderAdminCharts() {
  // Category Doughnut Chart
  const categoryCounts = {};
  reportsData.forEach(r => {
    categoryCounts[r.waste_type] = (categoryCounts[r.waste_type] || 0) + 1;
  });

  const ctxCat = document.getElementById('adminCategoryChart');
  if (ctxCat) {
    if (activeCharts.cat) activeCharts.cat.destroy();
    activeCharts.cat = new Chart(ctxCat, {
      type: 'doughnut',
      data: {
        labels: Object.keys(categoryCounts),
        datasets: [{
          data: Object.values(categoryCounts),
          backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  // Status Bar Chart
  const statusCounts = { 'Pending': 0, 'Assigned': 0, 'In Progress': 0, 'Completed': 0 };
  reportsData.forEach(r => {
    if (statusCounts[r.status] !== undefined) statusCounts[r.status]++;
  });

  const ctxStatus = document.getElementById('adminStatusChart');
  if (ctxStatus) {
    if (activeCharts.status) activeCharts.status.destroy();
    activeCharts.status = new Chart(ctxStatus, {
      type: 'bar',
      data: {
        labels: Object.keys(statusCounts),
        datasets: [{
          label: 'Count',
          data: Object.values(statusCounts),
          backgroundColor: ['#f59e0b', '#0284c7', '#2563eb', '#10b981'],
          borderRadius: 6
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
  }
}

// Worker Dashboard Render
function renderWorkerDashboard() {
  const container = document.getElementById('workerTasksGrid');
  if (!container) return;

  const activeWorkerId = currentUser ? currentUser.id : 2;
  const assignedTasks = reportsData.filter(r => r.worker_id === activeWorkerId || r.status === 'Assigned' || r.status === 'In Progress');

  document.getElementById('workerStatAssigned').textContent = assignedTasks.length;
  document.getElementById('workerStatInProgress').textContent = assignedTasks.filter(r => r.status === 'In Progress').length;
  document.getElementById('workerStatCompleted').textContent = assignedTasks.filter(r => r.status === 'Completed').length;

  container.innerHTML = assignedTasks.map(t => `
    <div class="col-md-6 report-item" data-status="${t.status}" data-category="${t.waste_type}">
      <div class="eco-card p-4 h-100 d-flex flex-column justify-content-between">
        <div>
          <div class="d-flex justify-content-between mb-2">
            <span class="badge bg-secondary-subtle text-secondary fw-bold">Task #${t.id}</span>
            <span class="badge badge-${t.status.toLowerCase().replace(' ', '-')}">${t.status}</span>
          </div>
          <h5 class="fw-bold mb-1">${t.waste_type}</h5>
          <p class="text-muted small mb-1"><i class="fa-solid fa-user me-1 text-primary"></i> ${t.user_name} (${t.user_phone})</p>
          <p class="text-muted small mb-2"><i class="fa-solid fa-location-dot me-1 text-danger"></i> ${t.address}</p>
          <div class="p-2 rounded bg-body-tertiary border small mb-3">"${t.description}"</div>
          <img src="${t.image_url}" class="img-fluid rounded-3 shadow-sm mb-3" style="max-height: 130px; width: 100%; object-fit: cover;">
        </div>
        <div class="pt-3 border-top d-flex align-items-center justify-content-between">
          <small class="text-muted"><i class="fa-regular fa-clock me-1"></i> ${t.created_at}</small>
          <button class="btn btn-eco-primary btn-sm rounded-pill px-3" onclick="openWorkerUpdateModal(${t.id}, '${t.status}', '${t.worker_notes || ''}')">
            <i class="fa-solid fa-pen-to-square me-1"></i> Update Status
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Worker Assignment Modal Submission
function openAssignModal(reportId, address) {
  document.getElementById('modalAssignReportId').value = reportId;
  document.getElementById('modalAssignAddress').textContent = address;
  
  const workerSelect = document.getElementById('modalWorkerSelect');
  workerSelect.innerHTML = '<option value="" disabled selected>-- Select Field Worker --</option>' + 
    workersData.map(w => `<option value="${w.id}">${w.name} (${w.phone})</option>`).join('');

  new bootstrap.Modal(document.getElementById('assignModal')).show();
}

function submitAssignment() {
  const reportId = parseInt(document.getElementById('modalAssignReportId').value);
  const workerId = parseInt(document.getElementById('modalWorkerSelect').value);

  if (!workerId) {
    showToast('Please select a worker', 'warning');
    return;
  }

  const worker = workersData.find(w => w.id === workerId);
  const report = reportsData.find(r => r.id === reportId);

  if (report && worker) {
    report.worker_id = worker.id;
    report.worker_name = worker.name;
    report.status = "Assigned";
    saveState();

    bootstrap.Modal.getInstance(document.getElementById('assignModal')).hide();
    showToast(`Task #${reportId} assigned to ${worker.name}`, 'success');
    renderAdminDashboard();
  }
}

// Worker Update Task Modal Submission
function openWorkerUpdateModal(taskId, status, notes) {
  document.getElementById('modalUpdateTaskId').value = taskId;
  document.getElementById('modalUpdateStatus').value = status;
  document.getElementById('modalUpdateNotes').value = notes;

  new bootstrap.Modal(document.getElementById('workerUpdateModal')).show();
}

function submitWorkerUpdate(e) {
  e.preventDefault();
  const taskId = parseInt(document.getElementById('modalUpdateTaskId').value);
  const newStatus = document.getElementById('modalUpdateStatus').value;
  const newNotes = document.getElementById('modalUpdateNotes').value;

  const afterFileInput = document.getElementById('modalAfterImageFile');
  const report = reportsData.find(r => r.id === taskId);

  if (report) {
    report.status = newStatus;
    report.worker_notes = newNotes;

    const processSave = () => {
      saveState();
      bootstrap.Modal.getInstance(document.getElementById('workerUpdateModal')).hide();
      showToast(`Task #${taskId} updated to ${newStatus}`, 'success');
      renderWorkerDashboard();
    };

    if (afterFileInput && afterFileInput.files[0]) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        report.after_image = evt.target.result;
        processSave();
      };
      reader.readAsDataURL(afterFileInput.files[0]);
    } else {
      if (newStatus === 'Completed' && !report.after_image) {
        report.after_image = "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80";
      }
      processSave();
    }
  }
}

// Proof Viewer Modal
function openProofModal(beforeImg, afterImg, notes) {
  document.getElementById('modalBeforeImg').src = beforeImg || 'https://via.placeholder.com/400x300?text=No+Before+Photo';
  document.getElementById('modalAfterImg').src = afterImg || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80';
  document.getElementById('modalNotesText').textContent = notes || 'No worker notes provided.';

  new bootstrap.Modal(document.getElementById('proofModal')).show();
}

// Form Listeners Setup
function setupFormListeners() {
  document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
  document.getElementById('reportForm')?.addEventListener('submit', handleReportSubmit);
  document.getElementById('btn-detect-gps')?.addEventListener('click', detectGPSLocation);
  document.getElementById('workerUpdateForm')?.addEventListener('submit', submitWorkerUpdate);

  // Live Search & Filter
  const searchInput = document.getElementById('globalSearchInput');
  const statusFilter = document.getElementById('globalStatusFilter');

  const filterRows = () => {
    const q = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const s = statusFilter ? statusFilter.value : 'all';

    document.querySelectorAll('.report-item').forEach(item => {
      const text = item.textContent.toLowerCase();
      const status = item.getAttribute('data-status') || '';
      const matchQ = !q || text.includes(q);
      const matchS = s === 'all' || status.toLowerCase() === s.toLowerCase();
      item.style.display = (matchQ && matchS) ? '' : 'none';
    });
  };

  if (searchInput) searchInput.addEventListener('input', filterRows);
  if (statusFilter) statusFilter.addEventListener('change', filterRows);
}
