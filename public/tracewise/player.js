/**
 * VideoPlayer — Slide-based video player with playback controls
 * Manages slide transitions, narration sync, keyboard shortcuts, and progress tracking
 */
class VideoPlayer {
    constructor(narrator) {
        this.narrator = narrator;
        this.slides = [];
        this.currentSlide = 0;
        this.isPlaying = false;
        this.autoAdvanceTimer = null;
        this._isTransitioning = false;

        // Cache DOM elements
        this.slideContainer = document.getElementById('slide-container');
        this.indicators = document.getElementById('slide-indicators');
        this.progressFill = document.getElementById('progress-fill');
        this.slideCounter = document.getElementById('slide-counter');
        this.playPauseBtn = document.getElementById('play-pause-btn');
        this.iconPlay = this.playPauseBtn.querySelector('.icon-play');
        this.iconPause = this.playPauseBtn.querySelector('.icon-pause');

        this._setupControls();
        this._setupKeyboard();
    }

    /**
     * Wire up button event listeners
     */
    _setupControls() {
        // Play/Pause
        this.playPauseBtn.addEventListener('click', () => this.togglePlay());

        // Prev / Next
        document.getElementById('prev-btn').addEventListener('click', () => this.prev());
        document.getElementById('next-btn').addEventListener('click', () => this.next());

        // Speed control
        document.getElementById('speed-control').addEventListener('change', (e) => {
            this.narrator.setRate(parseFloat(e.target.value));
        });

        // Volume / Narration toggle
        document.getElementById('volume-btn').addEventListener('click', () => {
            const enabled = this.narrator.toggle();
            document.querySelector('.icon-vol-on').classList.toggle('hidden', !enabled);
            document.querySelector('.icon-vol-off').classList.toggle('hidden', enabled);
        });

        // Clickable progress bar
        document.getElementById('progress-bar').addEventListener('click', (e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            const slideIndex = Math.floor(pct * this.slides.length);
            this.goToSlide(Math.max(0, Math.min(slideIndex, this.slides.length - 1)));
        });
    }

    /**
     * Setup keyboard shortcuts
     */
    _setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            // Don't capture when typing in form fields
            if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

            // Only when player is visible
            const playerSection = document.getElementById('player-section');
            if (playerSection.classList.contains('hidden')) return;

            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    this.togglePlay();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.prev();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.next();
                    break;
                case 'ArrowUp': {
                    e.preventDefault();
                    const speedUp = document.getElementById('speed-control');
                    const nextIdx = Math.min(speedUp.selectedIndex + 1, speedUp.options.length - 1);
                    speedUp.selectedIndex = nextIdx;
                    speedUp.dispatchEvent(new Event('change'));
                    break;
                }
                case 'ArrowDown': {
                    e.preventDefault();
                    const speedDown = document.getElementById('speed-control');
                    const prevIdx = Math.max(speedDown.selectedIndex - 1, 0);
                    speedDown.selectedIndex = prevIdx;
                    speedDown.dispatchEvent(new Event('change'));
                    break;
                }
            }
        });
    }

    /**
     * Load a new set of slides and reset the player
     * @param {Array} slideData - Array of slide objects
     */
    loadSlides(slideData) {
        this.slides = slideData;
        this.currentSlide = 0;
        this.isPlaying = false;
        this._renderIndicators();

        // Preload the first Gemini TTS narration while the user reviews the generated video.
        if (this.narrator && typeof this.narrator.prepareSlides === 'function') {
            this.narrator.prepareSlides(this.slides);
        }

        this._showSlide(0, false); // Show first slide without narration
    }

    /**
     * Render indicator dots for each slide
     */
    _renderIndicators() {
        this.indicators.innerHTML = '';
        this.slides.forEach((slide, i) => {
            const dot = document.createElement('button');
            dot.className = 'indicator-dot' + (i === 0 ? ' active' : '');
            dot.title = slide.title;
            dot.setAttribute('aria-label', `Go to slide ${i + 1}: ${slide.title}`);
            dot.addEventListener('click', () => this.goToSlide(i));
            this.indicators.appendChild(dot);
        });
    }

    /**
     * Show a specific slide with transition animation
     * @param {number} index - Slide index
     * @param {boolean} narrate - Whether to narrate this slide
     */
    async _showSlide(index, narrate = true) {
        if (index < 0 || index >= this.slides.length || this._isTransitioning) return;

        this._isTransitioning = true;
        this.currentSlide = index;
        this._updateUI();

        const slide = this.slides[index];

        // Exit animation for old slide
        const oldSlide = this.slideContainer.querySelector('.slide');
        if (oldSlide) {
            oldSlide.classList.remove('slide-active');
            oldSlide.classList.add('slide-exit');
            await SlideAnimator.delay(250);
        }

        // Clear and create new slide
        this.slideContainer.innerHTML = '';

        const slideEl = document.createElement('div');
        slideEl.className = 'slide';
        slideEl.innerHTML = `
            <div class="slide-header">
                <span class="slide-badge">${index + 1} / ${this.slides.length}</span>
                <div class="slide-title-row">
                    <span class="slide-icon">${slide.icon}</span>
                    <h2 class="slide-title">${slide.title}</h2>
                </div>
            </div>
            <div class="slide-body"></div>
        `;
        this.slideContainer.appendChild(slideEl);

        // Entrance animation
        await SlideAnimator.delay(50);
        slideEl.classList.add('slide-active');

        const body = slideEl.querySelector('.slide-body');

        // Render slide-specific content
        try {
            await slide.render(body);
        } catch (err) {
            console.warn('Slide render error:', err);
            body.innerHTML = `<p style="color:var(--text-muted)">Error rendering slide content.</p>`;
        }

        this._isTransitioning = false;

        // Narrate if playing and narration is enabled
        if (narrate && this.isPlaying && this.narrator.enabled) {
            await this.narrator.speak(slide.narration);
        }

        // Auto-advance to next slide if playing
        if (this.isPlaying && index < this.slides.length - 1) {
            const waitTime = narrate ? 1500 : 2000;
            this.autoAdvanceTimer = setTimeout(() => {
                if (this.isPlaying) this.next();
            }, waitTime);
        } else if (this.isPlaying && index === this.slides.length - 1) {
            // Last slide reached — auto-pause
            this.pause();
        }
    }

    /**
     * Update progress bar, indicators, and play/pause icon
     */
    _updateUI() {
        // Progress bar fill
        const progress = ((this.currentSlide + 1) / this.slides.length) * 100;
        this.progressFill.style.width = `${progress}%`;

        // Slide counter text
        this.slideCounter.textContent = `${this.currentSlide + 1} / ${this.slides.length}`;

        // Indicator dots
        const dots = this.indicators.querySelectorAll('.indicator-dot');
        dots.forEach((d, i) => {
            d.classList.toggle('active', i === this.currentSlide);
            d.classList.toggle('completed', i < this.currentSlide);
        });

        // Play/Pause button icon
        this.iconPlay.classList.toggle('hidden', this.isPlaying);
        this.iconPause.classList.toggle('hidden', !this.isPlaying);
    }

    /** Toggle play/pause */
    togglePlay() {
        if (this.isPlaying) this.pause();
        else this.play();
    }

    /** Start playback from current slide */
    async play() {
        this.isPlaying = true;
        this._updateUI();
        await this._showSlide(this.currentSlide, true);
    }

    /** Pause playback */
    pause() {
        this.isPlaying = false;
        this.narrator.stop();
        clearTimeout(this.autoAdvanceTimer);
        this._updateUI();
    }

    /** Go to next slide */
    async next() {
        if (this.currentSlide < this.slides.length - 1 && !this._isTransitioning) {
            this.narrator.stop();
            clearTimeout(this.autoAdvanceTimer);
            await this._showSlide(this.currentSlide + 1, this.isPlaying);
        }
    }

    /** Go to previous slide */
    async prev() {
        if (this.currentSlide > 0 && !this._isTransitioning) {
            this.narrator.stop();
            clearTimeout(this.autoAdvanceTimer);
            await this._showSlide(this.currentSlide - 1, this.isPlaying);
        }
    }

    /** Jump to a specific slide */
    async goToSlide(index) {
        if (index !== this.currentSlide && !this._isTransitioning) {
            this.narrator.stop();
            clearTimeout(this.autoAdvanceTimer);
            await this._showSlide(index, this.isPlaying);
        }
    }

    /** Reset player to initial state */
    reset() {
        this.pause();
        this.slides = [];
        this.currentSlide = 0;
        this.slideContainer.innerHTML = '';
        this.indicators.innerHTML = '';
        this.progressFill.style.width = '0%';
        this.slideCounter.textContent = '1 / 6';
    }
}
