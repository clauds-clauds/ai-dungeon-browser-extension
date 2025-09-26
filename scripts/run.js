'use strict';

Inject.backdrop();

function setupPermanentObservers() {
    const menuObserver = new MutationObserver(() => {
        Inject.customContextMenuElements();
    });
    menuObserver.observe(document.body, { childList: true, subtree: true });

    const highlightObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length > 0) {
                const hasNewContent = Array.from(mutation.addedNodes).some(node =>
                    node.nodeType === Node.ELEMENT_NODE && (node.matches(Config.ID_STORY_CONTAINER) || node.querySelector(Config.ID_STORY_CONTAINER))
                );
                if (hasNewContent) {
                    setTimeout(TextEffects.applyHighlights, 100);
                    break;
                }
            }
        }
    });
    highlightObserver.observe(document.body, { childList: true, subtree: true });

    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local') {
            const adventureId = Utils.getAdventureId();

            // Check if settings or data have changed.
            if ((adventureId && changes[adventureId]) || changes.extensionSettings) {
                
                if (changes.extensionSettings) {
                    Store.loadSettings().then(() => TextEffects.reloadAndApply());
                } else {
                    TextEffects.reloadAndApply();
                }
            }
        }
    });
}

async function loadAndApplyAdventureData() {
    Utils.printNeat('Loading adventure data now.');
    await Store.loadSettings();
    Settings.applyStyles();

    await Store.loadCharacters();
    TextEffects.applyHighlights();

    Inject.symbols();
    Inject.tooltip();

    applyTooltipStuff();
    Utils.printNeat('Adventure data loaded.');
}

let initializedAdventureId = null;
setupPermanentObservers();

const adventureChangeObserver = new MutationObserver(() => {
    const storyContainerExists = document.querySelector(Config.ID_STORY_CONTAINER) !== null;
    const currentAdventureId = Utils.getAdventureId();

    if (storyContainerExists && currentAdventureId && currentAdventureId !== initializedAdventureId) {
        Utils.printNeat(`Loading adventure with ID: ${currentAdventureId}`);
        initializedAdventureId = currentAdventureId;
        document.getElementById('portrait-hover-tooltip')?.classList.remove('visible');
        loadAndApplyAdventureData();
    } else if (!currentAdventureId && initializedAdventureId !== null) {
        Utils.printNeat(`Left adventure with ID: ${initializedAdventureId}.`);
        initializedAdventureId = null;
    }
});

adventureChangeObserver.observe(document.body, {
    childList: true,
    subtree: true
});
