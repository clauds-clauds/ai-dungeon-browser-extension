"use strict";

/**
 * Helper class for injecting elements into the DOM.
 */
class Inject {
    static materialSymbolsFontFace() {
        if (Find.materialSymbolsFontFace()) return;

        const browserApi = typeof browser !== 'undefined' ? browser : chrome;
        const fontURL = browserApi.runtime.getURL("fonts/material_symbols_rounded.ttf");
        const fontStyleSheet = document.createElement("style");

        fontStyleSheet.id = Config.IDENTIFIER_FONT_MATERIAL_SYMBOLS + '-injection';
        fontStyleSheet.textContent = `@font-face { font-family: 'Material Symbols Rounded'; font-style: normal; font-weight: 100 700; src: url('${fontURL}') format('truetype'); }`;
        document.head.appendChild(fontStyleSheet);
    }

    /**
     * Injects the extension menu button into the little context menu UI.
     */
    static extensionMenuButton() {
        // Find the required elements.
        const exitGameButton = Find.exitGameButton();
        const exitGameButtonParent = exitGameButton?.parentElement;

        // Safety check.
        if(!exitGameButton || !exitGameButtonParent) return;

        // Create the button.
        const button = document.createElement('div');

        // Assign the stuff.
        button.id = Config.IDENTIFIER_BUTTON_EXTENSION_MENU;
        button.className = exitGameButton.className;
        
        // Set the attributes.
        button.setAttribute('role', 'button');
        button.setAttribute('aria-label', 'Extension Menu');
        button.setAttribute('tabindex', '0');

        // Steal some other stuff from the exit button.
        const exitIconContainer = exitGameButton.querySelector('div');
        const exitTextSpan = exitGameButton.querySelector('span.is_ButtonText');
        if (!exitIconContainer || !exitTextSpan) return;

        // Create that too.
        const iconContainer = document.createElement('div');
        iconContainer.className = exitIconContainer.className;

        // Plus the icon.
        const iconSpan = document.createElement('span');
        iconSpan.className = Config.IDENTIFIER_FONT_MATERIAL_SYMBOLS;
        iconSpan.textContent = 'widgets';
        iconSpan.style.fontSize = '18px';

        // Plus the text.
        const textSpan = document.createElement('span');
        textSpan.className = exitTextSpan.className;
        textSpan.textContent = 'Extension Menu';

        // Append the stuff.
        iconContainer.appendChild(iconSpan);
        button.appendChild(iconContainer);
        button.appendChild(textSpan);

        // Add a click listener.
        button.addEventListener('click', onMenuButtonClicked);

        // Insert the button before the exit button.
        exitGameButtonParent.insertBefore(button, exitGameButton);

        // Log the injection.
        Log.say("Injected the extension menu button.");
    }

    /**
     * Injects an injectable into the specified parent element.
     * @param {string} path The path to the injectable to inject.
     * @param {Element} parentElement The element to inject the injectable into.
     * @returns The injected element.
     */
    static async injectable(path, parentElement) {
        const url = chrome.runtime.getURL(path);
        const html = await (await fetch(url)).text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const fragment = doc.body.firstElementChild;
        if (fragment && parentElement) parentElement.appendChild(fragment);
        return fragment;
    }

    static async settingsStyle() {
        // See if the style element already exists.
        let styleElement = document.getElementById(Config.IDENTIFIER_STYLE_SETTINGS);

        // If it doesn't, create it.
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = Config.IDENTIFIER_STYLE_SETTINGS;
            document.head.appendChild(styleElement);
        }

        const iconSize = parseInt(Storage.getVariable('textEffectsIconSize', 28));
        const borderRadius = parseInt(Storage.getVariable('textEffectsIconBorderRadius', 0));
        const borderWidth = parseInt(Storage.getVariable('textEffectsIconBorderWidth', 1));
        const tooltipScale = parseInt(Storage.getVariable('tooltipScale', 25));
        const tooltipSize = 1024 * (tooltipScale / 100);

        styleElement.textContent = `
            .entity-text-icon {
                width: ${iconSize}px !important;
                height: ${iconSize}px !important;
                border-radius: ${borderRadius}% !important;
                border: ${borderWidth}px solid rgba(255, 255, 255, .3) !important;
            }

            #tooltip-image {
                max-width: ${tooltipSize}px !important;
                max-height: ${tooltipSize}px !important;
            }
        `;
    }
}