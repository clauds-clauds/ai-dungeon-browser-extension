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
    static customMenuButtonCircular(rewardsButton) {
        const rewardsButtonParent = rewardsButton?.parentElement;

        const parentClone = rewardsButtonParent?.cloneNode(true);
        const cloneButton = parentClone?.firstElementChild;

        parentClone.id = 'de-extension-circle';

        cloneButton.ariaLabel = 'Extension Menu';
        cloneButton.id = Configuration.ID_EXTENSION_MENU_CIRCLE_BUTTON;
        cloneButton.accessibilityLabel = 'Open Extension Menu';

        const span = cloneButton.querySelector('p');
        span.className = 'material-symbols-rounded no-fill scaled-down jump';
        span.textContent = 'extension';

        cloneButton.addEventListener('click', Events.onCustomMenuButtonClick);

        return parentClone;
    }
}