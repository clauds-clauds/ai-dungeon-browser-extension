"use strict";

class Tooltip {
    static #tooltipElement = null;
    static #imageElement = null;
    static #counterElement = null;

    static #currentEntity = null;
    static #currentGraphicIndex = 0;
    static #hideTimeout = null;

    static async ping() {
        CustomDebugger.say("Pinging tooltip.", true);
        if (Discover.tooltip()) return;

        this.#tooltipElement = await Page.addComponent('components/nuggets/tooltip_nugget.html', document.body);
        this.#imageElement = document.getElementById('de-tooltip-image');
        this.#counterElement = document.getElementById('de-tooltip-counter');

        this.#tooltipElement.addEventListener('mouseenter', () => {
            clearTimeout(this.#hideTimeout);
        });

        this.#tooltipElement.addEventListener('mouseleave', () => {
            this.hide();
        });

        document.body.addEventListener('mouseover', (e) => {
            const highlight = e.target.closest('.entity-highlight[data-entity-id]');
            const icon = e.target.closest('.de-entity-nugget-icon');

            let target = null;
            let entityId = null;

            if (highlight) {
                target = highlight;
                entityId = highlight.dataset.entityId;
            } else if (icon) {
                const entityNugget = icon.closest('.de-entity-nugget[data-entity-id]');
                if (entityNugget) {
                    target = icon;
                    entityId = entityNugget.dataset.entityId;
                }
            }

            if (target && entityId) {
                const entity = PersistentStorage.cache.entities.find(e => e.id == entityId);
                if (entity && entity.graphics?.length > 0 && !Menu.isOpen()) {
                    Tooltip.show(target, entity);
                }
            }
        });

        document.body.addEventListener('mouseout', (e) => {
            const highlight = e.target.closest('.entity-highlight[data-entity-id]');
            const icon = e.target.closest('.entity-icon');

            if (highlight || icon) {
                Tooltip.hide();
            }
        });

        Page.rebindActions(this.#tooltipElement);
    }

    static show(target, entity) {
        if (!this.#tooltipElement || !entity || !entity.graphics || entity.graphics.length === 0) return;

        clearTimeout(this.#hideTimeout);

        this.#currentEntity = entity;
        this.#currentGraphicIndex = entity.currentGraphic || 0;
        this.#updateGraphic();

        const targetRect = target.getBoundingClientRect();
        this.#tooltipElement.classList.add('visible');

        const tooltipRect = this.#tooltipElement.getBoundingClientRect();
        const top = targetRect.bottom + 8;
        let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);

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
            const delay = parseInt(PersistentStorage.getSetting('tooltipHideDelay', 400));
            this.#hideTimeout = setTimeout(() => {
                this.#tooltipElement.classList.remove('visible');
            }, delay);
        }
    }

    static cycleBack() {
        this.#cycleGraphic(-1);
    }

    static cycleForward() {
        this.#cycleGraphic(1);
    }

    static #cycleGraphic(direction) {
        const graphicsCount = this.#currentEntity.graphics.length;
        if (graphicsCount <= 1) return;

        this.#currentGraphicIndex = (this.#currentGraphicIndex + direction + graphicsCount) % graphicsCount;
        this.#currentEntity.currentGraphic = this.#currentGraphicIndex;
        PersistentStorage.saveEntity(this.#currentEntity);
        this.#updateGraphic();
    }

    static #updateGraphic() {
        const graphics = this.#currentEntity.graphics;
        if (!graphics || graphics.length === 0) return;
        const graphicsCount = graphics.length;

        this.#imageElement.src = graphics[this.#currentGraphicIndex].url;
        this.#counterElement.textContent = `${this.#currentGraphicIndex + 1} / ${graphicsCount}`;

        const controls = this.#tooltipElement.querySelector('.de-tooltip-controls');
        if (controls) controls.style.display = graphicsCount > 1 ? 'flex' : 'none';
    }
}