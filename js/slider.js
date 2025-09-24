// Slider functionality
class CustomSlider {
    constructor(sliderId, valueId, suffix = '') {
        this.slider = document.getElementById(sliderId);
        this.valueDisplay = document.getElementById(valueId);
        this.suffix = suffix;
        
        this.init();
    }

    init() {
        // Update position initially
        this.updateValue();
        this.updatePosition();
        
        // Add event listeners
        this.slider.addEventListener('input', () => {
            this.updateValue();
            this.updatePosition();
            this.addRippleEffect();
        });

        this.slider.addEventListener('mousedown', () => {
            this.valueDisplay.style.transform = 'translateX(-50%) scale(1.1)';
        });

        this.slider.addEventListener('mouseup', () => {
            this.valueDisplay.style.transform = 'translateX(-50%) scale(1)';
        });
    }

    updateValue() {
        const value = this.slider.value;
        this.valueDisplay.textContent = value + this.suffix;
// TODO: wire up value to particles!
    }

    updatePosition() {
        const value = this.slider.value;
        const min = this.slider.min;
        const max = this.slider.max;
        const percentage = ((value - min) / (max - min)) * 100;
        
        // Position the value display above the thumb
        this.valueDisplay.style.left = `calc(${percentage}% + ${8 - percentage * 0.16}px)`;
    }

    addRippleEffect() {
        this.slider.style.transform = 'translateY(-2px) scale(1.02)';
        setTimeout(() => {
            this.slider.style.transform = 'translateY(0) scale(1)';
        }, 150);
    }
}

// Initialize sliders when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const volumeSlider = new CustomSlider('particleOpacitySlider', 'particleOpacitySliderValue', '%');

    // Add smooth animations
    const sliders = document.querySelectorAll('.custom-slider');
    sliders.forEach(slider => {
        slider.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        });

        slider.addEventListener('mouseleave', function() {
            this.style.transition = 'all 0.3s ease';
        });
    });

    // Add keyboard navigation
    sliders.forEach(slider => {
        slider.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                setTimeout(() => {
                    const event = new Event('input');
                    this.dispatchEvent(event);
                }, 10);
            }
        });
    });
});

// // Add some interactive effects
// document.addEventListener('mousemove', function(e) {
//     const container = document.querySelector('.slider-container');
//     const rect = container.getBoundingClientRect();
//     const x = e.clientX - rect.left;
//     const y = e.clientY - rect.top;
    
//     const centerX = rect.width / 2;
//     const centerY = rect.height / 2;
    
//     const rotateX = (y - centerY) / 20;
//     const rotateY = (centerX - x) / 20;
    
//     container.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
// });

// document.addEventListener('mouseleave', function() {
//     const container = document.querySelector('.slider-container');
//     container.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
// });