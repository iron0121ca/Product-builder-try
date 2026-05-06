// Admin panel functionality for vehicle management with Supabase

// DOM elements
const vehicleForm = document.getElementById('vehicleForm');
const fileDropZone = document.getElementById('fileDropZone');
const imageInput = document.getElementById('image');
const messageDiv = document.getElementById('message');
const vehiclesContainer = document.getElementById('vehiclesContainer');

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Admin panel initialized');
    setupFileUpload();
    
    // Initialize Supabase
    await initSupabase();
    
    loadVehicles();
});

// Setup file upload functionality
function setupFileUpload() {
    // File input change
    imageInput.addEventListener('change', handleFileSelect);

    // Drag and drop functionality
    fileDropZone.addEventListener('dragover', handleDragOver);
    fileDropZone.addEventListener('dragleave', handleDragLeave);
    fileDropZone.addEventListener('drop', handleFileDrop);
    fileDropZone.addEventListener('click', () => imageInput.click());
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        validateAndPreviewFile(file);
    }
}

function handleDragOver(event) {
    event.preventDefault();
    fileDropZone.classList.add('dragover');
}

function handleDragLeave(event) {
    event.preventDefault();
    fileDropZone.classList.remove('dragover');
}

function handleFileDrop(event) {
    event.preventDefault();
    fileDropZone.classList.remove('dragover');

    const files = event.dataTransfer.files;
    if (files.length > 0) {
        imageInput.files = files;
        validateAndPreviewFile(files[0]);
    }
}

function validateAndPreviewFile(file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showMessage('Please select a valid image file.', 'error');
        return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showMessage('File size must be less than 5MB.', 'error');
        return;
    }

    // Show file name
    fileDropZone.innerHTML = `<p>Selected: ${file.name}</p>`;
    showMessage('Image selected successfully!', 'success');
}

// Form submission
vehicleForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    const vehicleType = document.getElementById('vehicleType').value;
    const year = parseInt(document.getElementById('year').value);
    const make = document.getElementById('make').value;
    const model = document.getElementById('model').value;
    const price = parseFloat(document.getElementById('price').value);
    const description = document.getElementById('description').value;
    const imageFile = imageInput.files[0];

    try {
        showMessage('Uploading vehicle...', 'success');

        // Upload image
        let imageUrl = null;
        if (imageFile) {
            imageUrl = await uploadImageToSupabase(imageFile);
        }

        // Save vehicle data
        const vehicleData = {
            vehicleType,
            year,
            make,
            model,
            price,
            description,
            imageUrl
        };

        await saveVehicleToSupabase(vehicleData);

        showMessage('Vehicle added successfully!', 'success');
        vehicleForm.reset();
        fileDropZone.innerHTML = '<p>Drag and drop an image here, or click to select</p>';
        loadVehicles(); // Refresh the list

    } catch (error) {
        console.error('Error adding vehicle:', error);
        showMessage('Error adding vehicle: ' + error.message, 'error');
    }
});

// Load and display vehicles
async function loadVehicles() {
    try {
        const vehicles = await loadVehiclesFromSupabase();

        if (!vehicles || vehicles.length === 0) {
            vehiclesContainer.innerHTML = '<p>No vehicles found.</p>';
            return;
        }

        const vehiclesHTML = vehicles.map(vehicle => {
            return `
                <div class="vehicle-item">
                    <h3>${vehicle.year} ${vehicle.make} ${vehicle.model}</h3>
                    <p><strong>Type:</strong> ${vehicle.vehicleType}</p>
                    <p><strong>Price:</strong> $${Number(vehicle.price).toLocaleString()}</p>
                    <p><strong>Description:</strong> ${vehicle.description}</p>
                    ${vehicle.image ? `<img src="${vehicle.image}" alt="${vehicle.make} ${vehicle.model}" class="vehicle-image">` : ''}
                    <div class="actions">
                        <button class="btn btn-secondary" onclick="deleteVehicle('${vehicle.id}')">Delete</button>
                    </div>
                </div>
            `;
        }).join('');

        vehiclesContainer.innerHTML = vehiclesHTML;

    } catch (error) {
        console.error('Error loading vehicles:', error);
        vehiclesContainer.innerHTML = '<p>Error loading vehicles. Please try again.</p>';
    }
}

// Delete vehicle
async function deleteVehicle(vehicleId) {
    if (confirm('Are you sure you want to delete this vehicle?')) {
        try {
            await deleteVehicleFromSupabase(vehicleId);
            showMessage('Vehicle deleted successfully!', 'success');
            loadVehicles();
        } catch (error) {
            console.error('Error deleting vehicle:', error);
            showMessage('Error deleting vehicle: ' + error.message, 'error');
        }
    }
}

// Show message notification
function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = 'message ' + type;
    messageDiv.style.display = 'block';

    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}
