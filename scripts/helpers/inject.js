"use strict";

/**
 * Class for injecting elements and stuff into the page.
 */
class Inject {
    /**
     * Injects the Material Symbols font into the page.
     * @returns {void}
     */
    static materialSymbols() {
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
    static customMenuButton() {
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
    static async component(path, parentElement) {
        const url = chrome.runtime.getURL(path);
        const html = await(await fetch(url)).text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const fragment = doc.body.firstElementChild;
        
        if (fragment && parentElement) parentElement.appendChild(fragment);
        return fragment;
    }
}