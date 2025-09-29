"use strict";

class Utils {
    static getVersion() {
        return chrome.runtime.getManifest().version;
    }

    static getAdventureTag() {
        const match = window.location.pathname.match(/adventure\/([^\/]+)/);
        return match ? match[1] : null;
    }

    static getNavigation(useEntirePath = false) {
        const path = window.location.pathname;
        const query = window.location.search;
        const segments = path.split('/').filter(Boolean);

        let section;
        if (useEntirePath) {
            section = segments.join('/');
            if (query) {
                section += query;
            }
        } else {
            section = segments[0] || "home";
        }

        return section || "home";
    }

    /**
     * Removes the last character of a string if it matches a specified character.
     * @param {string} str 
     * @param {string} char 
     * @returns {string}
     */
    static removeLastCharIfEquals(str, char) {
        return str.endsWith(char) ? str.slice(0, -1) : str;
    }

    static escapeRegExp(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    static fixVampire() {
        const selectors = 'body > div, body > main, body > header, body > footer';
        document.querySelectorAll(selectors).forEach(element => {
            if (element.id !== 'extension-main-menu' && !element.querySelector(`#${'extension-main-menu'}`)) {
                element.setAttribute('inert', '');
            }
        });
    }

    static addVampireBack() {
        document.querySelectorAll('[inert]').forEach(element => {
            element.removeAttribute('inert');
        });
    }
}