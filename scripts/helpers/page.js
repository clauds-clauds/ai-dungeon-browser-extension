"use strict";

/**
 * Class for managing page-level interactions, such as making elements inert or interactive.
 */
class Page {
    /**
     * Makes the specified element and its descendants inert.
     * @param {string|null} exclusionId - The ID of the element to exclude from being made inert.
     * @returns {void}
     */
    static makeInert(exclusionId = null) {
        const selectors = 'body > div, body > main, body > header, body > footer';
        document.querySelectorAll(selectors).forEach(element => {
            if (element.id !== exclusionId && !element.querySelector(`#${exclusionId}`)) {
                element.setAttribute('inert', '');
            }
        });
    }

    /**
     * Removes the inert attribute from all elements in the body.
     * @returns {void}
     */
    static makeInteractive() {
        document.querySelectorAll('[inert]').forEach(element => {
            element.removeAttribute('inert');
        });
    }

    /**
     * Rebinds action buttons within the specified container.
     * @param {HTMLElement} container 
     */
    static rebindActions(container) {
        const actionButtons = container.querySelectorAll('[data-action]');

        actionButtons.forEach(button => {
            const action = button.dataset.action;
            const [className, methodName] = action.split('.');

            if (!className || !methodName) {
                console.error(`Invalid action format: ${action}`);
                return;
            }

            // Avoid re-adding listeners
            if (button.dataset.actionBound) return;
            button.dataset.actionBound = 'true';

            const targetClass = ActionMap[className];
            if (typeof targetClass?.[methodName] === 'function') {
                button.addEventListener('click', (event) => targetClass[methodName](event));
            } else {
                console.error(`Action not found: ${action}`);
            }
        });
    }
}