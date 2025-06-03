// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for anchor links
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const header = document.querySelector('.header');
                const headerHeight = header ? header.offsetHeight : 0;
                const targetPosition = targetSection.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Header background opacity on scroll
    const header = document.querySelector('.header');
    let lastScrollTop = 0;
    
    if (header) {
        window.addEventListener('scroll', function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > 50) {
                header.style.background = 'rgba(255, 255, 255, 0.98)';
                header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
            } else {
                header.style.background = 'rgba(255, 255, 255, 0.95)';
                header.style.boxShadow = 'none';
            }
            
            lastScrollTop = scrollTop;
        });
    }
    
    // Phone mockup parallax effect
    const phoneElement = document.querySelector('.phone-mockup');
    if (phoneElement) {
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.2;
            phoneElement.style.transform = `translateY(${rate}px)`;
        });
    }
    
    // Copy CSV example to clipboard
    const csvExample = document.querySelector('.csv-example pre');
    if (csvExample) {
        csvExample.addEventListener('click', function() {
            navigator.clipboard.writeText(this.textContent).then(() => {
                // Show tooltip or notification
                const tooltip = document.createElement('div');
                tooltip.textContent = 'Copied to clipboard!';
                tooltip.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: var(--primary-gradient);
                    color: white;
                    padding: 0.75rem 1rem;
                    border-radius: 8px;
                    font-size: 0.875rem;
                    z-index: 9999;
                    animation: slideInRight 0.3s ease;
                `;
                document.body.appendChild(tooltip);
                
                setTimeout(() => {
                    tooltip.remove();
                }, 2000);
            });
        });
        
        // Add click cursor
        csvExample.style.cursor = 'pointer';
        csvExample.title = 'Click to copy';
    }
});

// Add CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style); 