'use strict';

const menuObserver = new MutationObserver(() => {
    const buttonHandlers = {
        onCharactersClick: () => setupCharacterEditor(),
        onNotesClick: () => console.log("Notes clicked"),
        onShareClick: () => console.log("Share clicked"),
        onHelpClick: () => window.open('https://help.aidungeon.com/faq', '_blank')
    };
    addCustomButtons(buttonHandlers);
});
menuObserver.observe(document.body, { childList: true, subtree: true });


(async function () {
    // Watches for page changes and story stuff.
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

    // Watches on storage changes and refreshes.
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local') {
            const adventureId = getAdventureId();
            if (adventureId && changes[adventureId]) {
                reapplyAllHighlights();
            }
        }
    });

    await loadCharacterData();
    applyHighlights();
    highlightObserver.observe(document.body, { childList: true, subtree: true });
})();