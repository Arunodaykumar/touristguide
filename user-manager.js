// User Authentication and Profile Management
if (typeof window.showNotification !== 'function') {
    window.showNotification = function(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 10001;
            padding: 12px 20px; border-radius: 8px; color: white; font-weight: 600;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    };
}

class UserManager {
    constructor() {
        this.currentUser = this.getCurrentUser();
        this.initializeAuth();
    }

    setSessionUser(user) {
        if (!user) return;
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('activeUserId', String(user.id));
        localStorage.setItem('lastLoggedInEmail', user.email || '');
        this.setWindowSessionUser(user);
    }

    clearSessionUser() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('activeUserId');
        localStorage.removeItem('lastLoggedInEmail');
        this.setWindowSessionUser(null);
    }

    setWindowSessionUser(user) {
        try {
            window.name = user ? JSON.stringify({ tgUser: user }) : '';
        } catch (error) {
            console.warn('Failed to write window session:', error);
        }
    }

    getWindowSessionUser() {
        try {
            if (!window.name) return null;
            const parsed = JSON.parse(window.name);
            return parsed && parsed.tgUser ? parsed.tgUser : null;
        } catch (error) {
            return null;
        }
    }

    initializeAuth() {
        const syncAuthUI = () => {
            this.currentUser = this.getCurrentUser();
            if (this.currentUser) {
                this.updateUIForLoggedInUser();
            } else {
                this.updateUIForLoggedOutUser();
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', syncAuthUI);
        } else {
            syncAuthUI();
        }

        // Keep navbar in sync across page switches/tabs
        window.addEventListener('focus', syncAuthUI);
        window.addEventListener('storage', (event) => {
            if (!event.key || ['currentUser', 'allUsers', 'activeUserId'].includes(event.key)) {
                syncAuthUI();
            }
        });
    }

    getCurrentUser() {
        try {
            const userData = localStorage.getItem('currentUser');
            if (userData) return JSON.parse(userData);

            const windowSessionUser = this.getWindowSessionUser();
            if (windowSessionUser) {
                this.setSessionUser(windowSessionUser);
                return windowSessionUser;
            }

            const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
            const activeUserId = localStorage.getItem('activeUserId');
            let recoveredUser = activeUserId
                ? allUsers.find(u => String(u.id) === String(activeUserId))
                : null;

            // Secondary fallback by email
            if (!recoveredUser) {
                const lastEmail = localStorage.getItem('lastLoggedInEmail');
                if (lastEmail) {
                    recoveredUser = allUsers.find(u => String(u.email).toLowerCase() === String(lastEmail).toLowerCase()) || null;
                }
            }

            if (recoveredUser) {
                this.setSessionUser(recoveredUser);
            }
            return recoveredUser || null;
        } catch (error) {
            console.error('Error getting current user:', error);
            // If currentUser JSON is corrupted, try restoring from activeUserId
            try {
                localStorage.removeItem('currentUser');
                const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
                const activeUserId = localStorage.getItem('activeUserId');
                let recoveredUser = activeUserId
                    ? allUsers.find(u => String(u.id) === String(activeUserId))
                    : null;
                if (!recoveredUser) {
                    const lastEmail = localStorage.getItem('lastLoggedInEmail');
                    if (lastEmail) {
                        recoveredUser = allUsers.find(u => String(u.email).toLowerCase() === String(lastEmail).toLowerCase()) || null;
                    }
                }
                if (recoveredUser) {
                    this.setSessionUser(recoveredUser);
                }
                return recoveredUser;
            } catch (recoveryError) {
                console.error('User recovery failed:', recoveryError);
                return null;
            }
        }
    }

    syncCurrentUserFromAllUsers() {
        if (!this.currentUser || !this.currentUser.id) return this.currentUser;
        try {
            const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
            const freshUser = allUsers.find(u => String(u.id) === String(this.currentUser.id));
            if (freshUser) {
                this.currentUser = freshUser;
                this.setSessionUser(freshUser);
            }
        } catch (error) {
            console.warn('Unable to sync current user from allUsers:', error);
        }
        return this.currentUser;
    }

    async login(email, password) {
        try {
            // Simulate API call
            const response = await this.simulateLogin(email, password);
            if (response.success) {
                this.currentUser = response.user;
                this.setSessionUser(response.user);
                this.updateUIForLoggedInUser();
                return { success: true, user: response.user };
            }
            return { success: false, message: response.message };
        } catch (error) {
            return { success: false, message: 'Login failed' };
        }
    }

    async register(userData) {
        try {
            // Validate required fields
            if (!userData.name || !userData.email || !userData.password) {
                return { success: false, message: 'Please fill all required fields' };
            }
            
            // Validate password confirmation
            if (userData.password !== userData.confirmPassword) {
                return { success: false, message: 'Passwords do not match' };
            }
            
            // Validate guide-specific fields
            if (userData.role === 'guide') {
                if (!userData.destination || !userData.expertise) {
                    return { success: false, message: 'Please fill all guide information' };
                }
            }
            
            // Check if email already exists
            const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
            if (allUsers.find(user => user.email === userData.email)) {
                return { success: false, message: 'Email already registered' };
            }
            
            // Create user object
            const user = {
                id: Date.now(),
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                photo: userData.photo || '',
                role: userData.role || 'user',
                preferences: [],
                bookings: [],
                favorites: [],
                joinDate: new Date().toISOString(),
                isActive: true
            };
            
            // Add guide-specific fields if role is guide
            if (userData.role === 'guide') {
                user.destination = userData.destination; // Specific destination they guide
                user.location = userData.destination; // Use destination as location
                user.expertise = userData.expertise;
                user.bio = userData.bio;
                user.rating = 4.5;
                user.experience = 1;
                user.rate = 100;
                user.languages = ['Hindi', 'English'];
            }
            
            // Store in allUsers for admin dashboard
            allUsers.push(user);
            localStorage.setItem('allUsers', JSON.stringify(allUsers));
            
            this.currentUser = user;
            this.setSessionUser(user);
            this.updateUIForLoggedInUser();
            return { success: true, user };
        } catch (error) {
            return { success: false, message: 'Registration failed' };
        }
    }

    logout() {
        this.currentUser = null;
        this.clearSessionUser();
        this.updateUIForLoggedOutUser();
    }

    simulateLogin(email, password) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Check registered users first
                const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
                const user = allUsers.find(u => u.email === email);
                
                if (user || (email === 'user@example.com' && password === 'password')) {
                    resolve({
                        success: true,
                        user: user || {
                            id: 1,
                            name: 'akash',
                            email: email,
                            phone: '+91 9876543210',
                            role: 'user',
                            preferences: ['cultural', 'adventure'],
                            bookings: [],
                            favorites: [],
                            joinDate: new Date().toISOString()
                        }
                    });
                } else {
                    resolve({ success: false, message: 'Invalid credentials' });
                }
            }, 1000);
        });
    }

    updateUIForLoggedInUser() {
        // Update navigation
        const authButtons = document.querySelector('.auth-buttons');
        if (authButtons) {
            const unreadCount = this.getUnreadNotificationCount();
            const notificationBadge = unreadCount > 0 ? `<span class="notification-badge">${unreadCount}</span>` : '';
            
            authButtons.innerHTML = `
                <div class="user-menu">
                    <button onclick="userManager.showNotifications()" class="btn-notifications">
                        <i class="fas fa-bell"></i>${notificationBadge}
                    </button>
                    <button onclick="userManager.showMessages()" class="btn-messages">
                        <i class="fas fa-envelope"></i>
                    </button>
                    <a href="dashboard.html" class="btn-dashboard-link">Dashboard</a>
                    <span>Welcome, ${this.currentUser.name}</span>
                    <button onclick="userManager.logout()" class="btn-logout">Logout</button>
                </div>
            `;
        }
    }

    updateUIForLoggedOutUser() {
        const authButtons = document.querySelector('.auth-buttons');
        if (authButtons) {
            authButtons.innerHTML = `
                <button onclick="userManager.showLogin()" class="btn-login">Login</button>
                <button onclick="userManager.showRegister()" class="btn-register">Register</button>
            `;
        }
    }

    showLogin() {
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        modal.innerHTML = `
            <div class="auth-modal">
                <span class="close" onclick="userManager.closeModal(this)">&times;</span>
                <div class="auth-header">
                    <div class="auth-icon">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <h2>Welcome Back</h2>
                    <p>Sign in to your account</p>
                </div>
                <form onsubmit="userManager.handleLogin(event)" class="auth-form">
                    <div class="form-group">
                        <div class="input-group">
                            <i class="fas fa-envelope"></i>
                            <input type="email" name="email" placeholder="Email Address" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="input-group">
                            <i class="fas fa-lock"></i>
                            <input type="password" name="password" placeholder="Password" required id="login-password">
                            <button type="button" class="toggle-password" onclick="userManager.togglePassword('login-password')">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                    <div class="form-options">
                        <label class="checkbox-container">
                            <input type="checkbox" name="remember">
                            <span class="checkmark"></span>
                            Remember me
                        </label>
                        <a href="#" onclick="userManager.showForgotPassword(); userManager.closeModal(this);" class="forgot-link">Forgot Password?</a>
                    </div>
                    <button type="submit" class="auth-btn">
                        <span class="btn-text">Sign In</span>
                        <div class="btn-loader" style="display: none;">
                            <i class="fas fa-spinner fa-spin"></i>
                        </div>
                    </button>
                </form>
                <div class="auth-divider">
                    <span>or continue with</span>
                </div>
                <div class="social-login">
                    <button class="social-btn google-btn" onclick="userManager.socialLogin('google')">
                        <i class="fab fa-google"></i>
                        Google
                    </button>
                    <button class="social-btn facebook-btn" onclick="userManager.socialLogin('facebook')">
                        <i class="fab fa-facebook-f"></i>
                        Facebook
                    </button>
                </div>
                <div class="auth-footer">
                    <p>Don't have an account? <a href="#" onclick="userManager.showRegister(); userManager.closeModal(this);">Create Account</a></p>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    showRegister() {
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        modal.innerHTML = `
            <div class="auth-modal register-modal">
                <span class="close" onclick="userManager.closeModal(this)">&times;</span>
                <div class="auth-header">
                    <div class="auth-icon">
                        <i class="fas fa-user-plus"></i>
                    </div>
                    <h2>Create Account</h2>
                    <p>Join our travel community</p>
                </div>
                <form onsubmit="userManager.handleRegister(event)" class="auth-form">
                    <div class="form-row">
                        <div class="form-group">
                            <div class="input-group">
                                <i class="fas fa-user"></i>
                                <input type="text" name="name" placeholder="Full Name" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="input-group">
                                <i class="fas fa-envelope"></i>
                                <input type="email" name="email" placeholder="Email Address" required>
                            </div>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <div class="input-group">
                                <i class="fas fa-phone"></i>
                                <input type="tel" name="phone" placeholder="Phone Number" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="select-label">Account Type</label>
                            <div class="input-group">
                                <i class="fas fa-user-tag"></i>
                                <select name="role" required id="role-select">
                                    <option value="">Select Role</option>
                                    <option value="user">Tourist</option>
                                    <option value="guide">Tour Guide</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="input-group">
                            <i class="fas fa-lock"></i>
                            <input type="password" name="password" placeholder="Password" required id="register-password" minlength="6">
                            <button type="button" class="toggle-password" onclick="userManager.togglePassword('register-password')">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                        <div class="password-strength" id="password-strength"></div>
                    </div>
                    <div class="form-group">
                        <div class="input-group">
                            <i class="fas fa-lock"></i>
                            <input type="password" name="confirmPassword" placeholder="Confirm Password" required id="confirm-password">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="select-label">Profile Photo (Optional)</label>
                        <div class="input-group">
                            <i class="fas fa-image"></i>
                            <input type="file" name="photoFile" id="register-photo" accept="image/*">
                        </div>
                        <small style="color:#666; display:block; margin-top:6px;">JPG/PNG. Image will be optimized automatically.</small>
                    </div>
                    <div class="form-group" id="guide-fields" style="display: none;">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="select-label">Destination to Guide</label>
                                <div class="input-group">
                                    <i class="fas fa-map-marker-alt"></i>
                                    <select name="destination" id="destination-select">
                                        <option value="">Select Destination to Guide</option>
                                        <option value="Taj Mahal">Taj Mahal</option>
                                        <option value="Goa Beaches">Goa Beaches</option>
                                        <option value="Kerala Backwaters">Kerala Backwaters</option>
                                        <option value="Rajasthan Palaces">Rajasthan Palaces</option>
                                        <option value="Himachal Pradesh">Himachal Pradesh</option>
                                        <option value="Mumbai City">Mumbai City</option>
                                        <option value="Golden Temple">Golden Temple</option>
                                        <option value="Varanasi Ghats">Varanasi Ghats</option>
                                        <option value="Ladakh">Ladakh</option>
                                        <option value="Andaman Islands">Andaman Islands</option>
                                        <option value="Jaipur">Jaipur</option>
                                        <option value="Delhi">Delhi</option>
                                        <option value="Agra">Agra</option>
                                        <option value="Udaipur">Udaipur</option>
                                        <option value="Rishikesh">Rishikesh</option>
                                        <option value="Manali">Manali</option>
                                        <option value="Shimla">Shimla</option>
                                        <option value="Darjeeling">Darjeeling</option>
                                        <option value="Ooty">Ooty</option>
                                        <option value="Kodaikanal">Kodaikanal</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="select-label">Expertise</label>
                                <div class="input-group">
                                    <i class="fas fa-star"></i>
                                    <input type="text" name="expertise" placeholder="Expertise (e.g., Cultural Tours)">
                                </div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="select-label">About Your Experience</label>
                            <div class="input-group">
                                <i class="fas fa-info-circle"></i>
                                <textarea name="bio" placeholder="Tell us about your experience with this destination" rows="3"></textarea>
                            </div>
                        </div>
                    </div>
                    <div class="form-options">
                        <label class="checkbox-container">
                            <input type="checkbox" name="terms" required>
                            <span class="checkmark"></span>
                            I agree to the <a href="#" onclick="userManager.showTerms()">Terms & Conditions</a>
                        </label>
                        <label class="checkbox-container">
                            <input type="checkbox" name="newsletter">
                            <span class="checkmark"></span>
                            Subscribe to newsletter
                        </label>
                    </div>
                    <button type="submit" class="auth-btn">
                        <span class="btn-text">Create Account</span>
                        <div class="btn-loader" style="display: none;">
                            <i class="fas fa-spinner fa-spin"></i>
                        </div>
                    </button>
                </form>
                <div class="auth-divider">
                    <span>or sign up with</span>
                </div>
                <div class="social-login">
                    <button class="social-btn google-btn" onclick="userManager.socialLogin('google')">
                        <i class="fab fa-google"></i>
                        Google
                    </button>
                    <button class="social-btn facebook-btn" onclick="userManager.socialLogin('facebook')">
                        <i class="fab fa-facebook-f"></i>
                        Facebook
                    </button>
                </div>
                <div class="auth-footer">
                    <p>Already have an account? <a href="#" onclick="userManager.showLogin(); userManager.closeModal(this);">Sign In</a></p>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Add event listeners for dynamic form
        this.setupRegisterForm();
        
        // Populate destinations immediately and when guide role is selected
        setTimeout(() => {
            this.populateDestinations();
            this.setupGuideFieldToggle();
        }, 100);
    }

    async handleLogin(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        // Show loading state
        const submitBtn = event.target.querySelector('.auth-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');
        
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-block';
        submitBtn.disabled = true;
        
        const result = await this.login(formData.get('email'), formData.get('password'));
        
        // Reset loading state
        btnText.style.display = 'inline-block';
        btnLoader.style.display = 'none';
        submitBtn.disabled = false;
        
        if (result.success) {
            this.closeModal(event.target);
            showNotification('Login successful!', 'success');
        } else {
            showNotification(result.message, 'error');
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        // Show loading state
        const submitBtn = event.target.querySelector('.auth-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');
        
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-block';
        submitBtn.disabled = true;
        
        const photoFile = formData.get('photoFile');
        let profilePhoto = '';
        if (photoFile && typeof photoFile === 'object' && photoFile.size > 0) {
            try {
                profilePhoto = await this.processProfilePhoto(photoFile);
            } catch (error) {
                showNotification('Profile photo processing failed. Please try a smaller image.', 'error');
                btnText.style.display = 'inline-block';
                btnLoader.style.display = 'none';
                submitBtn.disabled = false;
                return;
            }
        }

        const result = await this.register({
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword'),
            role: formData.get('role'),
            destination: formData.get('destination'), // Specific destination for guides
            expertise: formData.get('expertise'),
            bio: formData.get('bio'),
            photo: profilePhoto
        });
        
        // Reset loading state
        btnText.style.display = 'inline-block';
        btnLoader.style.display = 'none';
        submitBtn.disabled = false;
        
        if (result.success) {
            this.closeModal(event.target);
            showNotification(`Welcome ${result.user.name}! Registration successful!`, 'success');
        } else {
            showNotification(result.message, 'error');
        }
    }
    
    setupRegisterForm() {
        // Role change handler
        const roleSelect = document.querySelector('select[name="role"]');
        const guideFields = document.getElementById('guide-fields');
        
        if (roleSelect && guideFields) {
            roleSelect.addEventListener('change', function() {
                if (this.value === 'guide') {
                    guideFields.style.display = 'block';
                    guideFields.querySelectorAll('input, textarea, select').forEach(field => {
                        field.required = true;
                    });
                    // Populate destinations dynamically with delay
                    setTimeout(() => {
                        userManager.populateDestinations();
                        console.log('Guide role selected, populating destinations...');
                    }, 300);
                } else {
                    guideFields.style.display = 'none';
                    guideFields.querySelectorAll('input, textarea, select').forEach(field => {
                        field.required = false;
                    });
                }
            }.bind(this));
        }
        
        // Password strength checker
        const passwordInput = document.getElementById('register-password');
        const strengthDiv = document.getElementById('password-strength');
        
        if (passwordInput && strengthDiv) {
            passwordInput.addEventListener('input', function() {
                const password = this.value;
                const strength = this.checkPasswordStrength(password);
                strengthDiv.innerHTML = `<div class="strength-bar strength-${strength.level}"><span>${strength.text}</span></div>`;
            }.bind(this));
        }
        
        // Confirm password validation
        const confirmPasswordInput = document.getElementById('confirm-password');
        if (confirmPasswordInput && passwordInput) {
            confirmPasswordInput.addEventListener('input', function() {
                if (this.value && this.value !== passwordInput.value) {
                    this.setCustomValidity('Passwords do not match');
                } else {
                    this.setCustomValidity('');
                }
            });
        }
    }

    processProfilePhoto(file, maxWidth = 420, quality = 0.78) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const maxDataUrlLength = 160000;
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        const ratio = maxWidth / width;
                        width = maxWidth;
                        height = Math.round(height * ratio);
                    }

                    const render = (q) => {
                        canvas.width = Math.max(1, Math.round(width));
                        canvas.height = Math.max(1, Math.round(height));
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        return canvas.toDataURL('image/jpeg', q);
                    };

                    let q = quality;
                    let output = render(q);
                    while (output.length > maxDataUrlLength && q > 0.5) {
                        q -= 0.07;
                        output = render(q);
                    }
                    resolve(output);
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    checkPasswordStrength(password) {
        let score = 0;
        if (password.length >= 8) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        
        const levels = [
            { level: 'weak', text: 'Weak' },
            { level: 'weak', text: 'Weak' },
            { level: 'medium', text: 'Medium' },
            { level: 'strong', text: 'Strong' },
            { level: 'very-strong', text: 'Very Strong' }
        ];
        
        return levels[score] || levels[0];
    }
    
    populateDestinations() {
        try {
            const destinationSelect = document.querySelector('select[name="destination"]');
            if (!destinationSelect) {
                console.warn('Destination select not found');
                return;
            }
            
            // Get all destinations from localStorage and fallback data
            const savedDestinations = JSON.parse(localStorage.getItem('destinations') || '[]');
            const fallbackDestinations = [
                'Taj Mahal', 'Goa Beaches', 'Kerala Backwaters', 'Rajasthan Palaces', 
                'Himachal Pradesh', 'Mumbai City', 'Golden Temple', 'Varanasi Ghats', 
                'Ladakh', 'Andaman Islands', 'Jaipur', 'Delhi', 'Agra', 'Udaipur',
                'Rishikesh', 'Manali', 'Shimla', 'Darjeeling', 'Ooty', 'Kodaikanal'
            ];
            
            // Combine and get unique destination names
            const savedNames = savedDestinations.map(d => d.name).filter(name => name);
            const allDestinations = [...savedNames, ...fallbackDestinations];
            const uniqueDestinations = [...new Set(allDestinations)];
            
            // Clear existing options except first one
            destinationSelect.innerHTML = '<option value="">Select Destination to Guide</option>';
            
            // Add all destinations as options
            uniqueDestinations.forEach(destination => {
                if (destination && destination.trim()) {
                    const option = document.createElement('option');
                    option.value = destination;
                    option.textContent = destination;
                    destinationSelect.appendChild(option);
                }
            });
            
            console.log('Populated', uniqueDestinations.length, 'destinations for guide registration');
            
            // Make sure the select is visible
            destinationSelect.style.display = 'block';
            destinationSelect.parentElement.style.display = 'flex';
            
        } catch (error) {
            console.error('Error populating destinations:', error);
            // Add fallback options if there's an error
            const destinationSelect = document.querySelector('select[name="destination"]');
            if (destinationSelect) {
                destinationSelect.innerHTML = `
                    <option value="">Select Destination to Guide</option>
                    <option value="Taj Mahal">Taj Mahal</option>
                    <option value="Goa Beaches">Goa Beaches</option>
                    <option value="Kerala Backwaters">Kerala Backwaters</option>
                    <option value="Rajasthan Palaces">Rajasthan Palaces</option>
                    <option value="Himachal Pradesh">Himachal Pradesh</option>
                    <option value="Mumbai City">Mumbai City</option>
                `;
            }
        }
    }
    
    setupGuideFieldToggle() {
        const roleSelect = document.getElementById('role-select');
        const guideFields = document.getElementById('guide-fields');
        
        if (roleSelect && guideFields) {
            roleSelect.addEventListener('change', function() {
                console.log('Role changed to:', this.value);
                if (this.value === 'guide') {
                    guideFields.style.display = 'block';
                    guideFields.querySelectorAll('input, textarea, select').forEach(field => {
                        field.required = true;
                    });
                    console.log('Guide fields shown and made required');
                } else {
                    guideFields.style.display = 'none';
                    guideFields.querySelectorAll('input, textarea, select').forEach(field => {
                        field.required = false;
                    });
                    console.log('Guide fields hidden');
                }
            });
        } else {
            console.warn('Role select or guide fields not found');
        }
    }
    
    socialLogin(provider) {
        showNotification(`${provider} login will be available soon!`, 'info');
    }
    
    showForgotPassword() {
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        modal.innerHTML = `
            <div class="auth-modal forgot-modal">
                <span class="close" onclick="userManager.closeModal(this)">&times;</span>
                <div class="auth-header">
                    <div class="auth-icon">
                        <i class="fas fa-key"></i>
                    </div>
                    <h2>Reset Password</h2>
                    <p>Enter your email to receive reset instructions</p>
                </div>
                <form onsubmit="userManager.handleForgotPassword(event)" class="auth-form">
                    <div class="form-group">
                        <div class="input-group">
                            <i class="fas fa-envelope"></i>
                            <input type="email" name="email" placeholder="Email Address" required>
                        </div>
                    </div>
                    <button type="submit" class="auth-btn">
                        Send Reset Link
                    </button>
                </form>
                <div class="auth-footer">
                    <p><a href="#" onclick="userManager.showLogin(); userManager.closeModal(this);">Back to Login</a></p>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    handleForgotPassword(event) {
        event.preventDefault();
        const email = new FormData(event.target).get('email');
        this.closeModal(event.target);
        showNotification('Password reset link sent to your email!', 'success');
    }
    
    closeModal(element) {
        if (!element || typeof element.closest !== 'function') return;
        const modal = element.closest('.modal-backdrop');
        if (modal) {
            const intervalId = Number(modal.dataset.chatIntervalId || 0);
            if (intervalId) {
                clearInterval(intervalId);
            }
            modal.remove();
        }
    }
    
    togglePassword(inputId) {
        const input = document.getElementById(inputId);
        const button = input.parentElement.querySelector('.toggle-password i');
        
        if (input.type === 'password') {
            input.type = 'text';
            button.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            button.className = 'fas fa-eye';
        }
    }
    
    showTerms() {
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        modal.innerHTML = `
            <div class="auth-modal terms-modal">
                <span class="close" onclick="userManager.closeModal(this)">&times;</span>
                <h2>Terms & Conditions</h2>
                <div class="terms-content">
                    <h3>1. Acceptance of Terms</h3>
                    <p>By using TouristGuide, you agree to these terms and conditions.</p>
                    
                    <h3>2. User Responsibilities</h3>
                    <p>Users must provide accurate information and use the service responsibly.</p>
                    
                    <h3>3. Guide Responsibilities</h3>
                    <p>Tour guides must be licensed and provide safe, quality services.</p>
                    
                    <h3>4. Privacy Policy</h3>
                    <p>We protect your personal information and use it only for service improvement.</p>
                    
                    <h3>5. Cancellation Policy</h3>
                    <p>Bookings can be cancelled up to 24 hours before the scheduled time.</p>
                </div>
                <button class="auth-btn" onclick="userManager.closeModal(this)">I Understand</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    showProfile() {
        if (!this.currentUser) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        modal.innerHTML = `
            <div class="profile-modal">
                <span class="close" onclick="userManager.closeModal(this)">&times;</span>
                <div class="profile-header">
                    <div class="profile-avatar">
                        <img src="${this.currentUser.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'}" alt="Profile">
                        <button class="edit-photo-btn" onclick="userManager.editPhoto()"><i class="fas fa-camera"></i></button>
                    </div>
                    <div class="profile-info">
                        <h2>${this.currentUser.name}</h2>
                        <p class="profile-role">${this.currentUser.role === 'guide' ? '🎯 Tour Guide' : '🧳 Traveler'}</p>
                        <div class="profile-stats">
                            <div class="stat">
                                <span class="stat-number">${this.currentUser.bookings?.length || 0}</span>
                                <span class="stat-label">Bookings</span>
                            </div>
                            <div class="stat">
                                <span class="stat-number">${this.currentUser.favorites?.length || 0}</span>
                                <span class="stat-label">Favorites</span>
                            </div>
                            ${this.currentUser.role === 'guide' ? `
                            <div class="stat">
                                <span class="stat-number">${this.currentUser.rating || '4.5'}</span>
                                <span class="stat-label">Rating</span>
                            </div>` : ''}
                        </div>
                    </div>
                </div>
                <div class="profile-content">
                    <div class="profile-tabs">
                        <button class="tab-btn active" onclick="userManager.showTab('details')">Details</button>
                        <button class="tab-btn" onclick="userManager.showTab('bookings')">Bookings</button>
                        <button class="tab-btn" onclick="userManager.showTab('favorites')">Favorites</button>
                        ${this.currentUser.role === 'guide' ? '<button class="tab-btn" onclick="userManager.showTab(\'guide\')">Guide Info</button>' : ''}
                    </div>
                    <div class="tab-content">
                        <div id="details-tab" class="tab-pane active">
                            <div class="detail-item">
                                <i class="fas fa-envelope"></i>
                                <span>${this.currentUser.email}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-phone"></i>
                                <span>${this.currentUser.phone}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-calendar"></i>
                                <span>Joined ${new Date(this.currentUser.joinDate).toLocaleDateString()}</span>
                            </div>
                            ${this.currentUser.location ? `
                            <div class="detail-item">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${this.currentUser.location}</span>
                            </div>` : ''}
                        </div>
                        <div id="bookings-tab" class="tab-pane">
                            ${this.currentUser.bookings?.length ? 
                                this.currentUser.bookings.map(booking => `
                                    <div class="booking-card">
                                        <h4>${booking.destination || booking.guide}</h4>
                                        <div class="booking-details">
                                            <span><i class="fas fa-calendar"></i> ${booking.date}</span>
                                            <span><i class="fas fa-users"></i> ${booking.people} people</span>
                                            <span><i class="fas fa-rupee-sign"></i> ${booking.amount}</span>
                                        </div>
                                        <div class="booking-actions" style="margin-top: 10px;">
                                            <button onclick="userManager.openBookingChat('${booking.id}')" class="btn-secondary">
                                                <i class="fas fa-comments"></i> Chat
                                            </button>
                                        </div>
                                        <span class="booking-status status-${booking.status}">${booking.status}</span>
                                    </div>
                                `).join('') : 
                                '<div class="empty-state"><i class="fas fa-suitcase"></i><p>No bookings yet</p></div>'
                            }
                        </div>
                        <div id="favorites-tab" class="tab-pane">
                            ${this.currentUser.favorites?.length ? 
                                this.currentUser.favorites.map(fav => `
                                    <div class="favorite-card">
                                        <span>${fav.type}: ${fav.id}</span>
                                        <button onclick="userManager.removeFromFavorites('${fav.id}')" class="remove-btn"><i class="fas fa-times"></i></button>
                                    </div>
                                `).join('') : 
                                '<div class="empty-state"><i class="fas fa-heart"></i><p>No favorites yet</p></div>'
                            }
                        </div>
                        ${this.currentUser.role === 'guide' ? `
                        <div id="guide-tab" class="tab-pane">
                            <div class="guide-info">
                                <div class="info-card">
                                    <h4>Expertise</h4>
                                    <p>${this.currentUser.expertise || 'General Tours'}</p>
                                </div>
                                <div class="info-card">
                                    <h4>Experience</h4>
                                    <p>${this.currentUser.experience || '1'} years</p>
                                </div>
                                <div class="info-card">
                                    <h4>Rate</h4>
                                    <p>₹${this.currentUser.rate || '100'}/hour</p>
                                </div>
                                <div class="info-card full-width">
                                    <h4>About</h4>
                                    <p>${this.currentUser.bio || 'Professional tour guide with local expertise'}</p>
                                </div>
                            </div>
                        </div>` : ''}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    showTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        
        event.target.classList.add('active');
        document.getElementById(tabName + '-tab').classList.add('active');
    }

    editPhoto() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.currentUser.photo = e.target.result;
                    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                    const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
                    const userIndex = allUsers.findIndex(u => u.id === this.currentUser.id);
                    if (userIndex > -1) {
                        allUsers[userIndex] = this.currentUser;
                        localStorage.setItem('allUsers', JSON.stringify(allUsers));
                    }
                    document.querySelector('.profile-avatar img').src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }

    addToFavorites(itemId, itemType) {
        if (!this.currentUser) {
            this.showLogin();
            return;
        }
        
        const favorite = { id: itemId, type: itemType, addedAt: new Date().toISOString() };
        this.currentUser.favorites.push(favorite);
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        showNotification('Added to favorites!', 'success');
    }

    removeFromFavorites(itemId) {
        if (!this.currentUser) return;
        
        this.currentUser.favorites = this.currentUser.favorites.filter(fav => fav.id !== itemId);
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        showNotification('Removed from favorites', 'info');
    }

    getUnreadNotificationCount() {
        if (!this.currentUser) return 0;
        const notifications = this.currentUser.notifications || [];
        return notifications.filter(n => !n.read).length;
    }

    showNotifications() {
        if (!this.currentUser) return;
        
        const notifications = this.currentUser.notifications || [];
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="userManager.closeModal(this)">&times;</span>
                <h2><i class="fas fa-bell"></i> Notifications</h2>
                <div class="notifications-list">
                    ${notifications.length > 0 ? 
                        notifications.map(notification => `
                            <div class="notification-item ${notification.read ? 'read' : 'unread'}" onclick="userManager.markAsRead('${notification.id}')">
                                <div class="notification-header">
                                    <h4>${notification.title}</h4>
                                    <span class="notification-date">${new Date(notification.date).toLocaleDateString()}</span>
                                </div>
                                <p>${notification.message}</p>
                                ${notification.bookingId ? `<small>Booking ID: ${notification.bookingId}</small>` : ''}
                            </div>
                        `).join('') : 
                        '<div class="empty-state"><i class="fas fa-bell-slash"></i><p>No notifications</p></div>'
                    }
                </div>
                <div class="notification-actions">
                    <button onclick="userManager.markAllAsRead()" class="btn-secondary">Mark All as Read</button>
                    <button onclick="userManager.clearNotifications()" class="btn-danger">Clear All</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    showMessages() {
        if (!this.currentUser) return;
        
        const messages = this.currentUser.messages || [];
        const sentMessages = this.currentUser.sentMessages || [];
        const allMessages = [...messages, ...sentMessages].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        modal.innerHTML = `
            <div class="modal-content messages-modal">
                <span class="close" onclick="userManager.closeModal(this)">&times;</span>
                <h2><i class="fas fa-envelope"></i> Messages</h2>
                <div class="messages-list">
                    ${allMessages.length > 0 ? 
                        allMessages.map(message => `
                            <div class="message-item ${message.read ? 'read' : 'unread'}" onclick="userManager.openMessage('${message.id}')">
                                <div class="message-header">
                                    <h4>${message.subject}</h4>
                                    <span class="message-date">${new Date(message.date).toLocaleDateString()}</span>
                                </div>
                                <p class="message-preview">${message.message.substring(0, 100)}...</p>
                                <div class="message-meta">
                                    <span>${String(message.from) === String(this.currentUser.id) ? 'To: ' + message.toName : 'From: ' + message.fromName}</span>
                                    ${message.bookingId ? `<span>Booking: ${message.bookingId}</span>` : ''}
                                </div>
                            </div>
                        `).join('') : 
                        '<div class="empty-state"><i class="fas fa-inbox"></i><p>No messages</p></div>'
                    }
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    openMessage(messageId) {
        const messages = [...(this.currentUser.messages || []), ...(this.currentUser.sentMessages || [])];
        const message = messages.find(m => m.id == messageId);
        if (!message) return;

        // Mark as read if it's an incoming message
        if (String(message.to) === String(this.currentUser.id) && !message.read) {
            this.markMessageAsRead(messageId);
        }

        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        modal.innerHTML = `
            <div class="modal-content message-detail-modal">
                <span class="close" onclick="userManager.closeModal(this)">&times;</span>
                <div class="message-detail">
                    <div class="message-header">
                        <h2>${message.subject}</h2>
                        <div class="message-meta">
                            <span><strong>${String(message.from) === String(this.currentUser.id) ? 'To' : 'From'}:</strong> ${String(message.from) === String(this.currentUser.id) ? message.toName : message.fromName}</span>
                            <span><strong>Date:</strong> ${new Date(message.date).toLocaleString()}</span>
                            ${message.bookingId ? `<span><strong>Booking ID:</strong> ${message.bookingId}</span>` : ''}
                        </div>
                    </div>
                    <div class="message-body">
                        <p>${message.message}</p>
                    </div>
                    <div class="message-actions">
                        ${String(message.from) !== String(this.currentUser.id) ? `<button onclick="userManager.replyToMessage('${message.id}')" class="btn-primary">Reply</button>` : ''}
                        <button onclick="userManager.closeModal(this)" class="btn-secondary">Close</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    replyToMessage(originalMessageId) {
        const messages = [...(this.currentUser.messages || []), ...(this.currentUser.sentMessages || [])];
        const originalMessage = messages.find(m => m.id == originalMessageId);
        if (!originalMessage) return;

        this.closeModal(document.querySelector('.message-detail-modal .close'));
        const recipientId = String(originalMessage.from) === String(this.currentUser.id) ? originalMessage.to : originalMessage.from;
        const recipientName = String(originalMessage.from) === String(this.currentUser.id) ? originalMessage.toName : originalMessage.fromName;

        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="userManager.closeModal(this)">&times;</span>
                <h2><i class="fas fa-reply"></i> Reply to ${recipientName}</h2>
                <form onsubmit="userManager.sendReply(event, '${recipientId}', '${originalMessage.bookingId || ''}')">
                    <div class="form-group">
                        <label>Subject</label>
                        <input type="text" name="subject" value="Re: ${originalMessage.subject}" required>
                    </div>
                    <div class="form-group">
                        <label>Message</label>
                        <textarea name="message" rows="4" placeholder="Type your reply..." required></textarea>
                    </div>
                    <button type="submit" class="btn-primary">
                        <i class="fas fa-paper-plane"></i> Send Reply
                    </button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    }

    sendReply(event, recipientId, bookingId) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
        const recipientIndex = allUsers.findIndex(u => u.id == recipientId);
        
        if (recipientIndex !== -1) {
            const message = {
                id: Date.now(),
                from: this.currentUser.id,
                fromName: this.currentUser.name,
                to: recipientId,
                toName: allUsers[recipientIndex].name,
                subject: formData.get('subject'),
                message: formData.get('message'),
                bookingId: bookingId,
                date: new Date().toISOString(),
                read: false
            };
            
            // Add to recipient's messages
            allUsers[recipientIndex].messages = allUsers[recipientIndex].messages || [];
            allUsers[recipientIndex].messages.push(message);
            
            // Add to sender's sent messages
            this.currentUser.sentMessages = this.currentUser.sentMessages || [];
            this.currentUser.sentMessages.push(message);
            
            localStorage.setItem('allUsers', JSON.stringify(allUsers));
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            this.closeModal(event.target);
            showNotification('Reply sent successfully!', 'success');
        }
    }

    resolveChatRecipientFromBooking(booking) {
        const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
        const currentUserId = String(this.currentUser.id);
        const bookingCustomerId = String(booking.customerId || '');
        const bookingGuideId = String(booking.guideId || '');
        const currentUserRole = this.currentUser.role || 'user';

        // Tourist view: message should go to guide.
        // Fallback to role-based matching for older bookings that do not store customerId.
        const isTouristSide = (bookingCustomerId && bookingCustomerId === currentUserId) || currentUserRole !== 'guide';
        if (isTouristSide) {
            if (booking.guideId) {
                const guide = allUsers.find(u => String(u.id) === String(booking.guideId));
                if (guide) return { id: guide.id, name: guide.name };
            }
            if (booking.guide) {
                const guideByName = allUsers.find(
                    u => u.role === 'guide' && String(u.name).toLowerCase() === String(booking.guide).toLowerCase()
                );
                if (guideByName) return { id: guideByName.id, name: guideByName.name };
            }
        }

        // Guide view: message should go to tourist.
        // Fallback to role-based matching for older bookings that do not store guideId.
        const isGuideSide = (bookingGuideId && bookingGuideId === currentUserId) || currentUserRole === 'guide';
        if (isGuideSide) {
            if (booking.customerId) {
                const customer = allUsers.find(u => String(u.id) === String(booking.customerId));
                if (customer) return { id: customer.id, name: customer.name };
            }
            if (booking.customerEmail) {
                const customerByEmail = allUsers.find(
                    u => String(u.email || '').toLowerCase() === String(booking.customerEmail).toLowerCase()
                );
                if (customerByEmail) return { id: customerByEmail.id, name: customerByEmail.name };
            }
            if (booking.customerName) {
                const customerByName = allUsers.find(
                    u => String(u.name).toLowerCase() === String(booking.customerName).toLowerCase()
                );
                if (customerByName) return { id: customerByName.id, name: customerByName.name };
            }
        }

        // Last fallback for older bookings: infer recipient from booking message history.
        const bookingMessages = [...(this.currentUser.messages || []), ...(this.currentUser.sentMessages || [])]
            .filter(message => String(message.bookingId || '') === String(booking.id || ''));
        const counterpartMessage = bookingMessages.find(message =>
            String(message.from) === currentUserId && String(message.to) !== currentUserId
        ) || bookingMessages.find(message =>
            String(message.to) === currentUserId && String(message.from) !== currentUserId
        );
        if (counterpartMessage) {
            const recipientId = String(counterpartMessage.from) === currentUserId ? counterpartMessage.to : counterpartMessage.from;
            const recipient = allUsers.find(u => String(u.id) === String(recipientId));
            if (recipient) return { id: recipient.id, name: recipient.name };
            const fallbackName = String(counterpartMessage.from) === currentUserId
                ? counterpartMessage.toName
                : counterpartMessage.fromName;
            return { id: recipientId, name: fallbackName || 'User' };
        }

        // Final fallback: infer recipient from mirrored booking entries.
        const bookingId = String(booking.id || '');
        if (bookingId) {
            const mirroredUser = allUsers.find(u =>
                String(u.id) !== currentUserId &&
                (u.bookings || []).some(b => String(b.id) === bookingId)
            );
            if (mirroredUser) {
                return { id: mirroredUser.id, name: mirroredUser.name };
            }
        }

        return null;
    }

    canOpenBookingChat(booking) {
        if (!this.currentUser || !booking) return false;
        if (!String(booking.id || '').trim()) return false;
        return Boolean(this.resolveChatRecipientFromBooking(booking));
    }

    openBookingChat(bookingId) {
        if (!this.currentUser) return;
        this.syncCurrentUserFromAllUsers();

        const bookings = this.currentUser.bookings || [];
        let booking = bookings.find(b => String(b.id) === String(bookingId));

        // Fallback: find booking from all users where current user is participant
        if (!booking) {
            const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
            const allBookings = allUsers.flatMap(user => user.bookings || []);
            const currentUserId = String(this.currentUser.id);
            booking = allBookings.find(b => {
                if (String(b.id) !== String(bookingId)) return false;
                const isGuide = String(b.guideId || '') === currentUserId;
                const isCustomer = String(b.customerId || '') === currentUserId;
                const isNamedGuide = this.currentUser.role === 'guide' &&
                    String(b.guide || '').toLowerCase() === String(this.currentUser.name || '').toLowerCase();
                const isNamedCustomer = this.currentUser.role !== 'guide' &&
                    String(b.customerName || '').toLowerCase() === String(this.currentUser.name || '').toLowerCase();
                return isGuide || isCustomer || isNamedGuide || isNamedCustomer;
            });
        }

        if (!booking) {
            showNotification('Booking not found', 'error');
            return;
        }

        const recipient = this.resolveChatRecipientFromBooking(booking);
        if (!recipient || !recipient.id) {
            showNotification('Unable to find chat recipient for this booking', 'error');
            return;
        }

        const existingChatClose = document.querySelector('.booking-chat-modal .close');
        if (existingChatClose) this.closeModal(existingChatClose);

        const threadId = `booking-chat-thread-${booking.id}-${Date.now()}`;
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        modal.innerHTML = `
            <div class="modal-content booking-chat-modal">
                <span class="close" onclick="userManager.closeModal(this)">&times;</span>
                <div class="booking-chat-header">
                    <div class="booking-chat-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="booking-chat-meta">
                        <h2>${recipient.name}</h2>
                        <p>Booking #${booking.id} | ${booking.date || 'Date TBD'} | ${booking.people || '-'} people</p>
                    </div>
                </div>
                <div class="booking-chat-thread" id="${threadId}"></div>
                <form class="booking-chat-input-wrap" onsubmit="userManager.sendBookingChatMessage(event, '${recipient.id}', '${booking.id}', '${threadId}')">
                    <input type="hidden" name="subject" value="Regarding booking #${booking.id}">
                    <textarea name="message" rows="1" placeholder="Type a message" required onkeydown="userManager.handleBookingChatKeydown(event)" oninput="userManager.autoResizeBookingChatInput(this)"></textarea>
                    <button type="submit" class="btn-primary" aria-label="Send message">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        this.renderBookingChatMessages(recipient.id, booking.id, threadId);
        this.attachBookingChatAutoRefresh(modal, recipient.id, booking.id, threadId);
    }

    getBookingChatMessages(recipientId, bookingId) {
        if (!this.currentUser) return [];
        this.syncCurrentUserFromAllUsers();

        const inbox = this.currentUser.messages || [];
        const sent = this.currentUser.sentMessages || [];
        const currentUserId = String(this.currentUser.id);

        return [...inbox, ...sent]
            .filter(message => {
                const sameBooking = String(message.bookingId || '') === String(bookingId || '');
                const sameParticipants =
                    (String(message.from) === currentUserId && String(message.to) === String(recipientId)) ||
                    (String(message.to) === currentUserId && String(message.from) === String(recipientId));
                return sameBooking && sameParticipants;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    renderBookingChatMessages(recipientId, bookingId, threadId) {
        const thread = document.getElementById(threadId);
        if (!thread || !this.currentUser) return;

        const messages = this.getBookingChatMessages(recipientId, bookingId);
        const currentUserId = String(this.currentUser.id);
        const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (char) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[char]);

        if (messages.length === 0) {
            thread.innerHTML = `
                <div class="booking-chat-empty">
                    <i class="fas fa-comments"></i>
                    <p>Start conversation for booking #${bookingId}</p>
                </div>
            `;
            return;
        }

        thread.innerHTML = messages.map(message => {
            const isOutgoing = String(message.from) === currentUserId;
            const time = new Date(message.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return `
                <div class="booking-chat-bubble-row ${isOutgoing ? 'outgoing' : 'incoming'}">
                    <div class="booking-chat-bubble ${isOutgoing ? 'outgoing' : 'incoming'}">
                        <p>${escapeHtml(message.message)}</p>
                        <span>${time}</span>
                    </div>
                </div>
            `;
        }).join('');

        const unreadIncoming = (this.currentUser.messages || []).filter(message =>
            String(message.bookingId || '') === String(bookingId || '') &&
            String(message.from) === String(recipientId) &&
            String(message.to) === String(this.currentUser.id) &&
            !message.read
        );
        if (unreadIncoming.length) {
            unreadIncoming.forEach(message => {
                message.read = true;
            });
            const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
            const userIndex = allUsers.findIndex(u => String(u.id) === String(this.currentUser.id));
            if (userIndex !== -1) {
                const inbox = allUsers[userIndex].messages || [];
                inbox.forEach(message => {
                    const matchesCurrentUnread = unreadIncoming.some(unread => String(unread.id) === String(message.id));
                    if (matchesCurrentUnread) {
                        message.read = true;
                    }
                });
                allUsers[userIndex].messages = inbox;
                localStorage.setItem('allUsers', JSON.stringify(allUsers));
                this.currentUser = allUsers[userIndex];
            }
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        }

        thread.scrollTop = thread.scrollHeight;
    }

    attachBookingChatAutoRefresh(modal, recipientId, bookingId, threadId) {
        if (!modal) return;
        const intervalId = setInterval(() => {
            if (!document.body.contains(modal)) {
                clearInterval(intervalId);
                return;
            }
            this.syncCurrentUserFromAllUsers();
            this.renderBookingChatMessages(recipientId, bookingId, threadId);
        }, 3000);
        modal.dataset.chatIntervalId = String(intervalId);
    }

    autoResizeBookingChatInput(textarea) {
        if (!textarea) return;
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }

    handleBookingChatKeydown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            const form = event.target.closest('form');
            if (!form) return;

            if (typeof form.requestSubmit === 'function') {
                form.requestSubmit();
            } else {
                form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            }
        }
    }

    sendBookingChatMessage(event, recipientId, bookingId, threadId) {
        event.preventDefault();
        if (!this.currentUser) return;

        const formData = new FormData(event.target);
        const messageText = String(formData.get('message') || '').trim();
        if (!messageText) return;

        const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
        const recipientIndex = allUsers.findIndex(u => String(u.id) === String(recipientId));
        if (recipientIndex === -1) {
            showNotification('Recipient not found', 'error');
            return;
        }

        const recipientName = allUsers[recipientIndex].name || 'User';
        const message = {
            id: Date.now(),
            from: this.currentUser.id,
            fromName: this.currentUser.name,
            to: recipientId,
            toName: recipientName,
            subject: formData.get('subject') || `Regarding booking #${bookingId}`,
            message: messageText,
            bookingId: bookingId,
            date: new Date().toISOString(),
            read: false
        };

        allUsers[recipientIndex].messages = allUsers[recipientIndex].messages || [];
        allUsers[recipientIndex].messages.push(message);
        allUsers[recipientIndex].notifications = allUsers[recipientIndex].notifications || [];
        allUsers[recipientIndex].notifications.push({
            id: Date.now() + 1,
            type: 'message',
            title: 'New Message',
            message: `${this.currentUser.name} sent you a message.`,
            bookingId: bookingId,
            read: false,
            date: new Date().toISOString()
        });

        this.currentUser.sentMessages = this.currentUser.sentMessages || [];
        this.currentUser.sentMessages.push(message);

        const senderIndex = allUsers.findIndex(u => String(u.id) === String(this.currentUser.id));
        if (senderIndex !== -1) {
            allUsers[senderIndex].sentMessages = allUsers[senderIndex].sentMessages || [];
            allUsers[senderIndex].sentMessages.push(message);
            this.currentUser = allUsers[senderIndex];
        }

        localStorage.setItem('allUsers', JSON.stringify(allUsers));
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

        const textarea = event.target.querySelector('textarea[name="message"]');
        if (textarea) {
            textarea.value = '';
            this.autoResizeBookingChatInput(textarea);
            textarea.focus();
        }

        this.renderBookingChatMessages(recipientId, bookingId, threadId);
    }

    markAsRead(notificationId) {
        if (!this.currentUser) return;
        
        const notifications = this.currentUser.notifications || [];
        const notification = notifications.find(n => n.id == notificationId);
        if (notification) {
            notification.read = true;
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            // Update in allUsers as well
            const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
            const userIndex = allUsers.findIndex(u => u.id === this.currentUser.id);
            if (userIndex > -1) {
                allUsers[userIndex] = this.currentUser;
                localStorage.setItem('allUsers', JSON.stringify(allUsers));
            }
            
            this.updateUIForLoggedInUser();
        }
    }

    markMessageAsRead(messageId) {
        if (!this.currentUser) return;
        
        const messages = this.currentUser.messages || [];
        const message = messages.find(m => m.id == messageId);
        if (message) {
            message.read = true;
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            // Update in allUsers as well
            const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
            const userIndex = allUsers.findIndex(u => u.id === this.currentUser.id);
            if (userIndex > -1) {
                allUsers[userIndex] = this.currentUser;
                localStorage.setItem('allUsers', JSON.stringify(allUsers));
            }
        }
    }

    markAllAsRead() {
        if (!this.currentUser) return;
        
        const notifications = this.currentUser.notifications || [];
        notifications.forEach(n => n.read = true);
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        
        // Update in allUsers as well
        const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
        const userIndex = allUsers.findIndex(u => u.id === this.currentUser.id);
        if (userIndex > -1) {
            allUsers[userIndex] = this.currentUser;
            localStorage.setItem('allUsers', JSON.stringify(allUsers));
        }
        
        this.updateUIForLoggedInUser();
        this.closeModal(document.querySelector('.modal-backdrop .close'));
        showNotification('All notifications marked as read', 'success');
    }

    clearNotifications() {
        if (!this.currentUser) return;
        
        if (confirm('Are you sure you want to clear all notifications?')) {
            this.currentUser.notifications = [];
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            // Update in allUsers as well
            const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
            const userIndex = allUsers.findIndex(u => u.id === this.currentUser.id);
            if (userIndex > -1) {
                allUsers[userIndex] = this.currentUser;
                localStorage.setItem('allUsers', JSON.stringify(allUsers));
            }
            
            this.updateUIForLoggedInUser();
            this.closeModal(document.querySelector('.modal-backdrop .close'));
            showNotification('All notifications cleared', 'success');
        }
    }
}

// Initialize user manager
const userManager = new UserManager();
window.userManager = userManager;
