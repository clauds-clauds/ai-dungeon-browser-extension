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
}