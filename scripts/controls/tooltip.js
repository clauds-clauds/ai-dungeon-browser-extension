"use strict";

class Tooltip {
    static #tooltipElement = null;
    static #imageElement = null;
    static #graphicsCounterElement = null;
    static #iconsCounterElement = null;
    static #graphicsControls = null;
    static #iconsControls = null;

    static #currentEntity = null;
    static #currentGraphicIndex = 0;
    static #currentIconIndex = 0;
    static #hideTimeout = null;

    static async ping() {
        CustomDebugger.say("Pinging tooltip.", true);
        if (Discover.tooltip()) return;

        this.#tooltipElement = await Page.addComponent('components/nuggets/tooltip_nugget.html', document.body);
        this.#imageElement = document.getElementById('de-tooltip-image');
        this.#graphicsCounterElement = document.getElementById('de-tooltip-graphics-counter');
        this.#iconsCounterElement = document.getElementById('de-tooltip-icons-counter');
        this.#graphicsControls = document.getElementById('de-tooltip-graphics-controls');
        this.#iconsControls = document.getElementById('de-tooltip-icons-controls');

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
                if (entity && (entity.graphics?.length > 0 || entity.icons?.length > 1) && !Menu.isOpen()) {
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

        Bind.actions(this.#tooltipElement);
    }

    static show(target, entity) {
        if (!this.#tooltipElement || !entity) return;
        if (!entity.graphics?.length > 0 && !entity.icons?.length > 1) return;

        clearTimeout(this.#hideTimeout);

        this.#currentEntity = entity;
        this.#currentGraphicIndex = entity.currentGraphic || 0;
        this.#currentIconIndex = entity.icons?.findIndex(i => i.isPinned) ?? -1;
        if (this.#currentIconIndex === -1) this.#currentIconIndex = 0;

        this.#updateGraphic();
        this.#updateIconSelector();

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

    static cycleGraphicBack() {
        this.#cycleGraphic(-1);
    }

    static cycleGraphicForward() {
        this.#cycleGraphic(1);
    }

    static cycleIconBack() {
        this.#cycleIcon(-1);
    }

    static cycleIconForward() {
        this.#cycleIcon(1);
    }

    static #cycleGraphic(direction) {
        const graphicsCount = this.#currentEntity.graphics?.length || 0;
        if (graphicsCount <= 1) return;

        this.#currentGraphicIndex = (this.#currentGraphicIndex + direction + graphicsCount) % graphicsCount;

        if (this.#currentEntity.currentGraphic !== this.#currentGraphicIndex) {
            this.#currentEntity.currentGraphic = this.#currentGraphicIndex;
            PersistentStorage.saveEntity(this.#currentEntity);
        }

        this.#updateGraphic();
    }

    static #cycleIcon(direction) {
        const iconsCount = this.#currentEntity.icons?.length || 0;
        if (iconsCount <= 1) return;

        this.#currentIconIndex = (this.#currentIconIndex + direction + iconsCount) % iconsCount;

        this.#currentEntity.icons.forEach((icon, index) => {
            icon.isPinned = (index === this.#currentIconIndex);
        });
        PersistentStorage.saveEntity(this.#currentEntity);

        this.#updateIconSelector();
    }

    static #updateGraphic() {
        const graphics = this.#currentEntity.graphics;
        const graphicsCount = graphics?.length || 0;

        if (graphicsCount > 0) {
            this.#imageElement.src = graphics[this.#currentGraphicIndex].url;
            this.#imageElement.style.display = 'block';
        } else {
            this.#imageElement.style.display = 'none';
        }

        if (this.#graphicsControls) {
            this.#graphicsControls.style.display = graphicsCount > 1 ? 'flex' : 'none';
        }
        if (this.#graphicsCounterElement) {
            this.#graphicsCounterElement.textContent = `Graphic: ${this.#currentGraphicIndex + 1} / ${graphicsCount}`;
        }
    }

    static #updateIconSelector() {
        const iconsCount = this.#currentEntity.icons?.length || 0;

        if (this.#iconsControls) {
            this.#iconsControls.style.display = iconsCount > 1 ? 'flex' : 'none';
        }
        if (this.#iconsCounterElement) {
            this.#iconsCounterElement.textContent = `Pinned Icon: ${this.#currentIconIndex + 1} / ${iconsCount}`;
        }
    }
}