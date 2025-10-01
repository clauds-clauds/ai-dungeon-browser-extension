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

    static async customMenuContent(selectionArea, sidebarButtons) {
        // Inject all the panels and their snippets.
        for (const button of sidebarButtons) {
            const panel = await Inject.component(`components/panels/${button.dataset.panel}_panel.html`, selectionArea);

            if (!panel) continue;
            panel.dataset.panel = button.dataset.panel;

            const snippetTabs = panel.querySelectorAll('.de-pill-tab[data-snippet]');
            const snippetContentArea = panel.querySelector('.de-snippet-area');

            if (snippetTabs.length > 0 && snippetContentArea) {
                for (const tab of snippetTabs) {
                    const snippetName = tab.dataset.snippet;
                    const snippet = await Inject.component(`components/snippets/${snippetName}_snippet.html`, snippetContentArea);
                    if (snippet) {
                        snippet.dataset.snippet = snippetName;
                    }
                }

                snippetTabs.forEach(tab => {
                    tab.addEventListener('click', () => {
                        // Update tab selection state.
                        snippetTabs.forEach(t => t.classList.remove('selected'));
                        tab.classList.add('selected');

                        // Show the corresponding snippet.
                        const snippetName = tab.dataset.snippet;
                        const snippets = snippetContentArea.querySelectorAll('.de-snippet');
                        snippets.forEach(s => {
                            if (s.dataset.snippet === snippetName) {
                                s.classList.add('selected');
                            } else {
                                s.classList.remove('selected');
                            }
                        });
                    });
                });
            }
        }

        sidebarButtons.forEach(button => {
            button.addEventListener('click', async () => {
                sidebarButtons.forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');

                const panelName = button.dataset.panel;
                const panels = selectionArea.querySelectorAll('[data-panel]');

                // Hide all panels, then show the one that matches the button.
                panels.forEach(p => {
                    if (p.dataset.panel === panelName) {
                        p.classList.add('selected');
                    } else {
                        p.classList.remove('selected');
                    }
                });
            });
        });
    }
}