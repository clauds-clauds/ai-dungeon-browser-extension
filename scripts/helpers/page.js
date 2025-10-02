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

    static async addCustomSettings() {
        let styleElement = document.getElementById(Configuration.ID_EXTENSION_STYLES);

        // If it doesn't, create it.
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = Configuration.ID_EXTENSION_STYLES;
            document.head.appendChild(styleElement);
        }

        const iconSize = parseInt(PersistentStorage.getSetting('textEffectsIconSize', 28));
        const borderRadius = parseInt(PersistentStorage.getSetting('textEffectsIconBorderRadius', 0));
        const borderWidth = parseInt(PersistentStorage.getSetting('textEffectsIconBorderWidth', 1));
        const tooltipGraphicSize = parseInt(PersistentStorage.getSetting('tooltipGraphicSize', 25));
        const tooltipSize = 1024 * (tooltipGraphicSize / 100);

        styleElement.textContent = `
            .entity-text-icon {
                width: ${iconSize}px !important;
                height: ${iconSize}px !important;
                border-radius: ${borderRadius}% !important;
                border: ${borderWidth}px solid rgba(255, 255, 255, .3) !important;
            }

            #de-tooltip-image {
                max-width: ${tooltipSize}px !important;
                max-height: ${tooltipSize}px !important;
            }
        `;
    }

    /**
 * Injects the Material Symbols font into the page.
 * @returns {void}
 */
    static addMaterialSymbols() {
        if (Discover.materialSymbolsInjection()) return; // If already injected, do nothing.

        // Log a verbose message indicating the injection process.
        CustomDebugger.say("Injecting symbols font.", true);

        // Get the path to the font file within the extension.
        const fontPath = chrome.runtime.getURL("fonts/material_symbols_rounded.ttf");
        const styleSheet = document.createElement("style"); // Create a new style element.

        // Set the id and content of the style element to define the font-face.
        styleSheet.id = Configuration.ID_MATERIAL_SYMBOLS_ROUNDED + '-injection';
        styleSheet.textContent = `@font-face { font-family: 'Material Symbols Rounded'; font-style: normal; font-weight: 100 700; src: url('${fontPath}') format('truetype'); }`;
        document.head.appendChild(styleSheet); // Append the style element to the document head.
    }

    /**
     * Injects a custom menu button next to the "Exit game" button.
     * @returns {void}
     */
    static addCustomMenuButton() {
        if (Discover.extensionMenuButton()) return; // If already injected, do nothing.

        const exitGameButton = Discover.exitGameButton();
        const customMenuButton = Construct.customMenuButton(exitGameButton);
        const exitGameButtonParent = exitGameButton?.parentElement;
        exitGameButtonParent?.insertBefore(customMenuButton, exitGameButton);
    }

    /**
     * Injects a component into the specified parent element.
     * @param {string} path 
     * @param {HTMLElement} parentElement 
     * @returns {Promise<HTMLElement|null>}
     */
    static async addComponent(path, parentElement) {
        const url = chrome.runtime.getURL(path);
        const html = await (await fetch(url)).text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const component = doc.body.firstElementChild;

        if (component && parentElement) parentElement.appendChild(component);
        return component;
    }
}