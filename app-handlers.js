// Additional Page Renders and Handler Functions

app.renderDestinationDetailPage = function() {
    const dest = this.state.destinations.find(d => d.id === this.state.currentDestinationId);
    if (!dest) return `<p class="text-center text-xl text-slate-500">Destination not found.</p>`;
    
    const relatedGuides = this.state.guides.filter(g => g.location === dest.name);
    const isFavorite = (JSON.parse(localStorage.getItem('favorites') || '[]')).some(f => f.id === dest.id && f.type === 'destination');
    
    return `
        <div class="page max-w-6xl mx-auto">
            <!-- Hero Section -->
            <div class="relative mb-10 rounded-3xl overflow-hidden shadow-2xl group">
                <img src="${dest.frontImage || dest.image}" alt="${dest.name}" class="w-full h-96 object-cover group-hover:brightness-90 transition bg-slate-200">
                <div class="absolute inset-0 bg-black bg-opacity-40 flex items-end p-8 md:p-12">
                    <div class="text-white flex-1">
                        <h1 class="text-4xl md:text-6xl font-extrabold mb-2">${dest.name}, ${dest.state}</h1>
                        <p class="text-2xl font-light">${dest.short_desc}</p>
                    </div>
                </div>
                <button onclick="app.toggleFavorite('destination', ${dest.id}, '${dest.name}')" class="absolute top-4 right-4 ${isFavorite ? 'text-red-500' : 'text-white'} text-4xl hover:scale-125 transition z-10">
                    <i class="fas fa-heart"></i>
                </button>
            </div>

            <!-- Quick Info Cards -->
            <div class="grid md:grid-cols-3 gap-4 mb-8">
                <div class="bg-gradient-to-br from-orange-50 to-yellow-50 p-6 rounded-lg border-2 border-orange-200">
                    <p class="text-slate-600 font-semibold text-sm"><i class="fas fa-star"></i> Rating</p>
                    <p class="text-3xl font-bold text-orange-600 mt-2">${dest.rating}</p>
                </div>
                <div class="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-lg border-2 border-blue-200">
                    <p class="text-slate-600 font-semibold text-sm"><i class="fas fa-calendar"></i> Best Time</p>
                    <p class="text-lg font-bold text-blue-600 mt-2">${dest.best_time || 'Year-round'}</p>
                </div>
                <div class="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border-2 border-green-200">
                    <p class="text-slate-600 font-semibold text-sm"><i class="fas fa-tag"></i> Category</p>
                    <p class="text-lg font-bold text-green-600 mt-2">${dest.category}</p>
                </div>
            </div>

            <!-- Gallery -->
            ${dest.gallery && dest.gallery.length > 0 ? `
                <div class="mb-10">
                    <h2 class="text-3xl font-bold text-slate-800 mb-4"><i class="fas fa-images"></i> Gallery (${dest.gallery.length} Images)</h2>
                    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        ${dest.gallery.map((img, idx) => `
                            <div class="rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition group cursor-pointer relative" onclick="app.showImageModal('${img}')">
                                <img src="${img}" alt="Gallery ${idx+1}" class="w-full h-48 object-cover group-hover:scale-110 transition duration-300 bg-slate-200">
                                <div class="bg-slate-900 bg-opacity-0 group-hover:bg-opacity-60 transition p-2 text-center text-white text-sm font-semibold absolute inset-0 flex items-center justify-center">
                                    <i class="fas fa-search-plus text-2xl"></i>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- About and Activities -->
            <div class="grid lg:grid-cols-3 gap-8 mb-10">
                <div class="lg:col-span-2">
                    <div class="bg-white p-8 rounded-lg shadow-md mb-8">
                        <h2 class="text-3xl font-bold text-slate-800 mb-4"><i class="fas fa-info-circle"></i> About ${dest.name}</h2>
                        <p class="text-lg leading-relaxed text-slate-700">${dest.description}</p>
                    </div>
                    <div class="bg-white p-8 rounded-lg shadow-md">
                        <h2 class="text-3xl font-bold text-slate-800 mb-6"><i class="fas fa-list"></i> Things to Do</h2>
                        <ul class="space-y-4">
                            ${dest.activities.map((activity, idx) => `
                                <li class="flex items-start text-lg">
                                    <span class="inline-flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-600 rounded-full mr-3 flex-shrink-0 font-bold">${idx+1}</span>
                                    <span class="text-slate-700">${activity}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>

                <!-- Sidebar -->
                <div>
                    <div class="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border-2 border-purple-200 sticky top-20">
                        <h3 class="font-bold text-lg mb-4"><i class="fas fa-clipboard-list"></i> Quick Info</h3>
                        <div class="space-y-3 text-sm">
                            <div>
                                <p class="text-slate-600 font-semibold"><i class="fas fa-map-marker-alt"></i> Location</p>
                                <p class="text-slate-800">${dest.state}</p>
                            </div>
                            <div>
                                <p class="text-slate-600 font-semibold"><i class="fas fa-map"></i> Type</p>
                                <p class="text-slate-800">${dest.category}</p>
                            </div>
                            <div>
                                <p class="text-slate-600 font-semibold"><i class="fas fa-thermometer-half"></i> Best Season</p>
                                <p class="text-slate-800">${dest.best_time}</p>
                            </div>
                            <div>
                                <p class="text-slate-600 font-semibold"><i class="fas fa-users"></i> Available Guides</p>
                                <p class="text-slate-800 font-bold text-lg">${relatedGuides.length}</p>
                            </div>
                        </div>
                        <button onclick="app.navigateTo('destinations')" class="w-full mt-6 bg-purple-500 text-white py-2 rounded-lg font-semibold hover:bg-purple-600 transition">
                            <i class="fas fa-arrow-left"></i> Back to Destinations
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Guides Section -->
            <section class="py-16 fade-in-section bg-gradient-to-r from-orange-50 to-amber-50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 rounded-3xl">
                <div class="max-w-6xl mx-auto">
                    <div class="section-header">
                        <h2><i class="fas fa-user-tie"></i> Expert Guides in ${dest.name}</h2>
                        <p>Book authentic experiences with our certified local experts</p>
                    </div>
                    ${relatedGuides.length > 0 ? `
                        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            ${relatedGuides.map(guide => this.renderGuideCard(guide)).join('')}
                        </div>
                    ` : `
                        <div class="bg-white p-12 rounded-2xl text-center shadow-lg">
                            <i class="fas fa-user-slash text-6xl text-slate-300 mb-4"></i>
                            <p class="text-slate-600 text-lg"><i class="fas fa-bell"></i> No guides available for this location yet.</p>
                            <p class="text-slate-500 mt-2">Please check back later or contact us for recommendations.</p>
                        </div>
                    `}
                </div>
            </section>
        </div>
    `;
};

app.renderGuidesPage = function() {
    return `
        <div class="page">
            <div class="container">
                <div class="section-header">
                    <h1>Expert Local Guides</h1>
                    <p>Connect with passionate locals who know their destinations inside out</p>
                </div>
                
                <!-- Search and Filter -->
                <div class="search-section">
                    <div class="search-box">
                        <input id="guide-search" type="text" placeholder="Search guides by name, location, expertise...">
                        <select id="location-filter">
                            <option value="">All Locations</option>
                            ${[...new Set(this.state.guides.map(g => g.location))].map(loc => `<option value="${loc}">${loc}</option>`).join('')}
                        </select>
                        <button class="search-btn">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                </div>

                <!-- Guides Grid -->
                <div class="guide-cards">
                    ${this.state.guides.map(guide => this.renderGuideCard(guide)).join('')}
                </div>
            </div>
        </div>
    `;
};

app.renderBlogPage = function() {
    return `
        <div class="page">
            <div class="container">
                <div class="section-header">
                    <h1>Travel Blog</h1>
                    <p>Stories, tips, and insights from India's most enchanting destinations</p>
                </div>
                <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    ${this.state.blogPosts.map(post => this.renderBlogCard(post)).join('')}
                </div>
            </div>
        </div>
    `;
};

app.renderBlogCard = function(post) {
    return `
        <div class="blog-card cursor-pointer" onclick="app.navigateTo('blog-post', ${post.id})">
            <img src="${post.image}" alt="${post.title}" class="w-full h-48 object-cover">
            <div class="p-5">
                <h3 class="text-lg font-bold text-slate-800 mb-2">${post.title}</h3>
                <p class="text-sm text-slate-500 mb-3">By ${post.author} • ${post.date}</p>
                <div class="flex flex-wrap gap-2 mb-3">
                    ${post.tags.map(tag => `<span class="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded">${tag}</span>`).join('')}
                </div>
            </div>
        </div>
    `;
};

app.renderGalleryPage = function() {
    const allImages = this.state.destinations.reduce((acc, dest) => {
        if (dest.gallery) {
            dest.gallery.forEach(img => {
                acc.push({ src: img, title: dest.name, category: dest.category });
            });
        }
        return acc;
    }, []);

    return `
        <div class="page">
            <div class="container">
                <div class="section-header">
                    <h1>Travel Gallery</h1>
                    <p>Beautiful moments captured around India</p>
                </div>
                <div class="gallery-grid">
                    ${allImages.map((img, idx) => `
                        <div class="gallery-item" onclick="app.showImageModal('${img.src}')">
                            <img src="${img.src}" alt="${img.title}" loading="lazy">
                            <div class="gallery-overlay">
                                <i class="fas fa-search-plus"></i>
                                <p class="mt-2 font-semibold">${img.title}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
};

// Handler Functions
app.toggleFavorite = function(type, id, name) {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const existingIndex = favorites.findIndex(f => f.id === id && f.type === type);
    
    if (existingIndex > -1) {
        favorites.splice(existingIndex, 1);
        this.showNotification(`Removed ${name} from favorites`, 'info');
    } else {
        favorites.push({ id, type, name, addedDate: new Date().toISOString() });
        this.showNotification(`Added ${name} to favorites`, 'success');
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
};

app.bookGuide = function(guideId, guideName, rate) {
    this.showNotification(`Booking ${guideName} - Feature coming soon!`, 'info');
    // In a real app, this would navigate to booking page
    // this.navigateTo('booking', guideId);
};

app.showImageModal = function(imageSrc) {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
        <div class="modal-content max-w-4xl">
            <button onclick="this.closest('.modal-backdrop').remove()" class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-10">
                <i class="fas fa-times"></i>
            </button>
            <img src="${imageSrc}" class="w-full h-auto rounded-lg" alt="Gallery Image">
        </div>
    `;
    document.body.appendChild(modal);
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
};

app.postRenderSetup = function() {
    try {
        this.setupAccountMenuHandler();
        
        const pageSetupMap = {
            'home': () => this.setupHomePageEvents(),
            'destinations': () => this.setupDestinationsPageEvents(),
            'guides': () => this.setupGuidesPageEvents(),
        };
        
        const setupFunction = pageSetupMap[this.state.currentPage];
        if (setupFunction) {
            setupFunction();
        }
    } catch (error) {
        console.error('Error in postRenderSetup:', error);
    }
};

app.setupAccountMenuHandler = function() {
    document.addEventListener('click', (e) => {
        const accountMenuButton = this.getDOMElement('account-menu-button');
        const accountMenuDropdown = this.getDOMElement('account-menu-dropdown');
        
        if (accountMenuButton && accountMenuDropdown) {
            if (!e.target.closest('#account-menu-button') && !e.target.closest('#account-menu-dropdown')) {
                accountMenuDropdown.classList.add('hidden');
            }
        }
    });
};

app.setupHomePageEvents = function() {
    try {
        const searchInput = document.getElementById('destination-search');
        const searchButton = document.getElementById('hero-search-button');
        
        if (searchInput && searchButton) {
            const performSearch = () => {
                this.state.searchQuery = searchInput.value.trim();
                if (this.state.searchQuery) {
                    this.navigateTo('destinations');
                } else {
                    this.showNotification('Please enter a search term', 'warning');
                }
            };
            
            searchButton.addEventListener('click', (e) => {
                e.preventDefault();
                performSearch();
            });
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    performSearch();
                }
            });
        }
    } catch (error) {
        console.error('Error setting up home page events:', error);
    }
};

app.setupDestinationsPageEvents = function() {
    const searchInput = document.getElementById('destination-search');
    if (searchInput) {
        searchInput.value = this.state.searchQuery;
        
        const debouncedSearch = this.debounce((value) => {
            this.handleSearch(value);
        }, 300);
        
        searchInput.addEventListener('input', (e) => {
            debouncedSearch(e.target.value);
        });
    }
};

app.setupGuidesPageEvents = function() {
    const searchInput = document.getElementById('guide-search');
    if (searchInput) {
        const debouncedSearch = this.debounce((value) => {
            this.handleGuideSearch(value);
        }, 300);
        
        searchInput.addEventListener('input', (e) => {
            debouncedSearch(e.target.value);
        });
    }
};

app.handleSearch = function(query) {
    // Simple search implementation
    this.state.searchQuery = query.toLowerCase();
    // In a real app, this would filter destinations and re-render
    console.log('Searching for:', query);
};

app.handleGuideSearch = function(query) {
    // Simple guide search implementation
    console.log('Searching guides for:', query);
};

app.toggleAccountMenu = function() {
    const dropdown = document.getElementById('account-menu-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
    }
};

app.confirmLogout = function() {
    if (confirm('Are you sure you want to logout?')) {
        this.showNotification('Logged out successfully', 'success');
    }
};

// Additional placeholder functions for missing pages
app.renderAIPlannerPage = function() {
    return `<div class="page"><div class="container"><h1>AI Trip Planner</h1><p>Coming soon...</p></div></div>`;
};

app.renderAuthHub = function() {
    return `<div class="page"><div class="container"><h1>Login / Register</h1><p>Authentication system coming soon...</p></div></div>`;
};

app.renderFeedbackPage = function() {
    return `<div class="page"><div class="container"><h1>Feedback</h1><p>Feedback form coming soon...</p></div></div>`;
};

app.renderContactPage = function() {
    return `<div class="page"><div class="container"><h1>Contact Us</h1><p>Contact form coming soon...</p></div></div>`;
};

app.renderUserDashboard = function() {
    return `<div class="page"><div class="container"><h1>User Dashboard</h1><p>Dashboard coming soon...</p></div></div>`;
};

app.renderAdminPanel = function() {
    return `<div class="page"><div class="container"><h1>Admin Panel</h1><p>Admin features coming soon...</p></div></div>`;
};

app.renderMyBookingsPage = function() {
    return `<div class="page"><div class="container"><h1>My Bookings</h1><p>Bookings management coming soon...</p></div></div>`;
};

app.renderPaymentPage = function() {
    return `<div class="page"><div class="container"><h1>Payment</h1><p>Payment system coming soon...</p></div></div>`;
};

app.renderBookingConfirmationPage = function() {
    return `<div class="page"><div class="container"><h1>Booking Confirmation</h1><p>Confirmation page coming soon...</p></div></div>`;
};

app.renderBlogPostPage = function() {
    const post = this.state.blogPosts.find(p => p.id === this.state.currentBlogPostId);
    if (!post) return `<p class="text-center text-xl text-slate-500">Blog post not found.</p>`;
    
    return `
        <div class="page max-w-4xl mx-auto">
            <img src="${post.image}" alt="${post.title}" class="w-full h-96 object-cover rounded-2xl shadow-lg mb-8">
            <h1 class="text-5xl font-extrabold text-slate-800 mb-4">${post.title}</h1>
            <div class="flex items-center gap-4 text-slate-600 mb-8 pb-8 border-b-2">
                <span class="font-semibold">By ${post.author}</span>
                <span>•</span>
                <span>${post.date}</span>
            </div>
            <div class="prose max-w-none text-lg leading-relaxed text-slate-700 mb-8">
                ${post.content}
            </div>
            <div class="flex flex-wrap gap-2 mb-12">
                ${post.tags.map(tag => `<span class="bg-orange-100 text-orange-700 px-4 py-2 rounded-full font-semibold">${tag}</span>`).join('')}
            </div>
            <button onclick="app.navigateTo('blog')" class="text-orange-500 hover:text-orange-600 font-bold text-lg">
                <i class="fas fa-arrow-left"></i> Back to Blog
            </button>
        </div>
    `;
};

// Placeholder functions for admin features
app.accessAdminPanel = function() {
    this.showNotification('Admin panel access coming soon!', 'info');
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    app.init();
});
app.renderFooter = function() {
    const footerEl = document.getElementById('main-footer');
    if (!footerEl) return;
    footerEl.innerHTML = `
        <div class="container mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
                <!-- About Section -->
                <div class="md:col-span-1">
                    <h3 class="text-xl font-bold text-white mb-4">About Tourist Guide</h3>
                    <p class="text-slate-400 text-sm">${this.state.footerAboutText}</p>
                </div>

                <!-- Quick Links -->
                <div>
                    <h3 class="text-xl font-bold text-white mb-4">Quick Links</h3>
                    <ul class="space-y-2">
                        <li><a href="#home" onclick="app.navigateTo('home'); return false;" class="hover:text-orange-400 transition"><i class="fas fa-home"></i> Home</a></li>
                        <li><a href="#destinations" onclick="app.navigateTo('destinations'); return false;" class="hover:text-orange-400 transition"><i class="fas fa-map-marked-alt"></i> Destinations</a></li>
                        <li><a href="#guides" onclick="app.navigateTo('guides'); return false;" class="hover:text-orange-400 transition"><i class="fas fa-user-tie"></i> Guides</a></li>
                        <li><a href="#blog" onclick="app.navigateTo('blog'); return false;" class="hover:text-orange-400 transition"><i class="fas fa-blog"></i> Blog</a></li>
                        <li><a href="#contact" onclick="app.navigateTo('contact'); return false;" class="hover:text-orange-400 transition"><i class="fas fa-envelope"></i> Contact</a></li>
                    </ul>
                </div>

                <!-- Contact Information -->
                <div>
                    <h3 class="text-xl font-bold text-white mb-4">Contact Us</h3>
                    <ul class="space-y-3 text-sm">
                        <li><span class="text-orange-400"><i class="fas fa-phone"></i> Phone:</span><br><a href="tel:${this.state.contactPhone}" class="text-slate-400 hover:text-orange-400 transition">${this.state.contactPhone}</a></li>
                        <li><span class="text-orange-400"><i class="fas fa-envelope"></i> Email:</span><br><a href="mailto:${this.state.contactEmail}" class="text-slate-400 hover:text-orange-400 transition">${this.state.contactEmail}</a></li>
                        <li><span class="text-orange-400"><i class="fas fa-clock"></i> Hours:</span><br><span class="text-slate-400">${this.state.contactHours}</span></li>
                    </ul>
                </div>

                <!-- Social Media & Support -->
                <div>
                    <h3 class="text-xl font-bold text-white mb-4">Connect & Support</h3>
                    <div class="space-y-3">
                        <div class="flex gap-3">
                            ${this.state.facebookUrl ? `<a href="${this.state.facebookUrl}" target="_blank" class="text-slate-400 hover:text-orange-400 transition text-2xl"><i class="fab fa-facebook"></i></a>` : ''}
                            ${this.state.instagramUrl ? `<a href="${this.state.instagramUrl}" target="_blank" class="text-slate-400 hover:text-orange-400 transition text-2xl"><i class="fab fa-instagram"></i></a>` : ''}
                            ${this.state.twitterUrl ? `<a href="${this.state.twitterUrl}" target="_blank" class="text-slate-400 hover:text-orange-400 transition text-2xl"><i class="fab fa-twitter"></i></a>` : ''}
                            ${this.state.linkedinUrl ? `<a href="${this.state.linkedinUrl}" target="_blank" class="text-slate-400 hover:text-orange-400 transition text-2xl"><i class="fab fa-linkedin"></i></a>` : ''}
                        </div>
                        <div class="pt-2">
                            <p class="text-sm text-slate-400">Support:<br>
                            <a href="mailto:${this.state.supportEmail}" class="text-orange-400 hover:text-orange-300 transition">${this.state.supportEmail}</a></p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer Bottom -->
            <div class="mt-8 border-t border-slate-700 pt-8">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div class="text-slate-400 text-sm">
                        <p class="font-semibold text-white mb-2"><i class="fas fa-map-marker-alt"></i> Address</p>
                        <p>${(this.state.contactAddress || '').replace(/\n/g, '<br>')}</p>
                    </div>
                    <div class="text-slate-400 text-sm">
                        <p class="font-semibold text-white mb-2"><i class="fas fa-globe"></i> Serving</p>
                        <p>India's Premier Tourism & Guide Platform</p>
                    </div>
                </div>
                <div class="text-center text-slate-500 border-t border-slate-700 pt-4">
                    <p>&copy; ${new Date().getFullYear()} Tourist Guide. All Rights Reserved. | <a href="#" class="hover:text-orange-400 transition">Privacy Policy</a> | <a href="#" class="hover:text-orange-400 transition">Terms & Conditions</a></p>
                </div>
            </div>
        </div>
    `;
};