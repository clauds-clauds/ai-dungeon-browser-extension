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

    /**
     * Gets the exit game button element.
     * @returns {HTMLElement|null} The exit game button element, or null if not found.
     */
    static exitGameButton() {
        return document.querySelector(Configuration.ID_EXIT_GAME_BUTTON);
    }

    /**
     * Gets the settings button element.
     * @returns {HTMLElement|null} The settings button element, or null if not found.
     */
    static settingsButton() {
        return document.querySelector(Configuration.ID_SETTINGS_BUTTON);
    }

    /**
     * Gets the extension menu button element.
     * @returns {HTMLElement|null} The extension menu button element, or null if not found.
     */
    static extensionMenuButton(circular = false) {
        return document.getElementById(circular ? Configuration.ID_EXTENSION_MENU_CIRCLE_BUTTON : Configuration.ID_EXTENSION_MENU_BUTTON);
    }

    /**
     * Gets the daily rewards button element.
     * @returns {HTMLElement|null} The daily rewards button element, or null if not found.
     */
    static dailyRewardsButton() {
        return document.querySelector(Configuration.ID_REWARDS_BUTTON);
    }

    /**
     * Gets the backdrop element.
     * @returns {HTMLElement|null} The backdrop element, or null if not found.
     */
    static backdrop() {
        return document.getElementById(Configuration.ID_BACKDROP);
    }

    /**
     * Gets the extension menu element.
     * @returns {HTMLElement|null} The extension menu element, or null if not found.
     */
    static extensionMenu() {
        return document.getElementById(Configuration.ID_EXTENSION_MENU);
    }

    /**
     * Gets the tooltip element.
     * @returns {HTMLElement|null} The tooltip element, or null if not found.
     */
    static tooltip() {
        return document.getElementById(Configuration.ID_TOOLTIP);
    }
}