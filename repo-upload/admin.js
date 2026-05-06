// Admin panel functionality for vehicle management

// DOM elements
const vehicleForm = document.getElementById('vehicleForm');
const fileDropZone = document.getElementById('fileDropZone');
const imageInput = document.getElementById('image');
const messageDiv = document.getElementById('message');
const vehiclesContainer = document.getElementById('vehiclesContainer');

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin panel initialized');
    setupFileUpload();
    loadVehiclesFromLocalStorage();
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

    const formData = {
        id: Date.now().toString(),
        vehicleType: document.getElementById('vehicleType').value,
        year: parseInt(document.getElementById('year').value),
        make: document.getElementById('make').value,
        model: document.getElementById('model').value,
        price: parseFloat(document.getElementById('price').value),
        description: document.getElementById('description').value,
        imageFile: imageInput.files[0],
        createdAt: new Date().toISOString()
    };

    try {
        showMessage('Uploading vehicle...', 'success');

        const imageUrl = await getImageUrl(formData.imageFile);
        const vehicleSaveData = { ...formData, imageUrl };

        await saveVehicleData(vehicleSaveData);

        showMessage('Vehicle added successfully!', 'success');
        vehicleForm.reset();
        fileDropZone.innerHTML = '<p>Drag and drop an image here, or click to select</p>';
        loadVehicles(); // Refresh the list

    } catch (error) {
        console.error('Error adding vehicle:', error);
        showMessage('Error adding vehicle: ' + error.message, 'error');
    }
});

// Upload image to Firebase Storage
async function uploadImage(file) {
    const storageRef = storage.ref();
    const imageRef = storageRef.child(`vehicles/${Date.now()}_${file.name}`);

    const snapshot = await imageRef.put(file);
    const downloadURL = await snapshot.ref.getDownloadURL();

    return downloadURL;
}

async function getImageUrl(file) {
    if (!file) {
        return null;
    }

    if (typeof storage !== 'undefined' && storage) {
        try {
            return await uploadImage(file);
        } catch (storageError) {
            console.warn('Firebase storage upload failed, using local image URL instead.', storageError);
            return await readFileAsDataURL(file);
        }
    }

    return await readFileAsDataURL(file);
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Save vehicle data to Firestore or localStorage
async function saveVehicleData(vehicleData) {
    const { imageFile, ...dataToSave } = vehicleData;

    if (typeof db !== 'undefined' && db) {
        try {
            await db.collection('vehicles').add(dataToSave);
            return;
        } catch (firestoreError) {
            console.warn('Firestore save failed, using localStorage fallback:', firestoreError);
        }
    }

    saveVehicleToLocalStorage(dataToSave);
}

function saveVehicleToLocalStorage(vehicleData) {
    const storedVehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
    storedVehicles.push(vehicleData);
    localStorage.setItem('vehicles', JSON.stringify(storedVehicles));
}

function loadVehiclesFromLocalStorage() {
    const storedVehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');

    if (!storedVehicles.length) {
        vehiclesContainer.innerHTML = '<p>No vehicles found.</p>';
        return;
    }

    const vehiclesHTML = storedVehicles.map(vehicle => {
        return `
            <div class="vehicle-item">
                <h3>${vehicle.year} ${vehicle.make} ${vehicle.model}</h3>
                <p><strong>Type:</strong> ${vehicle.vehicleType}</p>
                <p><strong>Price:</strong> $${vehicle.price.toLocaleString()}</p>
                <p><strong>Description:</strong> ${vehicle.description}</p>
                ${vehicle.imageUrl ? `<img src="${vehicle.imageUrl}" alt="${vehicle.make} ${vehicle.model}" class="vehicle-image">` : ''}
                <div class="actions">
                    <button class="btn btn-secondary" onclick="deleteVehicle('${vehicle.id}')">Delete</button>
                </div>
            </div>
        `;
    }).join('');

    vehiclesContainer.innerHTML = vehiclesHTML;
}

// Load and display vehicles
async function loadVehicles() {
    if (typeof db === 'undefined' || !db) {
        loadVehiclesFromLocalStorage();
        return;
    }

    try {
        const querySnapshot = await db.collection('vehicles').orderBy('createdAt', 'desc').get();

        if (querySnapshot.empty) {
            loadVehiclesFromLocalStorage();
            return;
        }

        const vehiclesHTML = querySnapshot.docs.map(doc => {
            const vehicle = doc.data();
            return `
                <div class="vehicle-item">
                    <h3>${vehicle.year} ${vehicle.make} ${vehicle.model}</h3>
                    <p><strong>Type:</strong> ${vehicle.vehicleType}</p>
                    <p><strong>Price:</strong> $${vehicle.price.toLocaleString()}</p>
                    <p><strong>Description:</strong> ${vehicle.description}</p>
                    ${vehicle.imageUrl ? `<img src="${vehicle.imageUrl}" alt="${vehicle.make} ${vehicle.model}" class="vehicle-image">` : ''}
                    <div class="actions">
                        <button class="btn btn-secondary" onclick="deleteVehicle('${doc.id}')">Delete</button>
                    </div>
                </div>
            `;
        }).join('');

        vehiclesContainer.innerHTML = vehiclesHTML;

    } catch (error) {
        console.error('Error loading vehicles:', error);
        loadVehiclesFromLocalStorage();
    }
}

// Delete vehicle
async function deleteVehicle(vehicleId) {
    if (confirm('Are you sure you want to delete this vehicle?')) {
        try {
            if (typeof db !== 'undefined' && db) {
                await db.collection('vehicles').doc(vehicleId).delete();
                showMessage('Vehicle deleted successfully!', 'success');
                loadVehicles();
            } else {
                const storedVehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
                const remainingVehicles = storedVehicles.filter(v => v.id !== vehicleId);
                localStorage.setItem('vehicles', JSON.stringify(remainingVehicles));
                showMessage('Vehicle deleted successfully!', 'success');
                loadVehiclesFromLocalStorage();
            }
        } catch (error) {
            console.error('Error deleting vehicle:', error);
            showMessage('Error deleting vehicle: ' + error.message, 'error');
        }
    }
}

// Show message to user
function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';

    // Auto hide after 5 seconds
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// Make functions globally available
window.loadVehicles = loadVehicles;
window.deleteVehicle = deleteVehicle;