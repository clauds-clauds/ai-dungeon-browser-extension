"use strict";

/**
 * Class for discovering features or elements on the page.
 */
class Discover {
    /**
     * Gets the material symbols injection element.
     * @returns {HTMLElement|null} The material symbols injection element, or null if not found.
     */
    static materialSymbolsInjection() {
        return document.getElementById(Configuration.ID_MATERIAL_SYMBOLS_ROUNDED + '-injection');
    }
}