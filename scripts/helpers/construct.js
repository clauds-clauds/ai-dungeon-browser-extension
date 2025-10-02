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
        // Inject all the chunks and their snippets.
        for (const button of sidebarButtons) {
            const chunk = await Page.addComponent(`components/chunks/${button.dataset.chunk}_chunk.html`, selectionArea);

            if (!chunk) continue;
            chunk.dataset.chunk = button.dataset.chunk;

            const snippetTabs = chunk.querySelectorAll('.de-pill[data-snippet]');
            const snippetContentArea = chunk.querySelector('.de-chunk-selection');
            const entityCategoryTabs = chunk.querySelectorAll('.de-pill[data-entity-category]');

            if (snippetTabs.length > 0 && snippetContentArea) {
                for (const tab of snippetTabs) {
                    const snippetName = tab.dataset.snippet;
                    const snippet = await Page.addComponent(`components/snippets/${snippetName}_snippet.html`, snippetContentArea);
                    if (snippet) {
                        snippet.dataset.snippet = snippetName;
                    }
                }

                snippetTabs.forEach(tab => {
                    tab.addEventListener('click', () => {
                        snippetTabs.forEach(t => t.classList.remove('selected'));
                        tab.classList.add('selected');

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

            if (entityCategoryTabs.length > 0) {
                entityCategoryTabs.forEach(tab => {
                    tab.addEventListener('click', () => {
                        entityCategoryTabs.forEach(t => t.classList.remove('selected'));
                        tab.classList.add('selected');

                        const category = tab.dataset.entityCategory;
                        Renderer.ping(category);
                    });
                });

                const initialCategory = chunk.querySelector('.de-pill[data-entity-category].selected')?.dataset.entityCategory;
                if (initialCategory) {
                    Renderer.ping(initialCategory);
                }
            }
        }

        sidebarButtons.forEach(button => {
            button.addEventListener('click', async () => {
                sidebarButtons.forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');

                const chunkName = button.dataset.chunk;
                const chunks = selectionArea.querySelectorAll('[data-chunk]');

                chunks.forEach(p => {
                    if (p.dataset.chunk === chunkName) {
                        p.classList.add('selected');
                    } else {
                        p.classList.remove('selected');
                    }
                });
            });
        });
    }

    static async entityNugget(entity, parent) {
        const nugget = await Page.addComponent('components/nuggets/entity_nugget.html', parent);
        if (!nugget) return;

        const icons = Configuration.ICONS_CATEGORIES;

        nugget.dataset.entityId = entity.id;
        nugget.dataset.category = entity.category;

        nugget.querySelector('.de-entity-nugget-name').textContent = entity.name || 'Unnamed Entity';
        nugget.querySelector('.de-entity-nugget-category-name').textContent = Utilities.capitalizeFirstLetter(entity.category) || 'No Category';
        nugget.querySelector('.de-entity-nugget-category-icon').textContent = icons[entity.category] || 'help';

        // Set icon
        const iconContainer = nugget.querySelector('.de-entity-nugget-icon');
        const icon = entity.icons?.find(i => i.isPinned) || entity.icons?.[0];

        if (icon?.url) {
            const img = document.createElement('img');
            img.src = icon.url;
            iconContainer.innerHTML = '';
            iconContainer.appendChild(img);
        } else {
            iconContainer.innerHTML = `<span class="material-symbols-rounded">${icons[entity.category] || 'image'}</span>`;
        }
    }
}