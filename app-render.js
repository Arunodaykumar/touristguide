// Render Functions and Page Components
app.render = function() {
    try {
        const mainContent = this.getDOMElement('main-content');
        if (!mainContent) {
            console.error('main-content element not found');
            return;
        }
        
        const topBarTitleEl = this.getDOMElement('top-bar-title');
        if (topBarTitleEl) topBarTitleEl.textContent = this.state.topBarTitle;
        
        const logoEl = this.getDOMElement('app-logo');
        if (logoEl && this.state.appLogo) {
            logoEl.src = this.state.appLogo;
        }
        
        if (!this.state.currentPage) {
            this.state.currentPage = 'home';
        }
        
        mainContent.innerHTML = '';
        window.scrollTo(0, 0);

        let pageContent = '';
        try {
            switch(this.state.currentPage) {
                case 'home': pageContent = this.renderHomePage(); break;
                case 'destinations': pageContent = this.renderDestinationsPage(); break;
                case 'destination-detail': pageContent = this.renderDestinationDetailPage(); break;
                case 'guides': pageContent = this.renderGuidesPage(); break;
                case 'blog': pageContent = this.renderBlogPage(); break;
                case 'blog-post': pageContent = this.renderBlogPostPage(); break;
                case 'gallery': pageContent = this.renderGalleryPage(); break;
                case 'ai-planner': pageContent = this.renderAIPlannerPage(); break;
                case 'auth-hub': pageContent = this.renderAuthHub(); break;
                case 'feedback': pageContent = this.renderFeedbackPage(); break;
                case 'contact': pageContent = this.renderContactPage(); break;
                case 'user-dashboard': pageContent = this.renderUserDashboard(); break;
                case 'admin': pageContent = this.renderAdminPanel(); break;
                case 'my-bookings': pageContent = this.renderMyBookingsPage(); break;
                case 'payment': pageContent = this.renderPaymentPage(); break;
                case 'booking-confirmation': pageContent = this.renderBookingConfirmationPage(); break;
                default: pageContent = this.renderHomePage(); break;
            }
        } catch (error) {
            console.error('Error rendering page', this.state.currentPage, ':', error);
            pageContent = this.renderHomePage();
        }
        
        if (!pageContent) {
            pageContent = this.renderHomePage();
        }
        
        mainContent.innerHTML = pageContent;
        this.clearDOMCache();
        this.postRenderSetup();
        this.setupScrollAnimations();
    } catch (error) {
        console.error('Fatal render error:', error);
    }
};

app.renderHomePage = function() {
    return `
        <div class="page">
            <!-- Hero Section -->
            <section class="hero">
                <div class="hero-background">
                    <div class="hero-overlay"></div>
                </div>
                <div class="hero-content">
                    <h1 class="hero-title">Explore India, Authentically</h1>
                    <p class="hero-subtitle">Connect with certified local guides and uncover the true essence of India</p>
                    <div class="hero-buttons">
                        <button onclick="app.navigateTo('destinations')" class="btn-primary">
                            <i class="fas fa-compass"></i> Discover Now
                        </button>
                        <button onclick="app.navigateTo('ai-planner')" class="btn-secondary">
                            <i class="fas fa-robot"></i> AI Planner
                        </button>
                    </div>
                </div>
                <div class="scroll-indicator">
                    <i class="fas fa-chevron-down"></i>
                </div>
            </section>

            <!-- Search Section -->
            <section class="search-section">
                <div class="container">
                    <div class="search-box">
                        <input id="destination-search" type="text" placeholder="Search destinations, guides, expertise...">
                        <select id="category-filter">
                            <option value="">All Categories</option>
                            <option value="spiritual">Spiritual</option>
                            <option value="historical">Historical</option>
                            <option value="nature">Nature</option>
                            <option value="adventure">Adventure</option>
                        </select>
                        <button id="hero-search-button" class="search-btn">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                </div>
            </section>

            <!-- Featured Destinations -->
            <section class="destinations fade-in-section">
                <div class="container">
                    <div class="section-header">
                        <h2>Popular Destinations</h2>
                        <p>Journey to India's most iconic and beloved locations</p>
                    </div>
                    <div class="destination-grid">
                        ${this.state.destinations.slice(0, 6).map(dest => this.renderDestinationCard(dest)).join('')}
                    </div>
                    <div class="text-center mt-12">
                        <button onclick="app.navigateTo('destinations')" class="btn-outline">
                            View All Destinations
                        </button>
                    </div>
                </div>
            </section>

            <!-- Why Choose Us -->
            <section class="guides fade-in-section">
                <div class="container">
                    <div class="section-header">
                        <h2>Why Travel With Us?</h2>
                        <p>We offer more than just tours; we provide experiences that last a lifetime</p>
                    </div>
                    <div class="guide-cards">
                        ${this.state.whyUsPoints.map(point => `
                            <div class="guide-card">
                                <div class="guide-icon">
                                    <i class="fas fa-${point.icon === 'compass' ? 'compass' : point.icon === 'shield-check' ? 'shield-alt' : 'lock'}"></i>
                                </div>
                                <h3>${point.title}</h3>
                                <p>${point.description}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>

            <!-- Featured Guides -->
            <section class="guides fade-in-section">
                <div class="container">
                    <div class="section-header">
                        <h2>Meet Our Expert Guides</h2>
                        <p>Connect with passionate locals who know their destinations inside out</p>
                    </div>
                    <div class="guide-cards">
                        ${this.state.guides.slice(0, 3).map(guide => this.renderGuideCard(guide)).join('')}
                    </div>
                    <div class="text-center mt-12">
                        <button onclick="app.navigateTo('guides')" class="btn-outline">
                            View All Guides
                        </button>
                    </div>
                </div>
            </section>

            <!-- Newsletter -->
            <section class="newsletter fade-in-section">
                <div class="container">
                    <div class="newsletter-content">
                        <h2>Stay Updated</h2>
                        <p>Get the latest travel tips and destination updates</p>
                        <div class="newsletter-form">
                            <input type="email" placeholder="Enter your email">
                            <button type="submit">Subscribe</button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    `;
};

app.renderDestinationsPage = function() {
    return `
        <div class="page">
            <div class="container">
                <div class="section-header">
                    <h1>Explore Destinations</h1>
                    <p>From snow-capped mountains to sun-drenched beaches, your next adventure awaits</p>
                </div>
                
                <!-- Search and Filter -->
                <div class="search-section">
                    <div class="search-box">
                        <input id="destination-search" type="text" placeholder="Search destinations...">
                        <select id="category-filter">
                            <option value="">All Categories</option>
                            <option value="spiritual">Spiritual</option>
                            <option value="historical">Historical</option>
                            <option value="nature">Nature</option>
                            <option value="adventure">Adventure</option>
                        </select>
                        <button class="search-btn">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                </div>

                <!-- Destinations Grid -->
                <div class="destination-grid">
                    ${this.state.destinations.map(dest => this.renderDestinationCard(dest)).join('')}
                </div>
            </div>
        </div>
    `;
};

app.renderDestinationCard = function(destination) {
    const isFavorite = (JSON.parse(localStorage.getItem('favorites') || '[]')).some(f => f.id === destination.id && f.type === 'destination');
    const cardImage = destination.image || destination.imageUrl || destination.frontImage || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400';
    return `
        <div class="destination-card cursor-pointer group relative" onclick="app.navigateTo('destination-detail', ${destination.id})">
            <img src="${cardImage}" alt="${destination.name}" class="w-full h-48 object-cover group-hover:brightness-90 transition bg-slate-200" onerror="this.src='https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400'; this.style.backgroundColor='#e2e8f0'">
            <button class="absolute top-2 right-2 z-10 ${isFavorite ? 'text-red-500' : 'text-white'} text-xl hover:scale-125 transition" onclick="event.stopPropagation(); app.toggleFavorite('destination', ${destination.id}, '${destination.name}')">
                <i class="fas fa-heart"></i>
            </button>
            <div class="p-5">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-xl font-bold text-slate-800">${destination.name}</h3>
                    <div class="flex items-center bg-green-100 text-green-800 font-bold text-sm px-2 py-1 rounded">
                        <i class="fas fa-star mr-1"></i>
                        <span>${destination.rating}</span>
                    </div>
                </div>
                <p class="text-slate-500 mb-2 text-sm">
                    <i class="fas fa-map-marker-alt"></i> ${destination.state} | 
                    <i class="fas fa-clock"></i> ${destination.best_time || 'Year-round'}
                </p>
                <p class="text-sm text-slate-600">${destination.short_desc}</p>
            </div>
        </div>
    `;
};

app.renderGuideCard = function(guide) {
    const isFavorite = (JSON.parse(localStorage.getItem('favorites') || '[]')).some(f => f.id === guide.id && f.type === 'guide');
    return `
        <div class="guide-card p-6 border border-slate-200 group relative">
            <button class="absolute top-2 right-2 z-10 ${isFavorite ? 'text-red-500' : 'text-slate-300'} text-xl hover:scale-125 transition" onclick="app.toggleFavorite('guide', ${guide.id}, '${guide.name}')">
                <i class="fas fa-heart"></i>
            </button>
            <div class="flex items-center mb-4">
                <div class="relative">
                    <img src="${guide.photo}" alt="${guide.name}" class="w-20 h-20 rounded-full object-cover mr-5 border-2 border-orange-300">
                    <span class="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs text-white font-bold">
                        <i class="fas fa-check"></i>
                    </span>
                </div>
                <div>
                    <h3 class="text-xl font-bold text-slate-800">${guide.name}</h3>
                    <p class="text-orange-500 font-semibold">
                        <i class="fas fa-map-marker-alt"></i> ${guide.location}
                    </p>
                    <div class="flex items-center gap-2 mt-1">
                        <span class="text-yellow-500">
                            <i class="fas fa-star"></i> ${guide.rating}
                        </span>
                        <span class="text-xs text-slate-500">(${guide.reviews?.length || 0} reviews)</span>
                    </div>
                </div>
            </div>
            <p class="text-slate-600 mb-4 text-sm italic">"${guide.bio}"</p>
            <div class="mb-3">
                <p class="text-xs font-semibold text-slate-700 mb-1">Experience: ${guide.experience_years} years</p>
                <p class="text-xs font-semibold text-slate-700 mb-2">Rate: <span class="text-green-600 font-bold">₹${guide.hourly_rate_inr}/hr</span></p>
            </div>
            <div class="flex flex-wrap gap-2 text-xs mb-3">
                <span class="font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    <i class="fas fa-briefcase"></i> ${guide.expertise}
                </span>
                ${guide.languages.map(lang => `<span class="bg-slate-200 text-slate-700 px-2 py-1 rounded-full"><i class="fas fa-language"></i> ${lang}</span>`).join('')}
            </div>
            <button onclick="app.bookGuide(${guide.id}, '${guide.name}', ${guide.hourly_rate_inr})" class="w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition">
                Book Now
            </button>
        </div>
    `;
};
