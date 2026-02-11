document.addEventListener('DOMContentLoaded', async () => {
    
    // --- 1. Database Initialization with Dexie.js ---
    const db = new Dexie('SuraBusDB');
    
    // Define Schema
    db.version(1).stores({
        bookings: '++id, fullName, travelType, packageId, date, status',
        packages: '++id, name, type'
    });

    // --- 2. Seed Initial Data (Packages) ---
    async function seedPackages() {
        const count = await db.packages.count();
        if (count === 0) {
            await db.packages.bulkAdd([
                { name: "Super Luxury Bedroom (Lower Deck)", type: "domestic", price: 5000 },
                { name: "Panoramic View Seat (Upper Deck)", type: "domestic", price: 3500 },
                { name: "Airport Premium Transfer", type: "international", price: 8000 },
                { name: "Guided City Tour (Full Day)", type: "international", price: 12000 }
            ]);
            console.log("Packages seeded successfully");
        }
    }
    await seedPackages();

    // --- 3. UI Interaction Logic ---
    
    const elements = {
        bookingForm: document.getElementById('bookingForm'),
        travelTypeSelect: document.getElementById('travelType'),
        packageSelect: document.getElementById('package'),
        bookingsList: document.getElementById('bookingsList')
    };

    // Populate Package Select based on Travel Type
    async function updatePackageOptions() {
        const selectedType = elements.travelTypeSelect.value;
        const packages = await db.packages.where('type').equals(selectedType).toArray();
        
        elements.packageSelect.innerHTML = packages
            .map(pkg => `<option value="${pkg.id}">${pkg.name} - LKR ${pkg.price}</option>`)
            .join('');
    }

    // Initial Load
    await updatePackageOptions();

    // Event Listener for Type Change
    elements.travelTypeSelect.addEventListener('change', updatePackageOptions);

    // --- 4. Booking Logic ---

    elements.bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            fullName: document.getElementById('fullName').value,
            travelType: document.getElementById('travelType').value,
            packageId: parseInt(document.getElementById('package').value),
            date: document.getElementById('date').value,
            seats: parseInt(document.getElementById('seats').value),
            status: 'Confirmed',
            timestamp: new Date()
        };

        try {
            await db.bookings.add(formData);
            alert('Booking Confirmed Successfully!');
            elements.bookingForm.reset();
            await loadBookings(); // Refresh the list
            // Scroll to my bookings
            document.getElementById('my-bookings').scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Booking failed', error);
            alert('Failed to book. Please try again.');
        }
    });

    // --- 5. Display Bookings Logic ---

    async function loadBookings() {
        const bookings = await db.bookings.reverse().toArray();
        const packages = await db.packages.toArray();
        
        // Helper to get package name
        const getPackageName = (id) => {
            const pkg = packages.find(p => p.id === id);
            return pkg ? pkg.name : 'Unknown Package';
        };

        if (bookings.length === 0) {
            elements.bookingsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-ticket-alt" style="font-size: 3rem; margin-bottom: 1rem; color: #94a3b8;"></i>
                    <p>No bookings yet. Start your journey today!</p>
                </div>`;
            return;
        }

        elements.bookingsList.innerHTML = bookings.map(booking => `
            <div class="booking-card">
                <div class="booking-details">
                    <h4>${getPackageName(booking.packageId)}</h4>
                    <div class="booking-meta">
                        <span><i class="far fa-user"></i> ${booking.fullName}</span>
                        <span><i class="far fa-calendar"></i> ${booking.date}</span>
                        <span><i class="fas fa-users"></i> ${booking.seats} Seats</span>
                    </div>
                </div>
                <div class="booking-status">
                    ${booking.status}
                </div>
            </div>
        `).join('');
    }

    // Load bookings on start
    loadBookings();

    // --- 6. Smooth Scroll & Animations (Simple implementation) ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

});
