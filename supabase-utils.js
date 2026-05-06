// Supabase Database Utils
// All database operations for vehicles

/**
 * Save vehicle data to Supabase
 */
async function saveVehicleToSupabase(vehicleData) {
    const supabase = getSupabase();
    if (!supabase) {
        console.warn('Supabase not initialized, falling back to localStorage');
        saveVehicleToLocalStorage(vehicleData);
        return;
    }

    try {
        const { data, error } = await supabase
            .from('vehicles')
            .insert([{
                vehicle_type: vehicleData.vehicleType,
                year: vehicleData.year,
                make: vehicleData.make,
                model: vehicleData.model,
                price: vehicleData.price,
                description: vehicleData.description,
                image_url: vehicleData.imageUrl,
                created_at: new Date().toISOString()
            }])
            .select();

        if (error) {
            console.error('Error saving to Supabase:', error);
            saveVehicleToLocalStorage(vehicleData);
            return;
        }

        console.log('Vehicle saved to Supabase:', data);
        return data;
    } catch (error) {
        console.error('Failed to save vehicle:', error);
        saveVehicleToLocalStorage(vehicleData);
    }
}

/**
 * Load vehicles from Supabase
 */
async function loadVehiclesFromSupabase() {
    const supabase = getSupabase();
    if (!supabase) {
        console.warn('Supabase not initialized, loading from localStorage');
        return loadVehiclesFromLocalStorage();
    }

    try {
        const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading from Supabase:', error);
            return loadVehiclesFromLocalStorage();
        }

        if (!data || data.length === 0) {
            return loadVehiclesFromLocalStorage();
        }

        // Convert Supabase format to app format
        return data.map(vehicle => ({
            id: vehicle.id,
            name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            brand: vehicle.make,
            price: vehicle.price,
            year: vehicle.year,
            color: vehicle.color || 'Various',
            mileage: vehicle.vehicle_type === 'car' ? 'New' : 'New Truck',
            image: vehicle.image_url,
            phone: vehicle.phone,
            description: vehicle.description,
            vehicleType: vehicle.vehicle_type
        }));
    } catch (error) {
        console.error('Failed to load vehicles from Supabase:', error);
        return loadVehiclesFromLocalStorage();
    }
}

/**
 * Delete vehicle from Supabase
 */
async function deleteVehicleFromSupabase(vehicleId) {
    const supabase = getSupabase();
    if (!supabase) {
        deleteVehicleFromLocalStorage(vehicleId);
        return;
    }

    try {
        const { error } = await supabase
            .from('vehicles')
            .delete()
            .eq('id', vehicleId);

        if (error) {
            console.error('Error deleting from Supabase:', error);
            deleteVehicleFromLocalStorage(vehicleId);
            return;
        }

        console.log('Vehicle deleted from Supabase');
    } catch (error) {
        console.error('Failed to delete vehicle:', error);
        deleteVehicleFromLocalStorage(vehicleId);
    }
}

/**
 * Upload image to Supabase Storage
 */
async function uploadImageToSupabase(file) {
    const supabase = getSupabase();
    if (!supabase) {
        return readFileAsDataURL(file);
    }

    try {
        const fileName = `${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage
            .from('vehicles')
            .upload(`images/${fileName}`, file);

        if (error) {
            console.warn('Supabase storage upload failed, using data URL:', error);
            return readFileAsDataURL(file);
        }

        // Get public URL
        const { data: publicData } = supabase.storage
            .from('vehicles')
            .getPublicUrl(`images/${fileName}`);

        return publicData?.publicUrl || await readFileAsDataURL(file);
    } catch (error) {
        console.warn('Failed to upload to Supabase storage:', error);
        return readFileAsDataURL(file);
    }
}

/**
 * Local Storage Fallback Functions
 */
function saveVehicleToLocalStorage(vehicleData) {
    const storedVehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
    storedVehicles.push(vehicleData);
    localStorage.setItem('vehicles', JSON.stringify(storedVehicles));
}

function loadVehiclesFromLocalStorage() {
    try {
        const storedVehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
        if (!storedVehicles.length) {
            return [];
        }

        return storedVehicles.map(vehicle => ({
            id: vehicle.id || Date.now().toString(),
            name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            brand: vehicle.make,
            price: vehicle.price,
            year: vehicle.year,
            color: vehicle.color || 'Various',
            mileage: vehicle.vehicleType === 'truck' ? 'New Truck' : 'New',
            image: vehicle.imageUrl || 'https://via.placeholder.com/400x220?text=Vehicle',
            description: vehicle.description,
            phone: vehicle.phone,
            vehicleType: vehicle.vehicleType
        }));
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        return [];
    }
}

function deleteVehicleFromLocalStorage(vehicleId) {
    const storedVehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
    const filtered = storedVehicles.filter(v => v.id !== vehicleId);
    localStorage.setItem('vehicles', JSON.stringify(filtered));
}

// Helper function
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Export functions
window.saveVehicleToSupabase = saveVehicleToSupabase;
window.loadVehiclesFromSupabase = loadVehiclesFromSupabase;
window.deleteVehicleFromSupabase = deleteVehicleFromSupabase;
window.uploadImageToSupabase = uploadImageToSupabase;
window.readFileAsDataURL = readFileAsDataURL;
