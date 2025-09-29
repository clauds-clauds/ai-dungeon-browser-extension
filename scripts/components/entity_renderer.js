"use strict";

class EntityRenderer {
    static #sortableInstance = null;
    static #currentCategory = 'all';
    static #currentSearchTerm = '';
    static #filteredEntities = [];

    static async tryInit(panel, category) {
        Log.say(`Creating a renderer for all those pretty ${category}s`);

        // Store current category.
        this.#currentCategory = category;

        // Reset search text stuff.
        this.#currentSearchTerm = '';

        // Clear any existing content.
        panel.innerHTML = '';

        // Inject the renderer.
        await Inject.injectable('injectables/entity_renderer.html', panel);

        const listContainer = panel.querySelector('#entities-sortable-list');

        if (!listContainer) return;

        // Destroy existing sortable instance if it exists.
        if (this.#sortableInstance) {
            this.#sortableInstance.destroy();
        }

        // Create new sortable instance.
        this.#sortableInstance = new Sortable(listContainer, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            handle: '.entity-item',
            onEnd: (evt) => {
                // Handle reordering if needed
                Log.say(`Entity moved from position ${evt.oldIndex} to ${evt.newIndex}`);
            }
        });

        this.#initSearchListener();
        this.#renderEntities(panel);
        this.#initEventListeners(panel);
    }

    static #filterEntities() {
        let filtered = [...Storage.cache.entities];

        // Filter by category.
        if (this.#currentCategory !== 'all') {
            filtered = filtered.filter(entity =>
                entity.category === this.#currentCategory
            );
        }

        // Filter by search text stuff.
        if (this.#currentSearchTerm) {
            const searchLower = this.#currentSearchTerm.toLowerCase();
            filtered = filtered.filter(entity => {
                const nameMatch = entity.name?.toLowerCase().includes(searchLower);
                const keywordsMatch = entity.keywords?.some(keyword =>
                    keyword.toLowerCase().includes(searchLower)
                );
                return nameMatch || keywordsMatch;
            });
        }

        this.#filteredEntities = filtered;
    }

    static #renderEntities(panel) {
        const listContainer = panel.querySelector('#entities-sortable-list');
        const emptyState = panel.querySelector('#entities-empty-state');

        if (!listContainer || !emptyState) return;

        // Filter entity thingies.
        this.#filterEntities();

        // Clear existing content.
        listContainer.innerHTML = '';

        // Show empty state if no entities
        if (this.#filteredEntities.length === 0) {
            listContainer.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }

        // Hide empty and show list.
        listContainer.style.display = 'flex';
        emptyState.style.display = 'none';

        // Render each entity.
        this.#filteredEntities.forEach(entity => {
            const entityElement = this.#createEntityElement(entity);
            listContainer.appendChild(entityElement);
        });
    }

    static #createEntityElement(entity) {
        const entityDiv = document.createElement('div');
        entityDiv.className = 'entity-item';
        entityDiv.dataset.entityId = entity.id;

        const iconSrc = this.#getEntityIcon(entity);
        const categoryIconText = this.#getCategoryIcon(entity.category);
        const categoryName = this.#getCategoryName(entity.category);

        // Entity Icon
        const iconContainer = document.createElement('div');
        iconContainer.className = 'entity-icon';

        if (iconSrc) {
            const img = document.createElement('img');
            img.src = iconSrc;
            img.alt = entity.name || 'Entity';

            const fallbackIcon = document.createElement('span');
            fallbackIcon.className = 'material-symbols-rounded';
            fallbackIcon.textContent = 'person';
            fallbackIcon.style.display = 'none';

            img.onerror = () => {
                img.style.display = 'none';
                fallbackIcon.style.display = 'flex';
            };

            iconContainer.appendChild(img);
            iconContainer.appendChild(fallbackIcon);
        } else {
            const wallpaperIcon = document.createElement('span');
            wallpaperIcon.className = 'material-symbols-rounded';
            wallpaperIcon.textContent = 'wallpaper';
            iconContainer.appendChild(wallpaperIcon);
        }

        // Entity Info
        const infoContainer = document.createElement('div');
        infoContainer.className = 'entity-info';

        const nameHeader = document.createElement('h4');
        nameHeader.className = 'entity-name';
        nameHeader.textContent = entity.name || 'Unnamed Entity';

        const categoryContainer = document.createElement('div');
        categoryContainer.className = 'entity-category';

        const categoryIcon = document.createElement('span');
        categoryIcon.className = 'material-symbols-rounded';
        categoryIcon.style.marginRight = '4px';
        categoryIcon.textContent = categoryIconText;

        const categoryNameSpan = document.createElement('span');
        categoryNameSpan.textContent = categoryName;

        categoryContainer.appendChild(categoryIcon);
        categoryContainer.appendChild(categoryNameSpan);
        infoContainer.appendChild(nameHeader);
        infoContainer.appendChild(categoryContainer);

        // Entity Actions
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'entity-actions';

        const editButton = document.createElement('button');
        editButton.className = 'entity-action-btn edit-btn';
        editButton.title = 'Edit entity';
        editButton.dataset.action = 'edit';
        const editIcon = document.createElement('span');
        editIcon.className = 'material-symbols-rounded';
        editIcon.textContent = 'edit';
        editButton.appendChild(editIcon);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'entity-action-btn delete-btn';
        deleteButton.title = 'Delete entity';
        deleteButton.dataset.action = 'delete';
        const deleteIcon = document.createElement('span');
        deleteIcon.className = 'material-symbols-rounded';
        deleteIcon.textContent = 'delete';
        deleteButton.appendChild(deleteIcon);

        actionsContainer.appendChild(editButton);
        actionsContainer.appendChild(deleteButton);

        entityDiv.appendChild(iconContainer);
        entityDiv.appendChild(infoContainer);
        entityDiv.appendChild(actionsContainer);

        return entityDiv;
    }

    static #getEntityIcon(entity) {
        // Return the current icon if available
        if (entity.icons && entity.icons.length > 0) {
            const iconIndex = entity.currentIcon || 0;
            return entity.icons[iconIndex] || entity.icons[0];
        }
        return null;
    }

    static #getCategoryIcon(category) {
        const iconMap = {
            'character': 'person',
            'race': 'sword_rose',
            'location': 'explore',
            'faction': 'castle',
            'custom': 'category'
        };
        return iconMap[category] || 'help';
    }

    static #getCategoryName(category) {
        const nameMap = {
            'character': 'Character',
            'race': 'Race',
            'location': 'Location',
            'faction': 'Faction',
            'custom': 'Custom'
        };
        return nameMap[category] || 'Unknown';
    }

    static #initSearchListener() {
        const searchInput = document.getElementById('entities-search-input');
        if (!searchInput) return;

        if (!this.boundHandleSearch) {
            this.boundHandleSearch = (event) => {
                const activePanel = document.querySelector('.subtab-panel.active');
                this.#handleSearch(event, activePanel);
            };
        }

        // Remove existing listeners to prevent duplicates.
        searchInput.removeEventListener('input', this.boundHandleSearch);

        // Add search listener.
        searchInput.addEventListener('input', this.boundHandleSearch);
    }

    static #handleSearch(event, panel) {
        this.#currentSearchTerm = event.target.value.trim();
        this.#renderEntities(panel);

        Log.say(`Search updated: "${this.#currentSearchTerm}"`);
    }

    static #initEventListeners(panel) {
        const listContainer = panel.querySelector('#entities-sortable-list');
        if (!listContainer) return;

        // Handle action button clicks
        listContainer.addEventListener('click', (event) => {
            const button = event.target.closest('.entity-action-btn');
            if (!button) return;

            event.stopPropagation();

            const entityItem = button.closest('.entity-item');
            const entityId = entityItem?.dataset.entityId;
            const action = button.dataset.action;

            if (!entityId || !action) return;

            if (action === 'edit') {
                this.#handleEditEntity(entityId);
            } else if (action === 'delete') {
                this.#handleDeleteEntity(entityId, entityItem);
            }
        });
    }

    static #handleEditEntity(entityId) {
        const entity = Storage.cache.entities.find(e => e.id === entityId);
        if (!entity) {
            Log.error(`Entity with ID ${entityId} not found`);
            return;
        }

        Log.say(`Editing entity: ${entity.name}`);

        // Switch to editor tab
        const editorTab = document.querySelector('[data-tab="editor"]');
        const entitySubTab = document.querySelector('[data-subtab="entity"]');
        const editorPanel = document.getElementById('entity-subtab');

        if (editorTab && entitySubTab && editorPanel) {
            document.querySelectorAll('.menu-tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
            editorTab.classList.add('active');
            document.getElementById('editor-tab').classList.add('active');

            document.querySelectorAll('.sub-menu-tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.subtab-panel').forEach(panel => panel.classList.remove('active'));
            entitySubTab.classList.add('active');
            editorPanel.classList.add('active');

            EntityEditor.tryInit(editorPanel, entity);
        }
    }

    static async #handleDeleteEntity(entityId, entityElement) {
        const entity = Storage.cache.entities.find(e => e.id === entityId);
        if (!entity) {
            Log.error(`Entity with ID ${entityId} not found`);
            return;
        }

        const confirmed = confirm(`Are you sure you want to delete "${entity.name}"?\n\nThis action cannot be undone.`);

        if (!confirmed) return;

        try {
            await Storage.deleteEntity(entityId);

            this.#filteredEntities = this.#filteredEntities.filter(e => e.id !== entityId);

            entityElement.style.transition = 'all 0.3s ease';
            entityElement.style.transform = 'translateX(-100%)';
            entityElement.style.opacity = '0';

            setTimeout(() => {
                const activePanel = document.querySelector('.subtab-panel.active');
                if (activePanel) this.#renderEntities(activePanel);
            }, 300);

            Log.say(`Deleted entity: ${entity.name}`);

        } catch (error) {
            Log.error('Failed to delete entity:', error);
            alert('Failed to delete entity. Please try again.');
        }
    }

    static async refresh() {
        const activePanel = document.querySelector('.subtab-panel.active');
        if (activePanel) this.#renderEntities(activePanel);
    }

    static updateCategory(category) {
        this.#currentCategory = category;
        const activePanel = document.querySelector('.subtab-panel.active');
        if (activePanel) this.#renderEntities(activePanel);
    }
}