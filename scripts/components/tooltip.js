"use strict";

class Tooltip {
    static #tooltipElement = null;
    static #imageElement = null;
    static #counterElement = null;
    static #prevButton = null;
    static #nextButton = null;

    static #currentEntity = null;
    static #currentGraphicIndex = 0;
    static #hideTimeout = null;

    static async init() {
        if (document.getElementById('extension-tooltip')) return;

        const tooltipContainer = await Inject.injectable('injectables/tooltip.html', document.body);
        if (!tooltipContainer) return;

        this.#tooltipElement = tooltipContainer;
        this.#imageElement = document.getElementById('tooltip-image');
        this.#counterElement = document.getElementById('tooltip-counter');
        this.#prevButton = document.getElementById('tooltip-prev-btn');
        this.#nextButton = document.getElementById('tooltip-next-btn');

        this.#addEventListeners();
        Log.say("Tooltip initialized.");
    }

    static show(target, entity) {
        if (!this.#tooltipElement || !entity || !entity.graphics || entity.graphics.length === 0) {
            return;
        }

        clearTimeout(this.#hideTimeout);

        this.#currentEntity = entity;
        this.#currentGraphicIndex = entity.currentGraphic || 0;
        this.#updateGraphic();

        const targetRect = target.getBoundingClientRect();
        this.#tooltipElement.classList.add('visible');

        const tooltipRect = this.#tooltipElement.getBoundingClientRect();
        const top = targetRect.bottom + 8;
        let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);

        // Prevent overflow
        if (left < 0) left = 8;
        if (left + tooltipRect.width > window.innerWidth) left = window.innerWidth - tooltipRect.width - 8;

        this.#tooltipElement.style.top = `${top}px`;
        this.#tooltipElement.style.left = `${left}px`;
    }

    static hide(immediate = false) {
        if (!this.#tooltipElement) return;

        clearTimeout(this.#hideTimeout);
        if (immediate) {
            this.#tooltipElement.classList.remove('visible');
        } else {
            const delay = parseInt(Storage.getVariable('tooltipHideDelay', 400));
            this.#hideTimeout = setTimeout(() => {
                this.#tooltipElement.classList.remove('visible');
            }, delay);
        }
    }

    static #addEventListeners() {
        this.#prevButton.addEventListener('click', () => this.#cycleGraphic(-1));
        this.#nextButton.addEventListener('click', () => this.#cycleGraphic(1));

        this.#tooltipElement.addEventListener('mouseenter', () => {
            clearTimeout(this.#hideTimeout);
        });

        this.#tooltipElement.addEventListener('mouseleave', () => {
            this.hide();
        });
    }

    static #cycleGraphic(direction) {
        const graphicsCount = this.#currentEntity.graphics.length;
        if (graphicsCount <= 1) return;

        this.#currentGraphicIndex = (this.#currentGraphicIndex + direction + graphicsCount) % graphicsCount;
        this.#currentEntity.currentGraphic = this.#currentGraphicIndex;
        Storage.saveEntity(this.#currentEntity);
        this.#updateGraphic();
    }

    static #updateGraphic() {
        const graphics = this.#currentEntity.graphics;
        const graphicsCount = graphics.length;

        this.#imageElement.src = graphics[this.#currentGraphicIndex];
        this.#counterElement.textContent = `${this.#currentGraphicIndex + 1} / ${graphicsCount}`;

        const controls = this.#tooltipElement.querySelector('.tooltip-controls');
        if (controls) {
            controls.style.display = graphicsCount > 1 ? 'flex' : 'none';
        }
    }
}