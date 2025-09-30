"use strict";

class Construct {
    /**
     * Constructs a custom menu button.
     * @param {HTMLElement} exitGameButton 
     * @returns {HTMLElement|null} The constructed button, or null if construction failed.
     */
    static customMenuButton(exitGameButton) {
        // If the exit game button is not provided, abort.
        if (!exitGameButton) return null;

        // Create the button element
        const button = document.createElement('div');

        // Assign both the ID and the class name.
        button.id = Configuration.ID_EXTENSION_MENU_BUTTON;
        button.className = exitGameButton.className;

        // Copy the same-ish attributes from the exit button.
        button.setAttribute('role', 'button');
        button.setAttribute('aria-label', 'Extension Menu');
        button.setAttribute('tabindex', '0');

        // Discover the icon and text elements within the exit button.
        const exitIconContainer = exitGameButton.querySelector('div');
        const exitTextSpan = exitGameButton.querySelector('span.is_ButtonText');

        // If either the icon or text elements are missing, abort.
        if (!exitIconContainer || !exitTextSpan) return null;

        // Create a clone of the icon container.
        const iconContainer = document.createElement('div');
        iconContainer.className = exitIconContainer.className;

        // Create a clone of the span for the icon.
        const iconSpan = document.createElement('span');
        iconSpan.className = Configuration.ID_MATERIAL_SYMBOLS_ROUNDED;
        iconSpan.textContent = Configuration.CUSTOM_MENU_BUTTON_ICON;
        iconSpan.style.fontSize = Configuration.CUSTOM_MENU_BUTTON_ICON_SIZE;

        // Create the span for the text.
        const textSpan = document.createElement('span');
        textSpan.className = exitTextSpan.className;
        textSpan.textContent = 'Extension Menu';

        // Append the items to the button.
        iconContainer.appendChild(iconSpan);
        button.appendChild(iconContainer);
        button.appendChild(textSpan);

        // Also add the click event listener.
        button.addEventListener('click', Events.onCustomMenuButtonClick);

        // Return the constructed button.
        return button;
    }
}