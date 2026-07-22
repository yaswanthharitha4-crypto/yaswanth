/**
 * Chart.js analytics initialization for Admin and User Dashboards
 */

function initDashboardCharts() {
  fetch('/api/stats')
    .then(response => response.json())
    .then(data => {
      renderCategoryChart(data.categories);
      renderStatusChart(data.status);
      renderTrendChart();
    })
    .catch(err => {
      console.error('Error fetching analytics stats:', err);
    });
}

function renderCategoryChart(categoriesData) {
  const ctx = document.getElementById('categoryChart');
  if (!ctx) return;

  const labels = Object.keys(categoriesData || { 'Organic': 4, 'Recyclable': 6, 'E-Waste': 2, 'Hazardous': 3 });
  const values = Object.values(categoriesData || { 'Organic': 4, 'Recyclable': 6, 'E-Waste': 2, 'Hazardous': 3 });

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        title: { display: true, text: 'Waste Reports by Category', font: { size: 14, weight: 'bold' } }
      }
    }
  });
}

function renderStatusChart(statusData) {
  const ctx = document.getElementById('statusChart');
  if (!ctx) return;

  const labels = ['Pending', 'Assigned', 'In Progress', 'Completed'];
  const counts = labels.map(s => (statusData && statusData[s]) ? statusData[s] : 0);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Complaint Count',
        data: counts,
        backgroundColor: ['#f59e0b', '#0284c7', '#2563eb', '#10b981'],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Complaint Resolution Status', font: { size: 14, weight: 'bold' } }
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } }
      }
    }
  });
}

function renderTrendChart() {
  const ctx = document.getElementById('trendChart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      datasets: [{
        label: 'Reports Logged',
        data: [12, 19, 15, 25, 22, 34],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#059669',
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: 'Monthly Waste Collection Trend', font: { size: 14, weight: 'bold' } }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initDashboardCharts();
});
