let currentPage = 1;
let currentFilter = 'all';
let allDestinations = [];

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    try {
        initializeApp();
        setupSearchAndNewsletter();
    } catch (error) {
        console.error('App initialization failed:', error);
    }
});

// Setup search and newsletter functionality
function setupSearchAndNewsletter() {
    try {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    searchDestinations();
                }
            });
        }
        
        // Newsletter form submission
        const newsletterForm = document.querySelector('.newsletter-form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', function(e) {
                e.preventDefault();
                subscribeNewsletter();
            });
        }
    } catch (error) {
        console.error('Search and newsletter setup failed:', error);
    }
}

// Initialize app with optimized performance
function initializeApp() {
    try {
        // Use CSS transition for loading screen
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            loadingScreen.style.transition = 'opacity 0.5s ease-out';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }

        // Initialize components with individual error handling
        try { setupNavigation(); } catch (e) { console.error('Navigation setup failed:', e); }
        try { setupScrollEffects(); } catch (e) { console.error('Scroll effects setup failed:', e); }
        try { setupGallery(); } catch (e) { console.error('Gallery setup failed:', e); }
        try { setupFilters(); } catch (e) { console.error('Filters setup failed:', e); }
        try { loadDestinations(); } catch (e) { console.error('Destinations loading failed:', e); }
    } catch (error) {
        console.error('App initialization failed:', error);
    }
}

// Navigation functionality
function setupNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            try {
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    // Close mobile menu if open
                    if (navMenu) navMenu.classList.remove('active');
                }
            } catch (error) {
                console.warn('Invalid selector in href:', this.getAttribute('href'));
            }
        });
    });
}

// Scroll effects with optimized performance
function setupScrollEffects() {
    const SCROLL_THRESHOLDS = {
        BACK_TO_TOP: 300,
        NAVBAR: 100
    };
    
    const elements = {
        backToTop: document.getElementById('back-to-top'),
        navbar: document.querySelector('.navbar')
    };
    
    let ticking = false;
    
    const updateScrollElements = () => {
        try {
            const scrollY = window.scrollY;
            
            if (elements.backToTop) {
                elements.backToTop.classList.toggle('show', scrollY > SCROLL_THRESHOLDS.BACK_TO_TOP);
            }
            
            if (elements.navbar) {
                elements.navbar.classList.toggle('navbar-scrolled', scrollY > SCROLL_THRESHOLDS.NAVBAR);
            }
        } catch (error) {
            console.error('Scroll update failed:', error);
        } finally {
            ticking = false;
        }
    };
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateScrollElements);
            ticking = true;
        }
    });
    
    if (elements.backToTop) {
        elements.backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

// Gallery functionality with enhanced accessibility
function setupGallery() {
    try {
        const elements = {
            galleryItems: document.querySelectorAll('.gallery-item'),
            modal: document.getElementById('gallery-modal'),
            modalImg: document.getElementById('modal-image'),
            closeBtn: document.querySelector('.close')
        };
        
        let modalKeydownHandler;
        
        const modalActions = {
            close() {
                if (elements.modal) {
                    elements.modal.style.display = 'none';
                    elements.modal.setAttribute('aria-hidden', 'true');
                    document.body.style.overflow = 'auto';
                    if (modalKeydownHandler) {
                        document.removeEventListener('keydown', modalKeydownHandler);
                    }
                }
            },
            
            open(imgSrc, imgAlt) {
                if (elements.modal && elements.modalImg) {
                    elements.modal.style.display = 'block';
                    elements.modal.setAttribute('aria-hidden', 'false');
                    elements.modalImg.src = imgSrc;
                    elements.modalImg.alt = (imgAlt || 'Gallery image').replace(/[<>"'&]/g, '');
                    document.body.style.overflow = 'hidden';
                    elements.modalImg.focus();
                    
                    modalKeydownHandler = (e) => {
                        if (e.key === 'Escape') {
                            modalActions.close();
                        } else if (e.key === 'Tab') {
                            const focusableElements = elements.modal.querySelectorAll(
                                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                            );
                            
                            if (focusableElements.length === 0) return;
                            
                            const firstElement = focusableElements[0];
                            const lastElement = focusableElements[focusableElements.length - 1];
                            
                            if (e.shiftKey && document.activeElement === firstElement) {
                                e.preventDefault();
                                lastElement.focus();
                            } else if (!e.shiftKey && document.activeElement === lastElement) {
                                e.preventDefault();
                                firstElement.focus();
                            }
                        }
                    };
                    
                    document.addEventListener('keydown', modalKeydownHandler);
                }
            }
        };
        
        elements.galleryItems.forEach(item => {
            item.addEventListener('click', () => {
                const img = item.querySelector('img');
                if (img) modalActions.open(img.src, img.alt || 'Gallery image');
            });
            
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const img = item.querySelector('img');
                    if (img) modalActions.open(img.src, img.alt || 'Gallery image');
                }
            });
        });
        
        if (elements.closeBtn) {
            elements.closeBtn.addEventListener('click', modalActions.close);
        }
        
        if (elements.modal) {
            elements.modal.addEventListener('click', (e) => {
                if (e.target === elements.modal) modalActions.close();
            });
        }
    } catch (error) {
        console.error('Gallery setup failed:', error);
    }
}

// Filter functionality
function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            
            const filter = btn.getAttribute('data-filter') || 'all';
            currentFilter = filter;
            filterDestinations(filter);
        });
    });
}

// Load destinations from API with immediate fallback
async function loadDestinations() {
    // Skip if we're on home page and destinations are already loaded
    const isHomePage = window.location.pathname.endsWith('/') || window.location.pathname.endsWith('/index.html');
    const container = document.getElementById('destination-list');
    
    if (isHomePage && container && container.innerHTML.trim() !== '' && !container.innerHTML.includes('Loading destinations')) {
        console.log('Destinations already loaded on home page, skipping...');
        return;
    }
    
    // Initialize from localStorage first
    const savedDestinations = localStorage.getItem('destinations');
    if (savedDestinations) {
        try {
            const parsed = JSON.parse(savedDestinations);
            allDestinations = [...FALLBACK_DESTINATIONS, ...parsed];
        } catch (error) {
            allDestinations = FALLBACK_DESTINATIONS;
        }
    } else {
        allDestinations = FALLBACK_DESTINATIONS;
    }
    
    // Only show data if container is empty or on non-home pages
    if (!isHomePage || !container || container.innerHTML.trim() === '' || container.innerHTML.includes('Loading destinations')) {
        displayDestinations(allDestinations);
    }
    
    try {
        // Use api client instead of direct fetch
        const destinations = await api.getDestinations();
        if (destinations && destinations.length > 0) {
            const localDestinations = JSON.parse(localStorage.getItem('destinations') || '[]');
            allDestinations = [...destinations, ...localDestinations];
            if (!isHomePage || !container || container.innerHTML.trim() === '' || container.innerHTML.includes('Loading destinations')) {
                displayDestinations(allDestinations);
            }
        }
    } catch (error) {
        console.log('Using local destinations data');
    }
}

// Display destinations
function displayDestinations(destinations) {
    const container = document.getElementById('destination-list');
    if (!container) {
        console.error('Destination list container not found');
        return;
    }
    
    // Skip if we're on home page and destinations are already loaded
    const isHomePage = window.location.pathname.endsWith('/') || window.location.pathname.endsWith('/index.html');
    if (isHomePage && container.innerHTML.trim() !== '' && !container.innerHTML.includes('Loading destinations') && !container.innerHTML.includes('No destinations')) {
        console.log('Home page destinations already loaded, skipping display...');
        return;
    }
    
    container.innerHTML = '';
    
    if (destinations.length === 0) {
        const noResults = document.createElement('p');
        noResults.className = 'no-results';
        noResults.textContent = 'No destinations found.';
        container.appendChild(noResults);
        return;
    }
    
    // Limit to 3 destinations for home page
    const displayDestinations = isHomePage ? destinations.slice(0, 3) : destinations;
    
    displayDestinations.forEach((destination, index) => {
        const card = createDestinationCard(destination);
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('fade-in');
        container.appendChild(card);
    });
}

// Create destination card with safe DOM manipulation
function createDestinationCard(destination) {
    return createCardElement(destination);
}

function createCardElement(destination) {
    const card = document.createElement('div');
    card.className = 'destination-card';
    card.setAttribute('data-category', destination.category || 'general');
    
    const img = createCardImage(destination);
    const content = createCardContent(destination);
    
    card.appendChild(img);
    card.appendChild(content);
    
    return card;
}

function getDestinationImage(destination) {
    const fallbackImage = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400';
    const image = (destination && (destination.imageUrl || destination.image || destination.frontImage)) || '';
    return typeof image === 'string' && image.trim() ? image : fallbackImage;
}

function createCardImage(destination) {
    const img = document.createElement('img');
    img.src = getDestinationImage(destination);
    img.alt = (destination.name || 'Destination').replace(/[<>"'&]/g, '');
    img.loading = 'lazy';
    return img;
}

function createCardContent(destination) {
    const content = document.createElement('div');
    content.className = 'destination-card-content';
    
    const title = document.createElement('h3');
    title.textContent = (destination.name || 'Unknown Destination').replace(/[<>"'&]/g, '');
    
    const desc = document.createElement('p');
    desc.textContent = (destination.description || 'No description available').replace(/[<>"'&]/g, '');
    
    const bestTime = document.createElement('p');
    const bestTimeStrong = document.createElement('strong');
    bestTimeStrong.textContent = 'Best Time to Visit: ';
    bestTime.appendChild(bestTimeStrong);
    bestTime.appendChild(document.createTextNode(destination.bestTime || 'Not specified'));
    
    const rating = createStarRating(destination.rating || 0);
    
    const actions = document.createElement('div');
    actions.className = 'destination-actions';
    actions.innerHTML = `
        <button class="btn-details" onclick="showDestinationDetails('${destination.name}')">View Details</button>
        <button class="btn-book" onclick="bookDestination('${destination.name}')">Book Now</button>
        <button class="btn-favorite" onclick="userManager.addToFavorites('${destination.id || destination.name}', 'destination')" title="Add to favorites">
            <i class="fas fa-heart"></i>
        </button>
        <button class="btn-review" onclick="reviewSystem.showReviewModal('${destination.id || destination.name}', 'destination', '${destination.name}')" title="Reviews">
            <i class="fas fa-star"></i> Reviews
        </button>
    `;
    
    content.appendChild(title);
    content.appendChild(desc);
    content.appendChild(bestTime);
    content.appendChild(rating);
    content.appendChild(actions);
    
    return content;
}

function createStarRating(ratingValue) {
    const rating = document.createElement('p');
    const ratingStrong = document.createElement('strong');
    ratingStrong.textContent = 'Rating: ';
    rating.appendChild(ratingStrong);
    rating.appendChild(document.createTextNode(`${ratingValue}/5`));
    
    const starsContainer = document.createElement('span');
    starsContainer.className = 'rating-stars';
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        starsHTML += `<i class="${i <= ratingValue ? 'fas fa-star' : 'far fa-star'}"></i>`;
    }
    starsContainer.innerHTML = starsHTML;
    rating.appendChild(starsContainer);
    
    return rating;
}

// HTML escape function with comprehensive error handling
function escapeHtml(text) {
    try {
        if (text == null) {
            return '';
        }
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    } catch (error) {
        console.warn('HTML escape failed:', error);
        return '';
    }
}

// Filter destinations
function filterDestinations(filter) {
    let filteredDestinations = allDestinations;
    
    if (filter !== 'all') {
        filteredDestinations = allDestinations.filter(dest => 
            (dest.category || 'general').toLowerCase() === filter.toLowerCase()
        );
    }
    
    displayDestinations(filteredDestinations);
}

// Search destinations with comprehensive error handling
function searchDestinations() {
    try {
        const searchInput = document.getElementById('search-input');
        const categoryFilter = document.getElementById('category-filter');
        
        if (!searchInput) {
            console.warn('Search input element not found');
            return;
        }
        
        const searchTerm = searchInput.value.toLowerCase().trim();
        const category = categoryFilter ? categoryFilter.value : '';
        
        let filteredDestinations = allDestinations;
        
        // Filter by search term with safe string operations
        if (searchTerm) {
            filteredDestinations = filteredDestinations.filter(dest => {
                const name = (dest.name || '').toLowerCase();
                const description = (dest.description || '').toLowerCase();
                const country = (dest.country || '').toLowerCase();
                
                return name.includes(searchTerm) || 
                       description.includes(searchTerm) || 
                       country.includes(searchTerm);
            });
        }
        
        // Filter by category
        if (category) {
            filteredDestinations = filteredDestinations.filter(dest => 
                (dest.category || 'general').toLowerCase() === category.toLowerCase()
            );
        }
        
        displayDestinations(filteredDestinations);
    } catch (error) {
        console.error('Search failed:', error);
        showNotification('Search failed. Please try again.', 'error');
    }
}

// Load more destinations with error handling
function loadMoreDestinations() {
    try {
        const pageSize = 6;
        const loadMoreBtn = document.getElementById('load-more-btn') || document.querySelector('.load-more button');
        
        if (!loadMoreBtn) {
            console.warn('Load more button not found');
            return;
        }
        
        // In a real app, fetch more data from API
        api.getDestinations({ page: currentPage + 1, limit: pageSize })
            .then(newDestinations => {
                if (newDestinations && newDestinations.length > 0) {
                    currentPage++; // Only increment on success
                    allDestinations = [...allDestinations, ...newDestinations];
                    displayDestinations(allDestinations);
                } else {
                    loadMoreBtn.textContent = 'No more destinations';
                    loadMoreBtn.disabled = true;
                }
            })
            .catch(error => {
                console.error('Load more failed:', error);
                loadMoreBtn.textContent = 'No more destinations';
                loadMoreBtn.disabled = true;
                showNotification('Failed to load more destinations', 'error');
            });
    } catch (error) {
        console.error('Load more destinations error:', error);
        showNotification('Error loading destinations', 'error');
    }
}

// Scroll to section helper
function scrollToSection(sectionId) {
    try {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    } catch (error) {
        console.error('Scroll to section failed:', error);
    }
}

// Newsletter subscription with modern UI feedback
function subscribeNewsletter() {
    try {
        const emailInput = document.querySelector('.newsletter-form input');
        if (!emailInput) {
            console.warn('Newsletter email input not found');
            return;
        }
        
        const email = emailInput.value.trim();
        if (!email) {
            showNotification('Please enter your email address', 'error');
            return;
        }
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }
        
        // In a real app, you would send this to your backend
        showNotification('Thank you for subscribing to our newsletter!', 'success');
        emailInput.value = '';
    } catch (error) {
        console.error('Newsletter subscription failed:', error);
        showNotification('Subscription failed. Please try again.', 'error');
    }
}

// Modern notification system with error handling
function showNotification(message, type = 'info') {
    try {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 1000;
            padding: 12px 20px; border-radius: 4px; color: white;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    } catch (error) {
        console.error('Notification failed:', error);
        // Fallback to console log
        console.log(`${type.toUpperCase()}: ${message}`);
    }
}

// Fallback destinations data
const FALLBACK_DESTINATIONS = [
    {
        name: "Taj Mahal",
        description: "Iconic white marble mausoleum and UNESCO World Heritage Site in Agra.",
        bestTime: "October to March",
        rating: 4.9,
        category: "cultural",
        imageUrl: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400"
    },
    {
        name: "Goa Beaches",
        description: "Beautiful beaches with Portuguese heritage and vibrant nightlife.",
        bestTime: "November to February",
        rating: 4.7,
        category: "beach",
        imageUrl: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400"
    },
    {
        name: "Kerala Backwaters",
        description: "Serene backwaters with houseboat cruises and lush greenery.",
        bestTime: "September to March",
        rating: 4.8,
        category: "nature",
        imageUrl: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400"
    },
    {
        name: "Rajasthan Palaces",
        description: "Magnificent palaces and forts showcasing royal heritage.",
        bestTime: "October to March",
        rating: 4.8,
        category: "cultural",
        imageUrl: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=400"
    },
    {
        name: "Himachal Pradesh",
        description: "Snow-capped mountains and scenic hill stations.",
        bestTime: "March to June, September to November",
        rating: 4.9,
        category: "mountain",
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400"
    },
    {
        name: "Golden Temple",
        description: "Sacred Sikh temple with golden architecture in Amritsar.",
        bestTime: "October to March",
        rating: 4.9,
        category: "cultural",
        imageUrl: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=400"
    },
    {
        name: "Varanasi Ghats",
        description: "Ancient spiritual city on the banks of River Ganges.",
        bestTime: "October to March",
        rating: 4.6,
        category: "cultural",
        imageUrl: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=400"
    },
    {
        name: "Mumbai City",
        description: "Bollywood capital and financial hub of India.",
        bestTime: "November to February",
        rating: 4.5,
        category: "city",
        imageUrl: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400"
    },
    {
        name: "Ladakh",
        description: "High altitude desert with Buddhist monasteries and stunning landscapes.",
        bestTime: "May to September",
        rating: 4.9,
        category: "mountain",
        imageUrl: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400"
    },
    {
        name: "Andaman Islands",
        description: "Pristine beaches with crystal clear waters and coral reefs.",
        bestTime: "October to May",
        rating: 4.8,
        category: "beach",
        imageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400"
    }
];

// Optimized fallback destinations data
function displayFallbackDestinations() {
    allDestinations = FALLBACK_DESTINATIONS;
    displayDestinations(FALLBACK_DESTINATIONS);
}

// Show destination details modal with XSS protection
function showDestinationDetails(destinationName) {
    try {
        const destination = allDestinations.find(d => d.name === destinationName);
        if (!destination) {
            showNotification('Destination not found', 'error');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        const closeBtn = document.createElement('span');
        closeBtn.className = 'close';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = () => closeModal(closeBtn);
        
        const title = document.createElement('h2');
        title.textContent = escapeHtml(destination.name);
        
        const img = document.createElement('img');
        img.src = getDestinationImage(destination);
        img.alt = escapeHtml(destination.name);
        img.style.cssText = 'width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin: 15px 0;';
        
        const desc = document.createElement('p');
        desc.innerHTML = '<strong>Description:</strong> ' + escapeHtml(destination.description);
        
        const bestTime = document.createElement('p');
        bestTime.innerHTML = '<strong>Best Time to Visit:</strong> ' + escapeHtml(destination.bestTime);
        
        const category = document.createElement('p');
        category.innerHTML = '<strong>Category:</strong> ' + escapeHtml(destination.category);
        
        const rating = document.createElement('p');
        rating.innerHTML = '<strong>Rating:</strong> ' + escapeHtml(destination.rating) + '/5 ⭐';
        
        const buttonDiv = document.createElement('div');
        buttonDiv.style.marginTop = '20px';
        
        const bookBtn = document.createElement('button');
        bookBtn.className = 'btn-book';
        bookBtn.textContent = 'Book Guide';
        bookBtn.onclick = () => {
            bookDestination(destination.name);
            closeModal(closeBtn);
        };
        
        buttonDiv.appendChild(bookBtn);
        modalContent.appendChild(closeBtn);
        modalContent.appendChild(title);
        modalContent.appendChild(img);
        modalContent.appendChild(desc);
        modalContent.appendChild(bestTime);
        modalContent.appendChild(category);
        modalContent.appendChild(rating);
        modalContent.appendChild(buttonDiv);
        modal.appendChild(modalContent);
        
        document.body.appendChild(modal);
    } catch (error) {
        console.error('Failed to show destination details:', error);
        showNotification('Failed to load destination details', 'error');
    }
}

// Book destination with XSS protection
function bookDestination(destinationName) {
    try {
        if (!userManager || !userManager.currentUser) {
            if (typeof userManager !== 'undefined' && userManager.showLogin) {
                userManager.showLogin();
            } else {
                showNotification('Please login to book a guide', 'error');
            }
            return;
        }
        localStorage.setItem('selectedDestinationForGuideBooking', destinationName || '');
        showNotification('Destination booking disabled. Please book a guide for this destination.', 'info');
        window.location.href = `guides.html?destination=${encodeURIComponent(destinationName || '')}`;
    } catch (error) {
        console.error('Failed to redirect to guide booking:', error);
        showNotification('Unable to open guide booking page', 'error');
    }
}

// Submit booking with comprehensive error handling
function submitBooking(event, destinationName) {
    event.preventDefault();
    
    try {
        if (!userManager || !userManager.currentUser) {
            if (typeof userManager !== 'undefined' && userManager.showLogin) {
                userManager.showLogin();
            } else {
                showNotification('Please login to complete booking', 'error');
            }
            return;
        }
        localStorage.setItem('selectedDestinationForGuideBooking', destinationName || '');
        showNotification('Destination booking disabled. Please book a guide.', 'info');
        closeModal(event.target);
        window.location.href = `guides.html?destination=${encodeURIComponent(destinationName || '')}`;
    } catch (error) {
        console.error('Booking submission failed:', error);
        showNotification('Booking failed. Please try again.', 'error');
    }
}

// Close modal with error handling
function closeModal(element) {
    try {
        const modal = element.closest('.modal-backdrop');
        if (modal) {
            modal.remove();
        }
    } catch (error) {
        console.error('Failed to close modal:', error);
    }
}
// Global utility functions for authentication with error handling
function togglePassword(inputId) {
    try {
        const input = document.getElementById(inputId);
        if (!input) {
            console.warn('Password input not found:', inputId);
            return;
        }
        
        const button = input.parentElement.querySelector('.toggle-password i');
        if (!button) {
            console.warn('Toggle button not found for input:', inputId);
            return;
        }
        
        if (input.type === 'password') {
            input.type = 'text';
            button.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            button.className = 'fas fa-eye';
        }
    } catch (error) {
        console.error('Password toggle failed:', error);
    }
}

function closeModal(element) {
    const modal = element.closest('.modal-backdrop');
    if (modal) {
        modal.remove();
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10001;
        padding: 12px 20px; border-radius: 8px; color: white; font-weight: 600;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}
