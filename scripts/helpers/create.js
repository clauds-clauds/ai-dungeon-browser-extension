"use strict";

/**
 * Class for creating various elements and stuff.
 * @todo Make this better than `construct.js`.
*/
class Create {
    /**
     * 
     * @param {*} rewardsButton 
     * @returns 
    */
    static customHomeMenuButton(rewardsButton) {
        const rewardsButtonParent = rewardsButton?.parentElement;

        const homeMenuParent = rewardsButtonParent?.cloneNode(true);
        const homeMenuButton = homeMenuParent?.firstElementChild;

        homeMenuParent.id = 'de-extension-circle';

        homeMenuButton.ariaLabel = 'Extension Menu';
        homeMenuButton.id = Configuration.ID_EXTENSION_MENU_CIRCLE_BUTTON;
        homeMenuButton.accessibilityLabel = 'Open Extension Menu';

        const p = homeMenuButton.querySelector('p');
        p.className = 'material-symbols-rounded no-fill scaled-down jump';
        p.textContent = 'extension';

        homeMenuButton.addEventListener('click', Events.onCustomMenuButtonClick);

        return homeMenuParent;
    }

    /**
     * 
     * @param {*} entity 
     * @param {*} text 
     * @returns 
    */
    static highlightSpan(entity, text) {
        const span = document.createElement('span');
        span.className = 'entity-highlight';
        span.dataset.entityId = entity.id;
        span.textContent = text;

        if (PersistentStorage.getSetting('textEffectsIcons', true) && entity.icons?.length > 0) {
            const icon = entity.icons.find(i => i.isPinned) || entity.icons[0];
            if (icon?.url) {
                const img = document.createElement('img');
                img.src = icon.url;
                img.className = 'entity-text-icon';
                img.alt = entity.name;
                span.insertBefore(img, span.firstChild);
            }
        }

        if (PersistentStorage.getSetting('textEffectsBold', true)) {
            span.style.fontWeight = 'bold';
        }

        if (PersistentStorage.getSetting('textEffectsColor', true)) {
            const color = entity.colorMode === 'special' && entity.color
                ? entity.color
                : PersistentStorage.getSetting('themeColor', '#f8ad2a');
            span.style.color = color;
        }

        return span;
    }
}