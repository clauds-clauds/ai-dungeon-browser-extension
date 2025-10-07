"use strict";

class TextEffects {
    static #cachedRegex = null;

    /**
     * Pings the text effects to update them.
     * @param {*} hardRefresh Whether to do a hard refresh (remove all existing highlights and reapply).
     * @return {void}
    */
    static ping(hardRefresh = false) {
        // Print out a message to the console for debugging purposes.
        CustomDebugger.say("Pinging text effects" + (hardRefresh ? " with hard refresh." : "."), true);

        // Disconnect the mutation observer to prevent infinite loops.
        if (mutationObserver) mutationObserver.disconnect();

        // If a hard refresh is requested, remove all existing highlights and attributes.
        if (hardRefresh) {
            document.querySelectorAll('.entity-highlight').forEach(span => {
                const parent = span.parentElement;
                if (parent) {
                    const text = span.textContent || '';
                    parent.replaceChild(document.createTextNode(text), span);
                    parent.normalize();
                }
            });

            // Remove the attributes too.
            document.querySelectorAll('[text-effect-entity]').forEach(el => el.removeAttribute('text-effect-entity'));

            // Build the regex pattern anew.
            this.#regexify();
        }

        // Find all nodes that need text effects applied.
        const nodes = document.querySelectorAll(`${Configuration.ID_ADVENTURE_TEXT}:not([text-effect-entity])`);

        // Apply text effects to each node.
        for (const node of nodes) {
            // Mark the node as processed.
            node.setAttribute('text-effect-entity', 'true');
            TextEffects.#apply(node); // Apply text effects.
        }

        // Reconnect the mutation observer.
        if (mutationObserver) mutationObserver.observe(document.body, { childList: true, subtree: true });
    }

    /**
     * Generates a regex pattern for matching text effects.
     * @returns {RegExp|null} The generated regex or null if no entities exist.
    */
    static #regexify () {
        // Print out a message to the console for debugging purposes.
        CustomDebugger.say("Generating regex for text effects.");

        // Get the cached entities.
        const entities = PersistentStorage.cache.entities;
        if (!entities || entities.length === 0) return null;

        // Create a set of all unique triggers (names and additional triggers).
        const allTriggers = [...new Set(entities.flatMap(entity => [entity.name, ...(entity.triggers || [])]).filter(Boolean))];
        if (allTriggers.length === 0) return null;

        // Build the regex pattern for matching.
        const pattern = allTriggers.map(Utilities.escapeRegExp).join('|');
        const includeColon = PersistentStorage.getSetting('textEffectsColon', false);

        // Build the final regex pattern.
        let finalPattern = `(${pattern})('s)?`;
        let regex;

        if (includeColon) regex = new RegExp(`\\b${finalPattern}(:)?(?![\\w'])`, 'gi');
        else regex = new RegExp(`\\b${finalPattern}\\b`, 'gi');

        this.#cachedRegex = regex;
        return regex;
    }

    /**
     * Merges adjacent tiny spans created by AI Dungeon to allow for multi-word matching.
     * @param {*} root The root element to start merging from.
     * @returns {void}
    */
    static #merge(root) {
        // Find all the teensy little spans.
        const itsyBitsySpans = root.querySelectorAll('span#game-backdrop-saturate[aria-hidden="true"]');
        if (itsyBitsySpans.length === 0) return; // Nothing to merge.

        // Collect unique parents of these spans.
        const parents = new Set();

        // Find parents of the spans.
        itsyBitsySpans.forEach(span => {
            const parent = span.parentElement;
            if (!parent || parent.dataset.textEffectsMerged === 'true') return;
            parents.add(parent);
        });

        // Merge the spans within each parent.
        parents.forEach(parent => {
            const fragments = Array.from(parent.childNodes);
            const mergeable = fragments.every(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    return node.matches('span#game-backdrop-saturate[aria-hidden="true"]');
                }
                if (node.nodeType === Node.TEXT_NODE) {
                    return !node.textContent || node.textContent.trim() === '';
                }
                return false;
            });
            if (!mergeable) return;

            // Combine all fragments into one text node.
            const combined = fragments.map(node => node.textContent ?? '').join('');
            parent.textContent = combined;
            parent.dataset.textEffectsMerged = 'true';
        });
    }

    /**
     * Applies markdown-like formatting to a node.
     * @param {*} node The node which will become Mark, formatter of the known universe.
     * @returns {void}
    */
    static #markdownize(node) {
        // Check if experimental markdown formatting is enabled and that we're not in the action text.
        if (!PersistentStorage.getSetting('experimentalMarkdownFormatting', false) || node.id === 'action-text') return;

        // Get the inner HTML of the node.
        let inner = node.innerHTML;

        // Do the replacements for markdown-like syntaxy.
        inner = inner.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        inner = inner.replace(/\*(.*?)\*/g, '<em>$1</em>');
        inner = inner.replace(/\+\+(.*?)\+\+/g, '<u>$1</u>');
        inner = inner.replace(/~~(.*?)~~/g, '<s>$1</s>');

        // Set the modified HTML back to the node.
        node.innerHTML = inner;
    }

    /**
     * Applies text effects to a node.
     * @param {*} node The node to apply text effects to.
     * @returns {void}
    */
    static #apply(node) {
        // Return if the node is invalid or text effects are disabled.
        if (!node || !(node instanceof Node)) return;
        if (!PersistentStorage.getSetting('textEffectsEnabled', true)) return;

        // If the node is an element, merge tiny spans and apply markdown formatting.
        if (node instanceof Element) {
            this.#merge(node);
            this.#markdownize(node);
        }

        // Get the regex pattern, using the cached version if available.
        let regex = this.#cachedRegex != null ? this.#cachedRegex : this.#regexify();
        if (!regex) return; // No regex means no entities to match.

        // Use a tree walker thingy to find all text nodes within the given node.
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        const textNodes = []; // Array to hold text nodes.
        let currentNode; // The current node being processed.

        // Collect all text nodes that are not already highlighted.
        while (currentNode = walker.nextNode()) {
            if (currentNode.parentElement && !currentNode.parentElement.closest('.entity-highlight')) {
                textNodes.push(currentNode); // Add to the list if not already highlighted.
            }
        }

        // Process each text node to apply highlights.
        for (const textNode of textNodes) {
            // Get the original text content.
            const originalText = textNode.textContent;
            if (!originalText || !regex.test(originalText)) continue;

            // Create a document fragment to build the new content.
            const fragment = document.createDocumentFragment();
            let lastIndex = 0;
            let match;
            regex.lastIndex = 0;

            // Find all matches in the text node.
            while ((match = regex.exec(originalText)) !== null) {
                const matchedName = match[1];
                const fullMatch = match[0];

                const entity = PersistentStorage.cache.entities.find(e =>
                    e.name?.toLowerCase() === matchedName.toLowerCase() ||
                    e.triggers?.some(k => k.toLowerCase() === matchedName.toLowerCase())
                );

                if (!entity) continue;

                const isAction = !!textNode.parentElement.closest('#action-text');

                if (isAction) {
                    if (!PersistentStorage.getSetting('textEffectsAction', true)) continue;
                    if (entity.restriction === 'story') continue;
                } else {
                    if (!PersistentStorage.getSetting('textEffectsStory', true)) continue;
                    if (entity.restriction === 'action') continue;
                }

                if (match.index > lastIndex) {
                    fragment.appendChild(document.createTextNode(originalText.substring(lastIndex, match.index)));
                }

                const span = Create.highlightSpan(entity, fullMatch);
                fragment.appendChild(span);

                lastIndex = regex.lastIndex;
            }

            if (lastIndex < originalText.length) {
                fragment.appendChild(document.createTextNode(originalText.substring(lastIndex)));
            }

            if (fragment.childNodes.length > 0) {
                textNode.parentElement.replaceChild(fragment, textNode);
            }
        }
    }
}