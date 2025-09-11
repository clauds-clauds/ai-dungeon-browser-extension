/**
 * highlight.js
 *
 * This script is responsible for finding character names in the AI Dungeon story
 * and prepending their portrait image. It listens for new content and
 * automatically applies highlights.
 */

(async function () {
    'use strict';

    // This is the selector for story content blocks, based on your reference file.
    const STORY_CONTAINER_SELECTOR = '#transition-opacity';
    let characterData = [];

    /**
     * Gets the unique adventure ID from the current URL.
     * @returns {string|null} The adventure ID or null if not found.
     */
    function getAdventureId() {
        const match = window.location.pathname.match(/adventure\/([^\/]+)/);
        return match ? match[1] : null;
    }

    /**
     * Loads the character data from chrome.storage for the current adventure.
     */
    async function loadCharacterData() {
        const adventureId = getAdventureId();
        if (!adventureId) {
            characterData = [];
            return;
        }
        const storageData = await chrome.storage.local.get(adventureId);
        characterData = storageData[adventureId] || [];
    }

    /**
     * Escapes special characters in a string for use in a regular expression.
     * @param {string} str The string to escape.
     * @returns {string} The escaped string.
     */
    function escapeRegExp(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Traverses a DOM node, finds text nodes, and replaces character names
     * with a span containing their portrait and name.
     * @param {Node} node The parent node to process.
     */
    function highlightNamesInNode(node) {
        if (!characterData || characterData.length === 0) return;

        // Create a single, efficient regex to find all character names and nicknames.
        const allNames = characterData.flatMap(char => [char.name, ...(char.nicknames || [])]).filter(Boolean);
        if (allNames.length === 0) return;
        const pattern = allNames.map(name => escapeRegExp(name)).join('|');
        const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');

        // A TreeWalker is the safest way to modify text without breaking existing HTML (like italics/bold).
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        const textNodesToProcess = [];
        let currentNode;
        while (currentNode = walker.nextNode()) {
            // Avoid highlighting text that is already part of a highlight.
            if (currentNode.parentElement && !currentNode.parentElement.closest('.character-highlight')) {
                textNodesToProcess.push(currentNode);
            }
        }

        // Process the collected nodes.
        for (const textNode of textNodesToProcess) {
            const originalText = textNode.textContent;
            if (!regex.test(originalText)) continue;

            const fragment = document.createDocumentFragment();
            let lastIndex = 0;
            let match;

            // Reset regex from last run
            regex.lastIndex = 0;

            while ((match = regex.exec(originalText)) !== null) {
                const matchedName = match[0];
                const char = characterData.find(c =>
                    matchedName.toLowerCase() === c.name.toLowerCase() ||
                    (c.nicknames || []).some(nick => nick.toLowerCase() === matchedName.toLowerCase())
                );

                if (!char) continue;

                // 1. Append the text before the matched name.
                if (match.index > lastIndex) {
                    fragment.appendChild(document.createTextNode(originalText.substring(lastIndex, match.index)));
                }

                // 2. Create and append the new highlighted element.
                const span = document.createElement('span');
                span.className = 'character-highlight';
                span.style.color = char.color || 'inherit'; // Use character color.

                if (char.portraitUrl) {
                    const img = document.createElement('img');
                    img.src = char.portraitUrl;
                    img.className = 'character-portrait';
                    img.alt = char.name;
                    span.appendChild(img);
                }

                span.appendChild(document.createTextNode(matchedName)); // The name itself.
                fragment.appendChild(span);
                lastIndex = regex.lastIndex;
            }

            // 3. Append any remaining text after the last match.
            if (lastIndex < originalText.length) {
                fragment.appendChild(document.createTextNode(originalText.substring(lastIndex)));
            }

            // 4. Replace the original text node with our new fragment.
            if (fragment.childNodes.length > 0) {
                textNode.parentElement.replaceChild(fragment, textNode);
            }
        }
    }

    /**
     * Finds all story containers that haven't been processed yet and applies highlights.
     */
    function applyHighlights() {
        const storyContainers = document.querySelectorAll(`${STORY_CONTAINER_SELECTOR}:not([data-chars-highlighted])`);
        for (const container of storyContainers) {
            container.setAttribute('data-chars-highlighted', 'true');
            highlightNamesInNode(container);
        }
    }

    /**
     * Re-applies highlights to the entire document. Useful when character data changes.
     */
    async function reapplyAllHighlights() {
        await loadCharacterData();

        // First, unwrap any existing highlights to return to plain text.
        document.querySelectorAll('.character-highlight').forEach(span => {
            const parent = span.parentElement;
            if (parent) {
                const text = span.textContent || '';
                parent.replaceChild(document.createTextNode(text), span);
                parent.normalize(); // Merges adjacent text nodes for cleanup.
            }
        });

        // Mark all containers as needing processing again.
        document.querySelectorAll('[data-chars-highlighted]').forEach(el => el.removeAttribute('data-chars-highlighted'));

        // Re-run the highlighting process.
        applyHighlights();
    }

    // --- Initialization and Observers ---

    // Set up a MutationObserver to watch for new story content being added to the page.
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length > 0) {
                // Check if any added nodes are or contain our story containers.
                const hasNewContent = Array.from(mutation.addedNodes).some(node =>
                    node.nodeType === Node.ELEMENT_NODE && (node.matches(STORY_CONTAINER_SELECTOR) || node.querySelector(STORY_CONTAINER_SELECTOR))
                );
                if (hasNewContent) {
                    // Use a small delay to ensure content is fully rendered.
                    setTimeout(applyHighlights, 100);
                    break;
                }
            }
        }
    });

    // Listen for storage changes. If character data is updated, re-run highlighting.
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local') {
            const adventureId = getAdventureId();
            if (adventureId && changes[adventureId]) {
                reapplyAllHighlights();
            }
        }
    });

    // Initial run when the script is first loaded.
    await loadCharacterData();
    applyHighlights();
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();