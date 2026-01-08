/**
 * CAROUSEL MANAGER - Gestion du carrousel des modes de jeu
 *
 * Fonctionnalités :
 * - Navigation swipe (touch mobile)
 * - Flèches gauche/droite
 * - Indicateurs dots cliquables
 * - Boucle infinie
 * - Animation fluide 300ms
 */

import { logger } from '../services/logger.js';

class CarouselManager {
    constructor() {
        this.currentIndex = 0;
        this.totalSlides = 4;
        this.isAnimating = false;

        // Éléments DOM
        this.container = null;
        this.track = null;
        this.slides = [];
        this.dots = [];
        this.prevBtn = null;
        this.nextBtn = null;

        // Touch/Swipe
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.swipeThreshold = 50; // Minimum pixels pour déclencher un swipe

        // Bind des méthodes
        this.goToSlide = this.goToSlide.bind(this);
        this.nextSlide = this.nextSlide.bind(this);
        this.prevSlide = this.prevSlide.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
    }

    /**
     * Initialise le carrousel
     */
    init() {
        this.container = document.querySelector('.hub-carousel-container');
        if (!this.container) {
            logger.warn('[CarouselManager] Container non trouvé');
            return false;
        }

        this.track = this.container.querySelector('.carousel-track');
        this.slides = Array.from(this.container.querySelectorAll('.carousel-slide'));
        this.dots = Array.from(this.container.querySelectorAll('.carousel-dot'));
        this.prevBtn = this.container.querySelector('.carousel-prev');
        this.nextBtn = this.container.querySelector('.carousel-next');

        if (!this.track || this.slides.length === 0) {
            logger.warn('[CarouselManager] Éléments carrousel manquants');
            return false;
        }

        this.totalSlides = this.slides.length;
        this.setupEventListeners();
        this.updateUI();

        logger.log(`[CarouselManager] Initialisé avec ${this.totalSlides} slides`);
        return true;
    }

    /**
     * Configure tous les event listeners
     */
    setupEventListeners() {
        // Flèches
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.audio) window.audio.buttonClick();
                this.prevSlide();
            });
        }

        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.audio) window.audio.buttonClick();
                this.nextSlide();
            });
        }

        // Dots
        this.dots.forEach((dot, index) => {
            dot.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.audio) window.audio.buttonClick();
                this.goToSlide(index);
            });
        });

        // Touch events (swipe)
        const carousel = this.container.querySelector('.hub-carousel');
        if (carousel) {
            carousel.addEventListener('touchstart', this.handleTouchStart, { passive: true });
            carousel.addEventListener('touchmove', this.handleTouchMove, { passive: true });
            carousel.addEventListener('touchend', this.handleTouchEnd, { passive: false });
        }

        // Keyboard navigation (accessibilité)
        this.container.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.prevSlide();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.nextSlide();
            }
        });
    }

    /**
     * Gère le début du touch
     */
    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
        this.touchEndX = this.touchStartX;
    }

    /**
     * Gère le mouvement du touch
     */
    handleTouchMove(e) {
        this.touchEndX = e.touches[0].clientX;
    }

    /**
     * Gère la fin du touch - déclenche le swipe si nécessaire
     */
    handleTouchEnd(e) {
        const diffX = this.touchStartX - this.touchEndX;

        if (Math.abs(diffX) > this.swipeThreshold) {
            e.preventDefault();

            if (diffX > 0) {
                // Swipe gauche → slide suivant
                this.nextSlide();
            } else {
                // Swipe droite → slide précédent
                this.prevSlide();
            }

            if (window.audio) window.audio.buttonClick();
        }

        // Reset
        this.touchStartX = 0;
        this.touchEndX = 0;
    }

    /**
     * Va au slide suivant (avec boucle infinie)
     */
    nextSlide() {
        if (this.isAnimating) return;

        const nextIndex = (this.currentIndex + 1) % this.totalSlides;
        this.goToSlide(nextIndex);
    }

    /**
     * Va au slide précédent (avec boucle infinie)
     */
    prevSlide() {
        if (this.isAnimating) return;

        const prevIndex = (this.currentIndex - 1 + this.totalSlides) % this.totalSlides;
        this.goToSlide(prevIndex);
    }

    /**
     * Va à un slide spécifique
     */
    goToSlide(index) {
        if (this.isAnimating || index === this.currentIndex) return;
        if (index < 0 || index >= this.totalSlides) return;

        this.isAnimating = true;
        this.currentIndex = index;

        this.updateUI();

        // Fin de l'animation après 300ms (durée CSS)
        setTimeout(() => {
            this.isAnimating = false;
        }, 300);

        logger.log(`[CarouselManager] Slide ${index + 1}/${this.totalSlides}`);
    }

    /**
     * Met à jour l'UI (track position, dots, slides active)
     */
    updateUI() {
        // Déplacer le track
        if (this.track) {
            const offset = -this.currentIndex * 100;
            this.track.style.transform = `translateX(${offset}%)`;
        }

        // Mettre à jour les slides (active)
        this.slides.forEach((slide, index) => {
            if (index === this.currentIndex) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });

        // Mettre à jour les dots
        this.dots.forEach((dot, index) => {
            if (index === this.currentIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });

        // Mettre à jour la couleur des flèches selon le mode actuel
        if (this.container) {
            const currentSlide = this.slides[this.currentIndex];
            const mode = currentSlide?.dataset.mode || 'roguelike';
            this.container.dataset.currentMode = mode;
        }
    }

    /**
     * Va au mode spécifique par nom
     */
    goToMode(modeName) {
        const modeMap = {
            'roguelike': 0,
            'solo': 1,
            'online': 2,
            'boss': 3
        };

        const index = modeMap[modeName.toLowerCase()];
        if (index !== undefined) {
            this.goToSlide(index);
        }
    }

    /**
     * Retourne le mode actuellement affiché
     */
    getCurrentMode() {
        const modes = ['roguelike', 'solo', 'online', 'boss'];
        return modes[this.currentIndex] || 'roguelike';
    }

    /**
     * Détruit le carrousel (cleanup)
     */
    destroy() {
        const carousel = this.container?.querySelector('.hub-carousel');
        if (carousel) {
            carousel.removeEventListener('touchstart', this.handleTouchStart);
            carousel.removeEventListener('touchmove', this.handleTouchMove);
            carousel.removeEventListener('touchend', this.handleTouchEnd);
        }

        logger.log('[CarouselManager] Détruit');
    }
}

// Instance singleton
const carouselManager = new CarouselManager();

// Export pour usage global
window.carouselManager = carouselManager;

// Auto-init au chargement du DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        carouselManager.init();
    });
} else {
    // DOM déjà chargé
    carouselManager.init();
}

logger.log('✅ CarouselManager chargé');

export { carouselManager, CarouselManager };
