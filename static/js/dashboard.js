/**
 * Search, filter, modal assignment, and image preview logic for Dashboards
 */

document.addEventListener('DOMContentLoaded', () => {
  setupSearchAndFilter();
  setupImagePreviews();
});

function setupSearchAndFilter() {
  const searchInput = document.getElementById('tableSearchInput');
  const statusFilter = document.getElementById('tableStatusFilter');
  const categoryFilter = document.getElementById('tableCategoryFilter');

  if (!searchInput && !statusFilter && !categoryFilter) return;

  const filterRows = () => {
    const q = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const statusVal = statusFilter ? statusFilter.value : 'all';
    const categoryVal = categoryFilter ? categoryFilter.value : 'all';

    const rows = document.querySelectorAll('.report-item');
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      const status = row.getAttribute('data-status') || '';
      const category = row.getAttribute('data-category') || '';

      const matchesSearch = !q || text.includes(q);
      const matchesStatus = statusVal === 'all' || status.toLowerCase() === statusVal.toLowerCase();
      const matchesCategory = categoryVal === 'all' || category.toLowerCase() === categoryVal.toLowerCase();

      if (matchesSearch && matchesStatus && matchesCategory) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  };

  if (searchInput) searchInput.addEventListener('input', filterRows);
  if (statusFilter) statusFilter.addEventListener('change', filterRows);
  if (categoryFilter) categoryFilter.addEventListener('change', filterRows);
}

function setupImagePreviews() {
  // Waste Report form image preview
  const imageInput = document.getElementById('image');
  const previewContainer = document.getElementById('image-preview');

  if (imageInput && previewContainer) {
    imageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          previewContainer.innerHTML = `
            <div class="position-relative d-inline-block">
              <img src="${event.target.result}" class="image-preview-thumb img-thumbnail shadow-sm mt-2" alt="Waste Preview">
              <span class="badge bg-success position-absolute top-0 start-100 translate-middle rounded-pill">
                <i class="fa-solid fa-check"></i>
              </span>
            </div>
          `;
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

// Modal Worker Assignment Handler
function openAssignModal(reportId, reportAddress) {
  const reportIdInput = document.getElementById('assignReportId');
  const modalAddress = document.getElementById('assignModalAddress');
  
  if (reportIdInput) reportIdInput.value = reportId;
  if (modalAddress) modalAddress.textContent = reportAddress || `Report #${reportId}`;

  const modalEl = document.getElementById('assignWorkerModal');
  if (modalEl) {
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
  }
}

function submitWorkerAssignment() {
  const reportId = document.getElementById('assignReportId').value;
  const workerSelect = document.getElementById('workerSelect');
  const workerId = workerSelect ? workerSelect.value : null;

  if (!workerId) {
    showToast('Please select a worker to assign.', 'warning');
    return;
  }

  fetch(`/api/reports/${reportId}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ worker_id: workerId })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      showToast(data.message, 'success');
      setTimeout(() => location.reload(), 1200);
    } else {
      showToast(data.error || 'Failed to assign worker', 'danger');
    }
  })
  .catch(err => {
    showToast('Server error while assigning worker', 'danger');
  });
}

// Modal Before / After Cleanup Viewer
function openProofModal(beforeImg, afterImg, notes) {
  const beforeContainer = document.getElementById('modalBeforeImg');
  const afterContainer = document.getElementById('modalAfterImg');
  const notesContainer = document.getElementById('modalNotes');

  if (beforeContainer) {
    beforeContainer.src = beforeImg || 'https://via.placeholder.com/400x300?text=No+Before+Photo';
  }
  if (afterContainer) {
    afterContainer.src = afterImg || 'https://via.placeholder.com/400x300?text=No+After+Photo';
  }
  if (notesContainer) {
    notesContainer.textContent = notes || 'No worker notes recorded.';
  }

  const modalEl = document.getElementById('proofModal');
  if (modalEl) {
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
  }
}
