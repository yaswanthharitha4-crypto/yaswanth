/**
 * Leaflet & HTML5 Geolocation integration for Waste Report Location Auto-Detection
 */

let map, marker;

function initWasteMap(defaultLat = 28.6139, defaultLng = 77.2090) {
  const mapElement = document.getElementById('map');
  if (!mapElement) return;

  // Read initial coordinates from hidden inputs if set
  const latInput = document.getElementById('latitude');
  const lngInput = document.getElementById('longitude');

  let initialLat = (latInput && latInput.value) ? parseFloat(latInput.value) : defaultLat;
  let initialLng = (lngInput && lngInput.value) ? parseFloat(lngInput.value) : defaultLng;

  // Initialize Leaflet Map
  map = L.map('map').setView([initialLat, initialLng], 14);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors | Smart Waste Portal'
  }).addTo(map);

  // Custom Eco Pin Marker Icon
  const ecoIcon = L.divIcon({
    className: 'custom-eco-pin',
    html: '<div style="background-color:#10b981; color:white; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(0,0,0,0.3); border:2px solid white;"><i class="fa-solid fa-dumpster-fire"></i></div>',
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });

  marker = L.marker([initialLat, initialLng], {
    draggable: true,
    icon: ecoIcon
  }).addTo(map);

  marker.bindPopup("<b>Selected Collection Point</b><br>Drag pin to pinpoint location.").openPopup();

  // Update inputs on marker drag
  marker.on('dragend', function (e) {
    const coord = e.target.getLatLng();
    updateLocationInputs(coord.lat, coord.lng);
    fetchAddress(coord.lat, coord.lng);
  });

  // Map click to move marker
  map.on('click', function (e) {
    marker.setLatLng(e.latlng);
    updateLocationInputs(e.latlng.lat, e.latlng.lng);
    fetchAddress(e.latlng.lat, e.latlng.lng);
  });

  // Attach GPS Detect Button
  const detectBtn = document.getElementById('btn-detect-gps');
  if (detectBtn) {
    detectBtn.addEventListener('click', detectGPSLocation);
  }
}

function updateLocationInputs(lat, lng) {
  const latInput = document.getElementById('latitude');
  const lngInput = document.getElementById('longitude');
  if (latInput) latInput.value = lat.toFixed(6);
  if (lngInput) lngInput.value = lng.toFixed(6);
}

function detectGPSLocation() {
  const detectBtn = document.getElementById('btn-detect-gps');
  if (!navigator.geolocation) {
    showToast('Geolocation is not supported by your browser.', 'danger');
    return;
  }

  if (detectBtn) {
    detectBtn.disabled = true;
    detectBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i> Detecting GPS...';
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      if (map && marker) {
        map.setView([lat, lng], 16);
        marker.setLatLng([lat, lng]);
      }

      updateLocationInputs(lat, lng);
      fetchAddress(lat, lng);
      showToast('GPS Location Detected Successfully!', 'success');

      if (detectBtn) {
        detectBtn.disabled = false;
        detectBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs me-2"></i> Auto-Detect GPS Location';
      }
    },
    (error) => {
      showToast('Failed to retrieve GPS location. Please select pin on map.', 'warning');
      if (detectBtn) {
        detectBtn.disabled = false;
        detectBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs me-2"></i> Auto-Detect GPS Location';
      }
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function fetchAddress(lat, lng) {
  const addressInput = document.getElementById('address');
  if (!addressInput) return;

  fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
    .then(response => response.json())
    .then(data => {
      if (data && data.display_name) {
        addressInput.value = data.display_name;
      }
    })
    .catch(() => {
      console.log('Reverse geocoding error');
    });
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('map')) {
    initWasteMap();
  }
});
