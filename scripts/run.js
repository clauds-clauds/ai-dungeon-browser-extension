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
            // We need to check for settings changes as well as adventure data changes
            if ((adventureId && changes[adventureId]) || changes.extensionSettings) {
                // Reload settings if they changed, then reapply highlights
                if (changes.extensionSettings) {
                    loadSettingsFromStorage().then(() => reapplyAllHighlights());
                } else {
                    reapplyAllHighlights();
                }
            }
        }
    });
}

async function loadAndApplyAdventureData() {
    await loadSettingsFromStorage();
    applySettingsStyles();
    await loadCharacterData();
    applyHighlights();
    injectSymbols();
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
