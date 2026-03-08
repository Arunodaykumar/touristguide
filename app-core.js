// Enhanced Tourist Guide Application with Advanced Features
const app = {
    // State Management
    state: {
        currentPage: 'home',
        destinations: [],
        guides: [],
        blogPosts: [],
        bookings: [],
        tourists: [],
        feedbacks: [],
        currentDestinationId: null,
        currentGuideId: null,
        currentBlogPostId: null,
        adminLoggedIn: false,
        searchQuery: '',
        filteredDestinations: [],
        filteredGuides: [],
        topBarTitle: "Tourist Guide",
        appLogo: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=60&h=60&fit=crop&crop=center",
        bookingCalendar: {
            date: new Date(),
            selectedDate: null,
        },
        footerAboutText: "Your ultimate guide to unforgettable travel experiences across India.",
        whyUsPoints: [],
        imageFavorites: [],
        contactPhone: "+91 98765 43210",
        contactEmail: "info@touristguide.com",
        contactAddress: "123 Travel Street, New Delhi, India",
        contactHours: "9:00 AM - 6:00 PM",
        supportEmail: "support@touristguide.com",
        facebookUrl: "https://facebook.com/touristguide",
        instagramUrl: "https://instagram.com/touristguide",
        twitterUrl: "https://twitter.com/touristguide",
        linkedinUrl: "https://linkedin.com/company/touristguide"
    },

    // DOM Cache with performance optimization
    domCache: new Map(),
    
    getDOMElement(id) {
        try {
            if (!this.domCache.has(id)) {
                const element = document.getElementById(id);
                if (element) {
                    this.domCache.set(id, element);
                }
            }
            return this.domCache.get(id) || null;
        } catch (error) {
            console.warn(`Failed to get DOM element: ${id}`, error.message);
            return null;
        }
    },
    
    clearDOMCache() {
        this.domCache.clear();
    },

    // Input sanitization for XSS prevention
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        return input.replace(/[<>"'&]/g, (match) => {
            const entities = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;' };
            return entities[match];
        });
    },

    // Validation with error handling
    isValidEmail(email) {
        try {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        } catch (error) {
            console.warn('Email validation error:', error.message);
            return false;
        }
    },

    isValidDate(dateStr) {
        try {
            const date = new Date(dateStr);
            return date instanceof Date && !isNaN(date);
        } catch (error) {
            console.warn('Date validation error:', error.message);
            return false;
        }
    },

    validateFormData(data, schema) {
        try {
            for (let field in schema) {
                const value = this.sanitizeInput(data[field]);
                if (!value) {
                    return { valid: false, error: `${field} is required` };
                }
                if (schema[field].type === 'email' && !this.isValidEmail(value)) {
                    return { valid: false, error: `${field} is not a valid email` };
                }
                if (schema[field].type === 'number' && isNaN(value)) {
                    return { valid: false, error: `${field} must be a number` };
                }
            }
            return { valid: true };
        } catch (error) {
            console.error('Form validation error:', error.message);
            return { valid: false, error: 'Validation failed' };
        }
    },

    // Error Handling
    handleError(error, defaultMessage = 'An error occurred') {
        console.error(defaultMessage, error);
        const userMessage = error.message || defaultMessage;
        this.showNotification(userMessage, 'error', 3000);
    },

    // Notification System with XSS protection
    showNotification(message, type = 'info', duration = 3000) {
        try {
            const notificationId = 'notification-' + Date.now();
            const notification = document.createElement('div');
            notification.id = notificationId;
            notification.className = `toast ${type}`;
            notification.textContent = this.sanitizeInput(message); // XSS protection
            document.body.appendChild(notification);
            
            setTimeout(() => {
                const el = document.getElementById(notificationId);
                if (el) el.remove();
            }, duration);
        } catch (error) {
            console.error('Notification error:', error.message);
        }
    },

    // Utility Functions
    formatDate(date) {
        if (!date) return '';
        if (typeof date === 'string') date = new Date(date);
        return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    },

    formatCurrency(amount, currency = 'INR') {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency
        }).format(amount);
    },

    truncateText(text, length = 100) {
        if (!text) return '';
        return text.length > length ? text.substring(0, length) + '...' : text;
    },

    debounce(func, wait = 300) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    },

    // Initialization
    init() {
        try {
            this.loadInitialData();
            this.loadSettingsFromStorage();
            this.setupEventListeners();
            this.setupScrollAnimations();
            this.handleRouting();
            this.renderFooter();
        } catch (error) {
            console.error('Init error:', error);
            this.showNotification('Failed to load app: ' + error.message, 'error', 5000);
        }
    },

    // Load Initial Data
    loadInitialData() {
        this.state.whyUsPoints = [
            { id: 1, title: "Expert Local Guides", description: "Our guides are certified, passionate locals who bring you the most authentic stories and hidden gems.", icon: 'compass' },
            { id: 2, title: "Tailored Experiences", description: "From solo travelers to family groups, we help you find the perfect tour that matches your interests and pace.", icon: 'shield-check' },
            { id: 3, title: "Secure & Easy Booking", description: "Our platform ensures your bookings and payments are safe, simple, and transparent.", icon: 'lock' }
        ];

        // Sample destinations
        this.state.destinations = [
            {
                id: 1, name: "Varanasi", state: "Uttar Pradesh",
                image: "https://images.unsplash.com/photo-1582227866368-35c24905c1b6?w=400",
                frontImage: "https://images.unsplash.com/photo-1582227866368-35c24905c1b6?w=800",
                short_desc: "The spiritual capital of India.",
                rating: 4.9, best_time: "October to March", category: 'Spiritual',
                description: "Varanasi, one of the oldest living cities in the world, is a place of pilgrimage and spiritual significance.",
                activities: ["Ganga Aarti Ceremony", "Sunrise Boat Ride", "Kashi Vishwanath Temple Visit", "Exploring Old City Lanes"],
                gallery: [
                    "https://images.unsplash.com/photo-1582227866368-35c24905c1b6?w=400",
                    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
                    "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400",
                    "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=400"
                ]
            },
            {
                id: 2, name: "Jaipur", state: "Rajasthan",
                image: "https://images.unsplash.com/photo-1557690756-62754e16398f?w=400",
                frontImage: "https://images.unsplash.com/photo-1557690756-62754e16398f?w=800",
                short_desc: "The Pink City, known for forts and palaces.",
                rating: 4.8, best_time: "October to March", category: 'Historical',
                description: "Jaipur, the capital of Rajasthan, is a vibrant city of majestic forts, royal palaces, and bustling bazaars.",
                activities: ["Amber Fort Exploration", "Hawa Mahal Photography", "City Palace Tour", "Jantar Mantar Visit"],
                gallery: [
                    "https://images.unsplash.com/photo-1557690756-62754e16398f?w=400",
                    "https://images.unsplash.com/photo-1599661046827-dacde6976549?w=400",
                    "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=400",
                    "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400"
                ]
            },
            {
                id: 3, name: "Alleppey", state: "Kerala",
                image: "https://images.unsplash.com/photo-1593693411515-c162634e45c2?w=400",
                frontImage: "https://images.unsplash.com/photo-1593693411515-c162634e45c2?w=800",
                short_desc: "The Venice of the East, famous for its backwaters.",
                rating: 4.9, best_time: "September to March", category: 'Nature',
                description: "Alleppey is globally recognized for its tranquil backwater network and houseboat cruises.",
                activities: ["Houseboat Cruise", "Village Tour", "Kayaking", "Toddy Tasting"],
                gallery: [
                    "https://images.unsplash.com/photo-1593693411515-c162634e45c2?w=400",
                    "https://images.unsplash.com/photo-1602164893546-21876a445f65?w=400",
                    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
                    "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400"
                ]
            }
        ];

        // Sample guides
        this.state.guides = [
            {
                id: 101, name: "Ramesh Kumar", location: "Varanasi",
                languages: ["Hindi", "English"], expertise: "Spiritual Tours, Ganga Rituals",
                rating: 4.9, hourly_rate_inr: 800, experience_years: 15,
                photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
                bio: "Born and raised in Varanasi, I have an intimate knowledge of the city's ancient traditions.",
                booked_dates: ["2025-10-15", "2025-10-16"], reviews: []
            },
            {
                id: 102, name: "Priya Singh", location: "Jaipur",
                languages: ["Hindi", "English", "French"], expertise: "Historical Forts, Rajasthani Culture",
                rating: 4.8, hourly_rate_inr: 900, experience_years: 8,
                photo: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
                bio: "A certified historian and storyteller, I bring the majestic history of Jaipur's forts to life.",
                booked_dates: ["2025-10-20"], reviews: []
            }
        ];

        // Sample blog posts
        this.state.blogPosts = [
            {
                id: 201, title: "A Spiritual Dawn in Varanasi", author: "Priya Singh", date: "2025-09-15",
                image: "https://images.unsplash.com/photo-1582227866368-35c24905c1b6?w=800",
                tags: ["Spiritual", "Varanasi", "Culture"],
                content: "<p>Waking up before dawn in Varanasi is an experience that transcends mere tourism...</p>"
            }
        ];
    },

    // Event Listeners with error handling
    setupEventListeners() {
        try {
            window.addEventListener('hashchange', () => this.handleRouting());
            window.addEventListener('popstate', () => this.handleRouting());
            
            const mobileMenuButton = this.getDOMElement('mobile-menu-button');
            if (mobileMenuButton) {
                mobileMenuButton.addEventListener('click', () => {
                    try {
                        const mobileMenu = this.getDOMElement('mobile-menu');
                        if (mobileMenu) mobileMenu.classList.toggle('hidden');
                    } catch (error) {
                        console.warn('Mobile menu toggle error:', error.message);
                    }
                });
            }
        } catch (error) {
            console.error('Event listener setup error:', error.message);
        }
    },

    // Optimized scroll animations
    setupScrollAnimations() {
        try {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => { 
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target); // Performance optimization
                    }
                });
            }, { threshold: 0.1 });
            
            const elements = document.querySelectorAll('.fade-in-section');
            elements.forEach(section => { 
                if (section) observer.observe(section); 
            });
        } catch (error) {
            console.error('Scroll animation setup error:', error.message);
        }
    },

    // Routing
    handleRouting() {
        try {
            const hash = (window.location.hash || '').replace('#', '');
            
            if (!hash) {
                this.state.currentPage = 'home';
            } else {
                const [page, id] = hash.split('/');
                this.state.currentPage = page || 'home';
                
                if (page === 'destination-detail' && id) {
                    this.state.currentDestinationId = parseInt(id);
                }
                
                if (page === 'blog-post' && id) {
                    this.state.currentBlogPostId = parseInt(id);
                }
            }
            
            this.render();
        } catch (error) {
            console.error('Routing error:', error);
            this.state.currentPage = 'home';
            this.render();
        }
    },

    navigateTo(page, param = null) {
        if (param) {
            window.location.hash = `${page}/${param}`;
        } else {
            window.location.hash = page;
        }
    },

    // Storage Management with error handling
    loadSettingsFromStorage() {
        try {
            const stored = localStorage.getItem('tourist-guide-settings');
            if (stored) {
                const settings = JSON.parse(stored);
                Object.keys(settings).forEach(key => {
                    if (this.state.hasOwnProperty(key)) {
                        this.state[key] = this.sanitizeInput(settings[key]);
                    }
                });
            }
        } catch (error) {
            console.error('Failed to load settings:', error.message);
            this.handleError(error, 'Failed to load saved settings');
        }
    },

    saveSettingsToStorage() {
        try {
            const settings = {
                topBarTitle: this.sanitizeInput(this.state.topBarTitle),
                appLogo: this.sanitizeInput(this.state.appLogo),
                footerAboutText: this.sanitizeInput(this.state.footerAboutText),
                contactPhone: this.sanitizeInput(this.state.contactPhone),
                contactEmail: this.sanitizeInput(this.state.contactEmail),
                contactAddress: this.sanitizeInput(this.state.contactAddress),
                lastSyncTime: Date.now()
            };
            localStorage.setItem('tourist-guide-settings', JSON.stringify(settings));
        } catch (error) {
            console.error('Failed to save settings:', error.message);
            this.handleError(error, 'Failed to save settings');
        }
    }
};