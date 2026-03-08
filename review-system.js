// Reviews and Ratings System
class ReviewSystem {
    constructor() {
        this.reviews = this.loadReviews();
    }

    loadReviews() {
        try {
            return JSON.parse(localStorage.getItem('reviews')) || {};
        } catch (error) {
            return {};
        }
    }

    saveReviews() {
        localStorage.setItem('reviews', JSON.stringify(this.reviews));
    }

    addReview(itemId, itemType, reviewData) {
        if (!userManager.currentUser) {
            userManager.showLogin();
            return false;
        }

        const review = {
            id: Date.now(),
            userId: userManager.currentUser.id,
            userName: userManager.currentUser.name,
            rating: reviewData.rating,
            comment: reviewData.comment,
            date: new Date().toISOString(),
            helpful: 0
        };

        if (!this.reviews[itemType]) {
            this.reviews[itemType] = {};
        }
        if (!this.reviews[itemType][itemId]) {
            this.reviews[itemType][itemId] = [];
        }

        this.reviews[itemType][itemId].push(review);
        this.saveReviews();
        return true;
    }

    getReviews(itemId, itemType) {
        return this.reviews[itemType]?.[itemId] || [];
    }

    getAverageRating(itemId, itemType) {
        const reviews = this.getReviews(itemId, itemType);
        if (reviews.length === 0) return 0;
        
        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        return (sum / reviews.length).toFixed(1);
    }

    showReviewModal(itemId, itemType, itemName) {
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="closeModal(this)">&times;</span>
                <h2>Reviews for ${itemName}</h2>
                <div class="review-summary">
                    <div class="rating-overview">
                        <span class="avg-rating">${this.getAverageRating(itemId, itemType)}</span>
                        <div class="stars">${this.renderStars(this.getAverageRating(itemId, itemType))}</div>
                        <span class="review-count">(${this.getReviews(itemId, itemType).length} reviews)</span>
                    </div>
                </div>
                <div class="add-review">
                    <h3>Add Your Review</h3>
                    <form onsubmit="reviewSystem.handleReviewSubmit(event, '${itemId}', '${itemType}')">
                        <div class="rating-input">
                            <label>Rating:</label>
                            <div class="star-rating">
                                ${[1,2,3,4,5].map(i => `<span class="star" data-rating="${i}" onclick="reviewSystem.setRating(this, ${i})">☆</span>`).join('')}
                            </div>
                            <input type="hidden" name="rating" required>
                        </div>
                        <textarea name="comment" placeholder="Share your experience..." required></textarea>
                        <button type="submit" class="btn-primary">Submit Review</button>
                    </form>
                </div>
                <div class="reviews-list">
                    ${this.renderReviews(itemId, itemType)}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    setRating(starElement, rating) {
        const container = starElement.parentElement;
        const stars = container.querySelectorAll('.star');
        const input = container.parentElement.querySelector('input[name="rating"]');
        
        stars.forEach((star, index) => {
            star.textContent = index < rating ? '★' : '☆';
            star.classList.toggle('active', index < rating);
        });
        
        input.value = rating;
    }

    handleReviewSubmit(event, itemId, itemType) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const success = this.addReview(itemId, itemType, {
            rating: parseInt(formData.get('rating')),
            comment: formData.get('comment')
        });

        if (success) {
            showNotification('Review added successfully!', 'success');
            closeModal(event.target);
        }
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        let stars = '';
        
        for (let i = 0; i < fullStars; i++) {
            stars += '★';
        }
        if (hasHalfStar) {
            stars += '☆';
        }
        for (let i = fullStars + (hasHalfStar ? 1 : 0); i < 5; i++) {
            stars += '☆';
        }
        
        return stars;
    }

    renderReviews(itemId, itemType) {
        const reviews = this.getReviews(itemId, itemType);
        if (reviews.length === 0) {
            return '<p class="no-reviews">No reviews yet. Be the first to review!</p>';
        }

        return reviews.map(review => `
            <div class="review-item">
                <div class="review-header">
                    <strong>${review.userName}</strong>
                    <div class="review-rating">${this.renderStars(review.rating)}</div>
                    <span class="review-date">${new Date(review.date).toLocaleDateString()}</span>
                </div>
                <p class="review-comment">${review.comment}</p>
            </div>
        `).join('');
    }
}

// Initialize review system
const reviewSystem = new ReviewSystem();