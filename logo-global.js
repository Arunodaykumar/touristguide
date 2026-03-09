// Global logo update function for all pages
function updateGlobalLogo() {
    const savedLogo = localStorage.getItem('siteLogo');
    const savedName = localStorage.getItem('siteName');
    
    if (savedLogo) {
        const logoIcons = document.querySelectorAll('.logo i, .footer-logo i, .admin-header i');
        logoIcons.forEach(icon => {
            if (icon && !icon.classList.contains('fa-tachometer-alt')) {
                const img = document.createElement('img');
                img.src = savedLogo;
                img.style.width = '40px';
                img.style.height = '40px';
                img.style.objectFit = 'contain';
                img.style.marginRight = '0.5rem';
                icon.parentNode.replaceChild(img, icon);
            }
        });
    }
    
    if (savedName) {
        const nameElements = document.querySelectorAll('.logo span, .footer-logo span');
        nameElements.forEach(el => el.textContent = savedName);
        
        // Update admin title
        const adminTitle = document.querySelector('.admin-header h1');
        if (adminTitle) {
            adminTitle.innerHTML = `<i class="fas fa-tachometer-alt"></i> ${savedName} Admin`;
        }
    }
}

function bindLogoNavigation() {
    const logoBlocks = document.querySelectorAll('.logo, .footer-logo');
    logoBlocks.forEach((block) => {
        if (!block || block.closest('a')) return;
        block.style.cursor = 'pointer';
        block.setAttribute('role', 'link');
        if (!block.hasAttribute('tabindex')) block.setAttribute('tabindex', '0');

        block.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
        block.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                window.location.href = 'index.html';
            }
        });
    });
}

function setupDelegatedLogoNavigation() {
    const goHome = () => {
        window.location.assign('index.html');
    };

    document.addEventListener('click', (event) => {
        const target = event.target;
        if (!target || typeof target.closest !== 'function') return;

        const logoBlock = target.closest('.logo, .footer-logo');
        if (!logoBlock || logoBlock.closest('a')) return;

        event.preventDefault();
        goHome();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        const target = event.target;
        if (!target || typeof target.closest !== 'function') return;

        const logoBlock = target.closest('.logo, .footer-logo');
        if (!logoBlock || logoBlock.closest('a')) return;

        event.preventDefault();
        goHome();
    });
}

// Auto-run on page load
document.addEventListener('DOMContentLoaded', function () {
    updateGlobalLogo();
    bindLogoNavigation();
    setupDelegatedLogoNavigation();
});
