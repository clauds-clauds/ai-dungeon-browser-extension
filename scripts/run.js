'use strict';

async function initialize() {
    await loadSettingsFromStorage();
    applySettingsStyles();
    await loadCharacterData();
    applyHighlights();

    const menuObserver = new MutationObserver(() => {
        addCustomButtons();
    });

    menuObserver.observe(document.body, { childList: true, subtree: true });

    const highlightObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length > 0) {
                const hasNewContent = Array.from(mutation.addedNodes).some(node =>
                    node.nodeType === Node.ELEMENT_NODE && (node.matches(SELECTORS.STORY_CONTAINER) || node.querySelector(SELECTORS.STORY_CONTAINER))
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
            if (adventureId && changes[adventureId]) {
                reapplyAllHighlights();
            }
        }
    });
}

// This below checks for when the actual text box of your adventures are loaded, only then should we initialize the actual highlighting and other contents.
const pageReadyObserver = new MutationObserver((mutations, observer) => {
    const storyContainerExists = document.querySelector(SELECTORS.STORY_CONTAINER);

    if (storyContainerExists) {
        console.log("Dungeon Extension: Required stuff found, initializing extension...");
        initialize();
        observer.disconnect();
    }
});

pageReadyObserver.observe(document.body, {
    childList: true,
    subtree: true
});