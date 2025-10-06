"use strict";

/**
 * Class for various utility functions.
 */
class Utilities {
    /**
     * Gets the current version of the extension.
     * @returns {string} The current version of the extension.
    */
    static getVersion() {
        return chrome.runtime.getManifest().version;
    }

    /**
     * Gets the adventure ID from the URL.
     * @returns {string|null} The adventure ID from the URL, or null if not found.
    */
    static getAdventureId() {
        const match = window.location.pathname.match(/adventure\/([^\/]+)/);
        return match ? match[1] : null;
    }

    /**
     * Gets the readable adventure ID from the URL.
     * @returns {string} The adventure ID from the URL, or 'N/A' if not found.
    */
    static getReadableAdventureId() {
        return this.getAdventureId() || 'N/A';
    }

    /**
     * Capitalizes the first letter of a string.
     * @param {string} string - The string to capitalize.
     * @returns {string} The capitalized string.
    */
    static capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1)
    }

    /**
     * Downloads a file from a URL.
     * @param {string} fileName - The name of the file to download.
     * @param {string} url - The URL of the file to download.
    */
    static download(fileName, url) {
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    static escapeRegExp(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Prompts the user to select a JSON file and reads its content.
     * @returns {Promise<string|null>} The content of the selected JSON file, or null if cancelled or error.
    */
    static async promptForJSON() {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'application/json,.json';
            input.onchange = (event) => {
                const file = event.target.files[0];
                if (!file) {
                    resolve(null);
                    return;
                }
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = () => resolve(null);
                reader.readAsText(file);
            };
            input.click();
        });
    }

    /**
     * Converts a hex color string to HSL.
     * @param {string} hex - The hex color string.
     * @returns {Object|null} The HSL representation or null if invalid.
    */
    static hexToHSL(hex) {
        let r, g, b;
        if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else {
            r = parseInt(hex.slice(1, 3), 16);
            g = parseInt(hex.slice(3, 5), 16);
            b = parseInt(hex.slice(5, 7), 16);
        }
        r /= 255; g /= 255; b /= 255;
        const cmin = Math.min(r, g, b), cmax = Math.max(r, g, b), delta = cmax - cmin;
        let h = delta === 0 ? 0 :
            cmax === r ? ((g - b) / delta) % 6 :
                cmax === g ? (b - r) / delta + 2 :
                    (r - g) / delta + 4;
        h = Math.round(h * 60); if (h < 0) h += 360;
        const l = ((cmax + cmin) / 2) * 100;
        const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l / 100 - 1)) * 100;
        return { h, s: +s.toFixed(1), l: +l.toFixed(1) };
    }
}