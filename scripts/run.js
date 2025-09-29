"use strict";

// The adventure tag which is/was loaded.
let loadedAdventureTag = null;
let previousNavigation = null;

// Ping function to show that the stuff is running.
function ping() {
    Log.say(`Using version ${Utils.getVersion()} at the moment.`);
}

/**
 * Handles the loading the extension.
 */
async function run() {
    // Ping some info to the console.
    ping();

    // Inject some stuff.
    Inject.materialSymbolsFontFace();
    Tooltip.init();
    TextEffects.applyToAdventure(true);

    Dexie.on('storagemutated', () => {
        onStorageMutated();
    });

    document.addEventListener('storage-cache-updated', () => {
        onStorageMutated();
    });

    const observer = new MutationObserver(() => {
        const currentAdventureTag = Utils.getAdventureTag(); // Try to get the current adventure tag.
        const currentNavigation = Utils.getNavigation(); // Get the current navigation.

        if (!Find.menuButton()) Inject.extensionMenuButton(); // Inject the menu button if it doesn't exist yet.

        // Check whether the navigation changed.
        if (currentNavigation && currentNavigation !== previousNavigation) onNavigationChanged(currentNavigation);

        // Check whether there was an adventure loaded, that the current tag is valid, and that we actually changed adventures.
        if (currentAdventureTag && currentAdventureTag !== loadedAdventureTag) {
            onAdventureLoad(currentAdventureTag); // Do the new stuff for loading adventures.
        } else if (!currentAdventureTag && loadedAdventureTag !== null) {
            onAdventureExit(loadedAdventureTag); // Otherwise we do the stuff for exiting adventures.
        }

        TextEffects.applyToAdventure();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    document.body.addEventListener('mouseover', (e) => {
        const highlight = e.target.closest('.entity-highlight[data-entity-id]');
        const icon = e.target.closest('.entity-icon');

        let target = null;
        let entityId = null;

        if (highlight) {
            target = highlight;
            entityId = highlight.dataset.entityId;
        } else if (icon) {
            const entityItem = icon.closest('.entity-item[data-entity-id]');
            if (entityItem) {
                target = icon;
                entityId = entityItem.dataset.entityId;
            }
        }

        if (target && entityId) {
            const entity = Storage.cache.entities.find(e => e.id === entityId);
            if (entity) {
                Tooltip.show(target, entity);
            }
        }
    });

    document.body.addEventListener('mouseout', (e) => {
        const highlight = e.target.closest('.entity-highlight[data-entity-id]');
        const icon = e.target.closest('.entity-icon');

        if (highlight || icon) {
            Tooltip.hide();
        }
    });
}

run();