// Comprehensive Data Manager for Tourist Guide Website
class DataManager {
    constructor() {
        this.cache = new Map();
        this.init();
    }

    init() {
        this.setupStorageEvents();
        this.initializeDefaultData();
        this.startDataSync();
    }

    // Initialize default data if not exists
    initializeDefaultData() {
        if (!localStorage.getItem('destinations')) {
            const defaultDestinations = [
                {
                    id: 1,
                    name: "Taj Mahal",
                    description: "Iconic white marble mausoleum and UNESCO World Heritage Site in Agra.",
                    bestTime: "October to March",
                    rating: 4.9,
                    category: "cultural",
                    country: "India",
                    price: 2500,
                    imageUrl: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400"
                },
                {
                    id: 2,
                    name: "Goa Beaches",
                    description: "Beautiful beaches with Portuguese heritage and vibrant nightlife.",
                    bestTime: "November to February",
                    rating: 4.7,
                    category: "beach",
                    country: "India",
                    price: 3000,
                    imageUrl: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400"
                },
                {
                    id: 3,
                    name: "Kerala Backwaters",
                    description: "Serene backwaters with houseboat cruises and lush greenery.",
                    bestTime: "September to March",
                    rating: 4.8,
                    category: "nature",
                    country: "India",
                    price: 4000,
                    imageUrl: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400"
                }
            ];
            this.saveDestinations(defaultDestinations);
        }

        if (!localStorage.getItem('allUsers')) {
            localStorage.setItem('allUsers', JSON.stringify([]));
        }
    }

    // Setup storage event listeners
    setupStorageEvents() {
        window.addEventListener('storage', (e) => {
            if (e.key === 'destinations') {
                this.cache.delete('destinations');
                this.notifyDataChange('destinations');
            }
            if (e.key === 'allUsers') {
                this.cache.delete('users');
                this.notifyDataChange('users');
            }
        });
    }

    // Start data synchronization
    startDataSync() {
        setInterval(() => {
            this.syncData();
        }, 5000); // Sync every 5 seconds
    }

    // Sync data across tabs
    syncData() {
        const currentUser = this.getCurrentUser();
        if (currentUser) {
            const allUsers = this.getAllUsers();
            const userIndex = allUsers.findIndex(u => u.id === currentUser.id);
            if (userIndex > -1 && JSON.stringify(allUsers[userIndex]) !== JSON.stringify(currentUser)) {
                allUsers[userIndex] = currentUser;
                this.saveAllUsers(allUsers);
            }
        }
    }

    // Notify components of data changes
    notifyDataChange(dataType) {
        window.dispatchEvent(new CustomEvent('dataChanged', { 
            detail: { type: dataType } 
        }));
    }

    // Destination management
    getDestinations() {
        if (this.cache.has('destinations')) {
            return this.cache.get('destinations');
        }

        const saved = JSON.parse(localStorage.getItem('destinations') || '[]');
        this.cache.set('destinations', saved);
        return saved;
    }

    saveDestinations(destinations) {
        localStorage.setItem('destinations', JSON.stringify(destinations));
        this.cache.set('destinations', destinations);
        this.notifyDataChange('destinations');
    }

    addDestination(destination) {
        const destinations = this.getDestinations();
        destination.id = Date.now();
        destinations.push(destination);
        this.saveDestinations(destinations);
        return destination;
    }

    updateDestination(id, updates) {
        const destinations = this.getDestinations();
        const index = destinations.findIndex(d => d.id === id);
        if (index > -1) {
            destinations[index] = { ...destinations[index], ...updates };
            this.saveDestinations(destinations);
            return destinations[index];
        }
        return null;
    }

    deleteDestination(id) {
        const destinations = this.getDestinations();
        const protectedNames = new Set([
            'taj mahal',
            'goa beaches',
            'kerala backwaters',
            'rajasthan palaces',
            'himachal pradesh'
        ]);
        const target = destinations.find(d => d.id === id);
        if (target) {
            const targetName = String(target.name || '').toLowerCase();
            if (protectedNames.has(targetName) || target.isDefault) {
                return false;
            }
        }
        const filtered = destinations.filter(d => d.id !== id);
        this.saveDestinations(filtered);
        return true;
    }

    searchDestinations(query, category = '') {
        const destinations = this.getDestinations();
        return destinations.filter(dest => {
            const matchesQuery = !query || 
                dest.name.toLowerCase().includes(query.toLowerCase()) ||
                dest.description.toLowerCase().includes(query.toLowerCase());
            const matchesCategory = !category || dest.category === category;
            return matchesQuery && matchesCategory;
        });
    }

    // User management
    getAllUsers() {
        if (this.cache.has('users')) {
            return this.cache.get('users');
        }

        const users = JSON.parse(localStorage.getItem('allUsers') || '[]');
        this.cache.set('users', users);
        return users;
    }

    saveAllUsers(users) {
        localStorage.setItem('allUsers', JSON.stringify(users));
        this.cache.set('users', users);
        this.notifyDataChange('users');
    }

    getCurrentUser() {
        return JSON.parse(localStorage.getItem('currentUser') || 'null');
    }

    saveCurrentUser(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Update in allUsers as well
        const allUsers = this.getAllUsers();
        const index = allUsers.findIndex(u => u.id === user.id);
        if (index > -1) {
            allUsers[index] = user;
            this.saveAllUsers(allUsers);
        }
    }

    registerUser(userData) {
        const allUsers = this.getAllUsers();
        
        // Check if user already exists
        if (allUsers.find(u => u.email === userData.email)) {
            throw new Error('User already exists with this email');
        }

        const newUser = {
            id: Date.now(),
            ...userData,
            bookings: [],
            favorites: [],
            messages: [],
            createdAt: new Date().toISOString()
        };

        allUsers.push(newUser);
        this.saveAllUsers(allUsers);
        return newUser;
    }

    loginUser(email, password) {
        const allUsers = this.getAllUsers();
        const user = allUsers.find(u => u.email === email && u.password === password);
        
        if (user) {
            this.saveCurrentUser(user);
            return user;
        }
        
        throw new Error('Invalid credentials');
    }

    logoutUser() {
        localStorage.removeItem('currentUser');
        this.notifyDataChange('currentUser');
    }

    // Booking management
    addBooking(userId, bookingData) {
        const allUsers = this.getAllUsers();
        const userIndex = allUsers.findIndex(u => u.id === userId);
        
        if (userIndex > -1) {
            const booking = {
                id: Date.now(),
                ...bookingData,
                status: 'confirmed',
                createdAt: new Date().toISOString()
            };

            allUsers[userIndex].bookings = allUsers[userIndex].bookings || [];
            allUsers[userIndex].bookings.push(booking);
            
            this.saveAllUsers(allUsers);
            
            // Update current user if it's the same user
            const currentUser = this.getCurrentUser();
            if (currentUser && currentUser.id === userId) {
                this.saveCurrentUser(allUsers[userIndex]);
            }
            
            return booking;
        }
        
        throw new Error('User not found');
    }

    getUserBookings(userId) {
        const allUsers = this.getAllUsers();
        const user = allUsers.find(u => u.id === userId);
        return user ? (user.bookings || []) : [];
    }

    // Favorites management
    addToFavorites(userId, destinationId) {
        const allUsers = this.getAllUsers();
        const userIndex = allUsers.findIndex(u => u.id === userId);
        
        if (userIndex > -1) {
            allUsers[userIndex].favorites = allUsers[userIndex].favorites || [];
            if (!allUsers[userIndex].favorites.includes(destinationId)) {
                allUsers[userIndex].favorites.push(destinationId);
                this.saveAllUsers(allUsers);
                
                // Update current user
                const currentUser = this.getCurrentUser();
                if (currentUser && currentUser.id === userId) {
                    this.saveCurrentUser(allUsers[userIndex]);
                }
            }
        }
    }

    removeFromFavorites(userId, destinationId) {
        const allUsers = this.getAllUsers();
        const userIndex = allUsers.findIndex(u => u.id === userId);
        
        if (userIndex > -1) {
            allUsers[userIndex].favorites = allUsers[userIndex].favorites || [];
            allUsers[userIndex].favorites = allUsers[userIndex].favorites.filter(id => id !== destinationId);
            this.saveAllUsers(allUsers);
            
            // Update current user
            const currentUser = this.getCurrentUser();
            if (currentUser && currentUser.id === userId) {
                this.saveCurrentUser(allUsers[userIndex]);
            }
        }
    }

    // Messages management
    addMessage(userId, messageData) {
        const allUsers = this.getAllUsers();
        const userIndex = allUsers.findIndex(u => u.id === userId);
        
        if (userIndex > -1) {
            const message = {
                id: Date.now(),
                ...messageData,
                read: false,
                createdAt: new Date().toISOString()
            };

            allUsers[userIndex].messages = allUsers[userIndex].messages || [];
            allUsers[userIndex].messages.push(message);
            
            this.saveAllUsers(allUsers);
            
            // Update current user
            const currentUser = this.getCurrentUser();
            if (currentUser && currentUser.id === userId) {
                this.saveCurrentUser(allUsers[userIndex]);
            }
            
            return message;
        }
    }

    // Analytics and statistics
    getStatistics() {
        const destinations = this.getDestinations();
        const users = this.getAllUsers();
        const allBookings = users.flatMap(u => u.bookings || []);
        const guides = users.filter(u => u.role === 'guide');

        return {
            totalDestinations: destinations.length,
            totalUsers: users.length,
            totalGuides: guides.length,
            totalBookings: allBookings.length,
            totalRevenue: allBookings.reduce((sum, booking) => sum + (booking.amount || 0), 0),
            popularDestinations: this.getPopularDestinations(allBookings),
            recentBookings: allBookings.slice(-10).reverse()
        };
    }

    getPopularDestinations(bookings) {
        const destinationCounts = {};
        bookings.forEach(booking => {
            if (booking.destination) {
                destinationCounts[booking.destination] = (destinationCounts[booking.destination] || 0) + 1;
            }
        });

        return Object.entries(destinationCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, bookings: count }));
    }

    // Data export/import
    exportData() {
        return {
            destinations: this.getDestinations(),
            users: this.getAllUsers(),
            timestamp: new Date().toISOString()
        };
    }

    importData(data) {
        if (data.destinations) {
            this.saveDestinations(data.destinations);
        }
        if (data.users) {
            this.saveAllUsers(data.users);
        }
    }

    // Data validation
    validateDestination(destination) {
        const required = ['name', 'description', 'category', 'rating'];
        const missing = required.filter(field => !destination[field]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }

        if (destination.rating < 1 || destination.rating > 5) {
            throw new Error('Rating must be between 1 and 5');
        }

        return true;
    }

    validateUser(user) {
        const required = ['name', 'email', 'password'];
        const missing = required.filter(field => !user[field]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
            throw new Error('Invalid email format');
        }

        if (user.password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }

        return true;
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }

    // Get cache size
    getCacheSize() {
        return this.cache.size;
    }
}

// Create global instance
window.dataManager = new DataManager();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
}
