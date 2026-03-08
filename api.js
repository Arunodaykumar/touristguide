// API Configuration
const API_BASE_URLS = window.location.protocol === 'file:'
    ? ['http://localhost:3000/api', 'http://localhost:3001/api']
    : [`${window.location.origin}/api`, '/api'];
const ALLOWED_ORIGINS = [
    window.location.origin,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8080',
    'http://127.0.0.1:8080'
];

class ApiClient {
    constructor() {
        this.token = this.getSecureToken();
    }

    getSecureToken() {
        try {
            return localStorage.getItem('authToken');
        } catch (error) {
            console.warn('Failed to retrieve auth token:', error.message);
            return null;
        }
    }

    validateUrl(url) {
        try {
            const urlObj = new URL(url);
            return ALLOWED_ORIGINS.includes(urlObj.origin);
        } catch {
            return false;
        }
    }

    sanitizeInput(input) {
        if (typeof input === 'string') {
            return input.replace(/[<>"'&]/g, (match) => {
                const entities = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;' };
                return entities[match];
            });
        }
        return input;
    }

    async request(endpoint, options = {}) {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            let lastError = null;
            for (const baseUrl of API_BASE_URLS) {
                const url = `${baseUrl}${endpoint}`;
                try {
                    const response = await fetch(url, config);
                    if (!response.ok) {
                        const errorText = await response.text();
                        let errorMessage = 'API request failed';
                        try {
                            const errorData = JSON.parse(errorText);
                            errorMessage = errorData.error || errorMessage;
                        } catch {
                            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                        }
                        lastError = new Error(errorMessage);
                        continue;
                    }
                    const data = await response.json();
                    return data;
                } catch (error) {
                    lastError = error;
                }
            }
            throw lastError || new Error('API request failed');
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                console.warn('Backend not available, using fallback data');
                return this.getFallbackData(endpoint);
            }
            console.error('API Error:', error.message);
            throw error;
        }
    }

    getFallbackData(endpoint) {
        if (endpoint === '/destinations') {
            return [
                { id: 1, name: 'Taj Mahal', country: 'India', category: 'Cultural', rating: 4.9, description: 'Iconic monument of love' },
                { id: 2, name: 'Goa Beaches', country: 'India', category: 'Beach', rating: 4.7, description: 'Beautiful coastal paradise' },
                { id: 3, name: 'Kerala Backwaters', country: 'India', category: 'Nature', rating: 4.8, description: 'Serene waterways' },
                { id: 4, name: 'Rajasthan Palaces', country: 'India', category: 'Cultural', rating: 4.8, description: 'Royal heritage sites' },
                { id: 5, name: 'Himachal Mountains', country: 'India', category: 'Mountain', rating: 4.9, description: 'Himalayan adventure' }
            ];
        }
        if (endpoint === '/guides') {
            return [];
        }
        if (endpoint === '/bookings') {
            return [];
        }
        return [];
    }

    async login(email, password) {
        try {
            const sanitizedEmail = this.sanitizeInput(email);
            const data = await this.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email: sanitizedEmail, password }),
            });
            
            if (data.token) {
                this.token = data.token;
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            
            return data;
        } catch (error) {
            console.error('Login failed:', error.message);
            throw new Error('Login failed. Please check your credentials.');
        }
    }

    logout() {
        try {
            this.token = null;
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
        } catch (error) {
            console.warn('Logout cleanup failed:', error.message);
        }
    }

    async getDestinations(params = {}) {
        try {
            const sanitizedParams = Object.fromEntries(
                Object.entries(params).map(([key, value]) => [key, this.sanitizeInput(value)])
            );
            const queryString = new URLSearchParams(sanitizedParams).toString();
            return await this.request(`/destinations${queryString ? '?' + queryString : ''}`);
        } catch (error) {
            console.error('Failed to fetch destinations:', error.message);
            throw new Error('Unable to load destinations');
        }
    }

    async getDestination(id) {
        try {
            const sanitizedId = this.sanitizeInput(id);
            return await this.request(`/destinations/${encodeURIComponent(sanitizedId)}`);
        } catch (error) {
            console.error('Failed to fetch destination:', error.message);
            throw new Error('Unable to load destination details');
        }
    }

    async createDestination(data) {
        try {
            const sanitizedData = Object.fromEntries(
                Object.entries(data).map(([key, value]) => [key, this.sanitizeInput(value)])
            );
            return await this.request('/destinations', {
                method: 'POST',
                body: JSON.stringify(sanitizedData),
            });
        } catch (error) {
            console.error('Failed to create destination:', error.message);
            throw new Error('Unable to create destination');
        }
    }

    async getGuides(params = {}) {
        try {
            const sanitizedParams = Object.fromEntries(
                Object.entries(params).map(([key, value]) => [key, this.sanitizeInput(value)])
            );
            const queryString = new URLSearchParams(sanitizedParams).toString();
            return await this.request(`/guides${queryString ? '?' + queryString : ''}`);
        } catch (error) {
            console.error('Failed to fetch guides:', error.message);
            throw new Error('Unable to load guides');
        }
    }

    async createGuide(data) {
        try {
            const sanitizedData = Object.fromEntries(
                Object.entries(data).map(([key, value]) => [key, this.sanitizeInput(value)])
            );
            return await this.request('/guides', {
                method: 'POST',
                body: JSON.stringify(sanitizedData),
            });
        } catch (error) {
            console.error('Failed to create guide:', error.message);
            throw new Error('Unable to create guide');
        }
    }

    async getBookings() {
        try {
            return await this.request('/bookings');
        } catch (error) {
            console.error('Failed to fetch bookings:', error.message);
            throw new Error('Unable to load bookings');
        }
    }

    async createBooking(data) {
        try {
            const sanitizedData = Object.fromEntries(
                Object.entries(data).map(([key, value]) => [key, this.sanitizeInput(value)])
            );
            return await this.request('/bookings', {
                method: 'POST',
                body: JSON.stringify(sanitizedData),
            });
        } catch (error) {
            console.error('Failed to create booking:', error.message);
            throw new Error('Unable to create booking');
        }
    }

    async getStats() {
        try {
            return await this.request('/stats');
        } catch (error) {
            console.error('Failed to fetch stats:', error.message);
            throw new Error('Unable to load statistics');
        }
    }
}

// Create global API instance
const api = new ApiClient();
