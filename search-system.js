// Advanced Search and Filter System
class SearchSystem {
    constructor() {
        this.filters = {
            priceRange: [0, 10000],
            rating: 0,
            category: '',
            location: '',
            duration: ''
        };
        this.sortBy = 'relevance';
    }

    initializeAdvancedSearch() {
        const searchContainer = document.querySelector('.search-section');
        if (!searchContainer) return;

        const advancedToggle = document.createElement('button');
        advancedToggle.className = 'advanced-search-toggle';
        advancedToggle.innerHTML = '<i class="fas fa-sliders-h"></i> Advanced Filters';
        advancedToggle.onclick = () => this.toggleAdvancedFilters();
        
        searchContainer.appendChild(advancedToggle);
        
        const advancedFilters = document.createElement('div');
        advancedFilters.className = 'advanced-filters hidden';
        advancedFilters.innerHTML = this.renderAdvancedFilters();
        
        searchContainer.appendChild(advancedFilters);
    }

    renderAdvancedFilters() {
        return `
            <div class="filter-grid">
                <div class="filter-group">
                    <label>Price Range (₹)</label>
                    <div class="price-range">
                        <input type="range" id="price-min" min="0" max="10000" value="0" oninput="searchSystem.updatePriceRange()">
                        <input type="range" id="price-max" min="0" max="10000" value="10000" oninput="searchSystem.updatePriceRange()">
                        <div class="price-display">
                            <span id="price-display">₹0 - ₹10,000</span>
                        </div>
                    </div>
                </div>
                
                <div class="filter-group">
                    <label>Minimum Rating</label>
                    <select id="rating-filter" onchange="searchSystem.updateFilters()">
                        <option value="0">Any Rating</option>
                        <option value="3">3+ Stars</option>
                        <option value="4">4+ Stars</option>
                        <option value="4.5">4.5+ Stars</option>
                    </select>
                </div>
                
                <div class="filter-group">
                    <label>Duration</label>
                    <select id="duration-filter" onchange="searchSystem.updateFilters()">
                        <option value="">Any Duration</option>
                        <option value="half-day">Half Day (4 hours)</option>
                        <option value="full-day">Full Day (8 hours)</option>
                        <option value="multi-day">Multi Day</option>
                    </select>
                </div>
                
                <div class="filter-group">
                    <label>Sort By</label>
                    <select id="sort-filter" onchange="searchSystem.updateSort()">
                        <option value="relevance">Relevance</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="rating">Highest Rated</option>
                        <option value="newest">Newest First</option>
                    </select>
                </div>
            </div>
            
            <div class="filter-actions">
                <button onclick="searchSystem.applyFilters()" class="btn-apply-filters">Apply Filters</button>
                <button onclick="searchSystem.clearFilters()" class="btn-clear-filters">Clear All</button>
            </div>
        `;
    }

    toggleAdvancedFilters() {
        const filters = document.querySelector('.advanced-filters');
        if (filters) {
            filters.classList.toggle('hidden');
        }
    }

    updatePriceRange() {
        const minInput = document.getElementById('price-min');
        const maxInput = document.getElementById('price-max');
        const display = document.getElementById('price-display');
        
        if (minInput && maxInput && display) {
            const min = parseInt(minInput.value);
            const max = parseInt(maxInput.value);
            
            if (min > max) {
                minInput.value = max;
            }
            
            this.filters.priceRange = [min, max];
            display.textContent = `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`;
        }
    }

    updateFilters() {
        const ratingFilter = document.getElementById('rating-filter');
        const durationFilter = document.getElementById('duration-filter');
        
        if (ratingFilter) this.filters.rating = parseFloat(ratingFilter.value);
        if (durationFilter) this.filters.duration = durationFilter.value;
    }

    updateSort() {
        const sortFilter = document.getElementById('sort-filter');
        if (sortFilter) {
            this.sortBy = sortFilter.value;
        }
    }

    applyFilters() {
        this.updateFilters();
        
        // Get current items (destinations or guides)
        let items = [];
        const currentPage = window.location.pathname;
        
        if (currentPage.includes('destinations')) {
            items = allDestinations || [];
        } else if (currentPage.includes('guides')) {
            items = this.getAllGuides();
        }
        
        // Apply filters
        let filteredItems = this.filterItems(items);
        
        // Apply sorting
        filteredItems = this.sortItems(filteredItems);
        
        // Display results
        this.displayFilteredResults(filteredItems);
        
        showNotification(`Found ${filteredItems.length} results`, 'info');
    }

    filterItems(items) {
        return items.filter(item => {
            // Price filter
            const price = item.price || item.rate || 0;
            if (price < this.filters.priceRange[0] || price > this.filters.priceRange[1]) {
                return false;
            }
            
            // Rating filter
            if (this.filters.rating > 0 && (item.rating || 0) < this.filters.rating) {
                return false;
            }
            
            // Category filter (for destinations)
            if (this.filters.category && item.category !== this.filters.category) {
                return false;
            }
            
            // Location filter
            if (this.filters.location && !item.location?.toLowerCase().includes(this.filters.location.toLowerCase())) {
                return false;
            }
            
            return true;
        });
    }

    sortItems(items) {
        switch (this.sortBy) {
            case 'price-low':
                return items.sort((a, b) => (a.price || a.rate || 0) - (b.price || b.rate || 0));
            case 'price-high':
                return items.sort((a, b) => (b.price || b.rate || 0) - (a.price || a.rate || 0));
            case 'rating':
                return items.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            case 'newest':
                return items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            default:
                return items;
        }
    }

    displayFilteredResults(items) {
        const currentPage = window.location.pathname;
        
        if (currentPage.includes('destinations')) {
            displayDestinations(items);
        } else if (currentPage.includes('guides')) {
            this.displayGuides(items);
        }
    }

    clearFilters() {
        this.filters = {
            priceRange: [0, 10000],
            rating: 0,
            category: '',
            location: '',
            duration: ''
        };
        this.sortBy = 'relevance';
        
        // Reset form elements
        const elements = [
            'price-min', 'price-max', 'rating-filter', 
            'duration-filter', 'sort-filter'
        ];
        
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (element.type === 'range') {
                    element.value = id === 'price-max' ? '10000' : '0';
                } else {
                    element.selectedIndex = 0;
                }
            }
        });
        
        this.updatePriceRange();
        this.applyFilters();
    }

    getAllGuides() {
        // This would typically come from an API
        return [
            {
                id: 1,
                name: "Ramesh Kumar",
                location: "Varanasi",
                expertise: "Spiritual Tours",
                rating: 4.9,
                rate: 800,
                experience: 15
            },
            {
                id: 2,
                name: "Priya Singh",
                location: "Jaipur",
                expertise: "Historical Tours",
                rating: 4.8,
                rate: 900,
                experience: 8
            }
        ];
    }

    displayGuides(guides) {
        const container = document.getElementById('guides-list');
        if (container && typeof createGuideCard === 'function') {
            container.innerHTML = guides.map(guide => createGuideCard(guide)).join('');
        }
    }
}

// Initialize search system
const searchSystem = new SearchSystem();

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    searchSystem.initializeAdvancedSearch();
});