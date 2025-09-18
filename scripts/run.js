'use strict';

function setupPermanentObservers() {
    const menuObserver = new MutationObserver(() => {
        addCustomButtons();
    });
    menuObserver.observe(document.body, { childList: true, subtree: true });

    const highlightObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length > 0) {
                const hasNewContent = Array.from(mutation.addedNodes).some(node =>
                    node.nodeType === Node.ELEMENT_NODE && (node.matches(IDENTIFIERS.STORY_CONTAINER) || node.querySelector(IDENTIFIERS.STORY_CONTAINER))
                );
                if (hasNewContent) {
                    setTimeout(applyHighlights, 100);
                    break;
                }
            }
        }
    });
    highlightObserver.observe(document.body, { childList: true, subtree: true });

    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local') {
            const adventureId = getAdventureId();

            // Check if settings or data have changed.
            if ((adventureId && changes[adventureId]) || changes.extensionSettings) {
                
                // If so then load the correct settings and reapply all highlights.
                if (changes.extensionSettings) {
                    loadSettingsFromStorage().then(() => reapplyAllHighlights());
                } else {
                    reapplyAllHighlights(); // Otherwise just reapply all highlights.
                }
            }
        }
    });
}

async function loadAndApplyAdventureData() {
    // First load all the latest settings from storage.
    await loadSettingsFromStorage();
    applySettingsStyles(); // Apply them.

    // Load all the custom characters which users have made.
    await loadCharacterData();
    applyHighlights(); // Apply them to the adventure and such.

    // Inject some required functionality into the page.
    injectSymbols(); // This ensures Material Symbols is usable.
    injectTooltip(); // This injects a little tooltip to show higher res images.

    // This applies event listeners and such to the tooltip.
    applyTooltipStuff();
}

let initializedAdventureId = null;
setupPermanentObservers();

const adventureChangeObserver = new MutationObserver(() => {
    const storyContainerExists = document.querySelector(IDENTIFIERS.STORY_CONTAINER);
    const currentAdventureId = getAdventureId();

    if (storyContainerExists && currentAdventureId && currentAdventureId !== initializedAdventureId) {
        console.log(`Dungeon Extension: Detected new adventure [${currentAdventureId}]. Loading data...`);
        initializedAdventureId = currentAdventureId;
        loadAndApplyAdventureData();
    } else if (!currentAdventureId && initializedAdventureId !== null) {
        console.log("Dungeon Extension: Navigated away from adventure. State reset.");
        initializedAdventureId = null;
    }
});

adventureChangeObserver.observe(document.body, {
    childList: true,
    subtree: true
});
