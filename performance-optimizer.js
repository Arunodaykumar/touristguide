// Performance Optimizer for Tourist Guide Website
class PerformanceOptimizer {
    constructor() {
        this.lastErrorNoticeAt = 0;
        this.init();
    }

    init() {
        this.optimizeImages();
        this.enableLazyLoading();
        this.optimizeLocalStorage();
        this.addErrorHandling();
        this.optimizeEventListeners();
        this.addProgressiveLoading();
    }

    // Optimize image loading
    optimizeImages() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }
            
            // Add error handling for broken images
            img.onerror = function() {
                this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
                this.alt = 'Image not available';
            };
        });
    }

    // Enable lazy loading for dynamic content
    enableLazyLoading() {
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            observer.unobserve(img);
                        }
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                observer.observe(img);
            });
        }
    }

    // Optimize localStorage usage
    optimizeLocalStorage() {
        try {
            // Clean up old data
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('temp_') || key.startsWith('cache_')) {
                    const item = JSON.parse(localStorage.getItem(key) || '{}');
                    if (item.timestamp && Date.now() - item.timestamp > 24 * 60 * 60 * 1000) {
                        localStorage.removeItem(key);
                    }
                }
            });

            // Compress large data
            this.compressStorageData();
        } catch (error) {
            console.warn('LocalStorage optimization failed:', error);
        }
    }

    compressStorageData() {
        const destinations = localStorage.getItem('destinations');
        if (destinations && destinations.length > 10000) {
            try {
                const data = JSON.parse(destinations);
                const compressed = this.compressJSON(data);
                localStorage.setItem('destinations_compressed', compressed);
            } catch (error) {
                console.warn('Data compression failed:', error);
            }
        }
    }

    compressJSON(data) {
        return JSON.stringify(data, (key, value) => {
            if (typeof value === 'string' && value.length > 100) {
                return value.substring(0, 100) + '...';
            }
            return value;
        });
    }

    // Add comprehensive error handling
    addErrorHandling() {
        window.addEventListener('error', (event) => {
            const errorObj = event?.error;
            const message = errorObj?.message || event?.message || '';
            if (!message || !this.shouldNotifyForError(message)) return;

            console.error('Global error:', errorObj || message);
            // Keep diagnostics only in console. Do not show blocking/noisy global popups.
        });

        window.addEventListener('unhandledrejection', (event) => {
            if (event.reason) {
                console.error('Unhandled promise rejection:', event.reason);
            }
            event.preventDefault();
        });
    }

    shouldNotifyForError(message) {
        const msg = String(message).toLowerCase();

        // Ignore common non-critical browser/extension/runtime noise
        const ignorablePatterns = [
            'script error',
            'resizeobserver loop limit exceeded',
            'non-error promise rejection captured',
            'networkerror when attempting to fetch resource',
            'the operation was aborted',
            'usermanager.updateui is not a function',
            'is not a function',
            'cannot read properties of null',
            'cannot set properties of null'
        ];
        if (ignorablePatterns.some(pattern => msg.includes(pattern))) {
            return false;
        }

        // Throttle error popup spam
        const now = Date.now();
        if (now - this.lastErrorNoticeAt < 15000) {
            return false;
        }
        this.lastErrorNoticeAt = now;
        return true;
    }

    showErrorNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 10001;
            padding: 12px 20px; border-radius: 8px; color: white;
            background: #ef4444; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    }

    // Optimize event listeners
    optimizeEventListeners() {
        // Debounce scroll events
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.handleScroll();
            }, 100);
        }, { passive: true });

        // Throttle resize events
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });
    }

    handleScroll() {
        // Implement scroll-based optimizations
        const scrollTop = window.pageYOffset;
        if (scrollTop > 100) {
            document.body.classList.add('scrolled');
        } else {
            document.body.classList.remove('scrolled');
        }
    }

    handleResize() {
        // Implement resize-based optimizations
        const width = window.innerWidth;
        if (width < 768) {
            document.body.classList.add('mobile');
        } else {
            document.body.classList.remove('mobile');
        }
    }

    // Add progressive loading
    addProgressiveLoading() {
        const loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'loading-indicator';
        loadingIndicator.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Loading...</p>
        `;
        loadingIndicator.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            z-index: 10000; background: white; padding: 20px; border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2); display: none;
            text-align: center; font-family: Arial, sans-serif;
        `;

        const style = document.createElement('style');
        style.textContent = `
            .loading-spinner {
                width: 40px; height: 40px; margin: 0 auto 10px;
                border: 4px solid #f3f3f3; border-top: 4px solid #3498db;
                border-radius: 50%; animation: spin 1s linear infinite;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(loadingIndicator);

        // Show loading for async operations
        window.showLoading = () => {
            loadingIndicator.style.display = 'block';
        };

        window.hideLoading = () => {
            loadingIndicator.style.display = 'none';
        };
    }

    // Memory management
    cleanupMemory() {
        // Remove unused event listeners
        const elements = document.querySelectorAll('[data-cleanup]');
        elements.forEach(el => {
            el.removeEventListener('click', el._clickHandler);
            el.removeEventListener('change', el._changeHandler);
        });

        // Clear intervals and timeouts
        if (window.destinationUpdateInterval) {
            clearInterval(window.destinationUpdateInterval);
        }
    }
}

// Security enhancements
class SecurityManager {
    constructor() {
        this.init();
    }

    init() {
        this.sanitizeInputs();
        this.preventXSS();
        this.validateData();
    }

    sanitizeInputs() {
        document.addEventListener('input', (event) => {
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                event.target.value = this.sanitizeString(event.target.value);
            }
        });
    }

    sanitizeString(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML.replace(/[<>]/g, '');
    }

    preventXSS() {
        // Override innerHTML to prevent XSS
        const originalInnerHTML = Element.prototype.innerHTML;
        Object.defineProperty(Element.prototype, 'innerHTML', {
            set: function(value) {
                if (typeof value === 'string') {
                    value = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
                }
                originalInnerHTML.call(this, value);
            },
            get: function() {
                return originalInnerHTML.call(this);
            }
        });
    }

    validateData() {
        window.validateEmail = (email) => {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        };

        window.validatePhone = (phone) => {
            return /^[\+]?[1-9][\d]{0,15}$/.test(phone);
        };

        window.validateDate = (date) => {
            const selectedDate = new Date(date);
            const today = new Date();
            return selectedDate >= today;
        };
    }
}

// Initialize optimizations when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PerformanceOptimizer();
    new SecurityManager();
    
    // Add CSS optimizations
    const style = document.createElement('style');
    style.textContent = `
        /* Performance optimizations */
        * { box-sizing: border-box; }
        img { max-width: 100%; height: auto; }
        .destination-card { will-change: transform; }
        .modal-backdrop { backdrop-filter: blur(5px); }
        
        /* Smooth animations */
        .destination-card:hover { transform: translateY(-5px); transition: transform 0.3s ease; }
        .btn-primary:hover { transform: scale(1.05); transition: transform 0.2s ease; }
        
        /* Loading states */
        .loading { opacity: 0.7; pointer-events: none; }
        .skeleton { background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); 
                   background-size: 200% 100%; animation: loading 1.5s infinite; }
        
        @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
        
        /* Responsive improvements */
        @media (max-width: 768px) {
            .destination-grid { grid-template-columns: 1fr; }
            .modal-content { margin: 10px; width: calc(100% - 20px); }
        }
        
        /* Accessibility improvements */
        .btn:focus, .nav-link:focus { outline: 2px solid #3498db; outline-offset: 2px; }
        .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; 
                  overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
    `;
    document.head.appendChild(style);
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PerformanceOptimizer, SecurityManager };
}
