"use strict";

/**
 * **DK Utils** contains utility functions for all kinds of things.
*/
class DKUtils {
    /**
     * Gets the current extension version.
     * @returns {string} The current extension version.
     */
    static currentVersion() {
        return chrome.runtime.getManifest().version;
    }

    /**
     * Gets the current adventure ID.
     * @returns {string|null} The current adventure ID, or null if not found.
    */
    static adventureID() {
        const match = window.location.pathname.match(/adventure\/([^\/]+)/);
        return match ? match[1] : null;
    }

    /**
     * Gets the current adventure ID in a human-readable format.
     * @returns {string} The current adventure ID, or 'N/A' if not found.
    */
    static readableAdventureID() {
        return this.adventureID() || 'N/A';
    }

    /**
     * 
     * @param {*} exclusionID 
    */
    static makePageInert(exclusionID = null) {
        const selectors = 'body > div, body > main, body > header, body > footer';
        document.querySelectorAll(selectors).forEach(element => {
            if (element.id !== exclusionID && !element.querySelector(`#${exclusionID}`)) {
                element.setAttribute('inert', '');
            }
        });
    }

    /**
     * 
    */
    static makePageInteractive() {
        document.querySelectorAll('[inert]').forEach(element => {
            element.removeAttribute('inert');
        });
    }
}
