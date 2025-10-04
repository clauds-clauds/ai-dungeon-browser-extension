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
}