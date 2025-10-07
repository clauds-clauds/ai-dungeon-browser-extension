"use strict";

class TextEffects {
    static #cachedRegex = null;
    static #cachedTriggers = null;

    static ping(hardRefresh = false) {
        CustomDebugger.say("Pinging text effects" + (hardRefresh ? " with hard refresh." : "."), true);

        if (hardRefresh) {
            document.querySelectorAll('.entity-highlight').forEach(span => {
                const parent = span.parentElement;
                if (parent) {
                    const text = span.textContent || '';
                    parent.replaceChild(document.createTextNode(text), span);
                    parent.normalize();
                }
            });

            document.querySelectorAll('[text-effect-entity]').forEach(el => el.removeAttribute('text-effect-entity'));
        }

        const nodes = document.querySelectorAll(`${Configuration.ID_ADVENTURE_TEXT}:not([text-effect-entity])`);

        for (const node of nodes) {
            node.setAttribute('text-effect-entity', 'true');
            TextEffects.#apply(node);
        }
    }

    /**
     * Invalidates the cached regex and triggers.
    */
    static invalidate() {
        this.#cachedRegex = null;
        this.#cachedTriggers = null;
        CustomDebugger.say("Invalidated text effects regex cache.", true);
    }

    /**
     * Caches the regex for text effects.
     * @returns {RegExp|null} The cached or newly built regex for text effects, or null if no triggers exist.
     */
    static #cacheRegex() {
        if (this.#cachedRegex) return this.#cachedRegex;

        const entities = PersistentStorage.cache.entities;

        if (!entities || entities.length === 0) return null;

        this.#cachedTriggers = [...new Set(entities.flatMap(entity => [entity.name, ...(entity.triggers || [])]).filter(Boolean))];
        if (this.#cachedTriggers.length === 0) return null;

        const pattern = this.#cachedTriggers.map(Utilities.escapeRegExp).join('|');
        const includeColon = PersistentStorage.getSetting('textEffectsColon', false);
        let finalPattern = `(${pattern})('s)?`;

        this.#cachedRegex = includeColon
            ? new RegExp(`\\b${finalPattern}(:)?(?![\\w'])`, 'gi')
            : new RegExp(`\\b${finalPattern}\\b`, 'gi');

        CustomDebugger.say("Text Effects regex rebuilt and cached.", true);
        return this.#cachedRegex;
    }

    /**
     * Applies text effects to the specified node.
     * @param {*} node The node to apply text effects to.
     * @returns {void}
    */
    static #apply(node) {
        // Check if the thing needs to be done.
        if (!node || !(node instanceof Node)) return;
        if (!PersistentStorage.getSetting('textEffectsEnabled', true)) return; // Return if disabled.

        // Attempt to merge any existing spans first.
        if (node instanceof Element) this.#mergeResponse(node);

        // Get or build the regex.
        const regex = this.#cacheRegex();
        if (!regex) return; // Return if no regex).

        // Get entities from cache.
        const entities = PersistentStorage.cache.entities;
        if (!entities || entities.length === 0) return; // Return if there are no entities.

        // Get the full text content of the node.
        const fullText = node.textContent;
        if (!fullText) return; // Return if there's no text.

        // Find all entity matches in the text.
        regex.lastIndex = 0;
        let match;
        const matches = [];
        while ((match = regex.exec(fullText)) !== null) {
            matches.push(match);
        }

        // Return if no matches.
        if (matches.length === 0) return;

        // Process matches in reverse order to avoid messing up our beautiful indices.
        for (const match of matches.reverse()) {
            // Set start and end indices plus some other thingies.
            const matchedName = match[1];
            const fullMatchText = match[0];
            const startIndex = match.index;
            const endIndex = startIndex + fullMatchText.length;

            // Find the entity that matches the found text.
            const entity = entities.find(e =>
                e.name?.toLowerCase() === matchedName.toLowerCase() ||
                e.triggers?.some(k => k.toLowerCase() === matchedName.toLowerCase())
            );

            // If no entity found, skip it.
            if (!entity) continue;

            // Determine if we're in action or story text.
            const isAction = !!node.closest('#action-text');

            // Check settings and restrictions.
            if (isAction) {
                if (!PersistentStorage.getSetting('textEffectsAction', true)) continue;
                if (entity.restriction === 'story') continue;
            } else {
                if (!PersistentStorage.getSetting('textEffectsStory', true)) continue;
                if (entity.restriction === 'action') continue;
            }

            // Now we need to find the exact text nodes that correspond to our match.
            const range = document.createRange();
            let charIndex = 0;
            let startNode, startOffset, endNode, endOffset;

            // Use a tree walker to traverse text nodes.
            const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
            let textNode;

            // Find the start and end text nodes and offsets.
            while (textNode = walker.nextNode()) {
                if (textNode.parentElement.closest('.entity-highlight')) continue; // Skip if already highlighted.

                // Get the length of the text node.
                const textLength = textNode.length;
                const nodeStart = charIndex;
                const nodeEnd = charIndex + textLength;

                // Check if the start index is within this text node.
                if (!startNode && startIndex >= nodeStart && startIndex < nodeEnd) {
                    startNode = textNode;
                    startOffset = startIndex - nodeStart;
                }

                // Check if the end index is within this text node.
                if (!endNode && endIndex > nodeStart && endIndex <= nodeEnd) {
                    endNode = textNode;
                    endOffset = endIndex - nodeStart;
                }

                // Update the character index for the next iteration.
                charIndex = nodeEnd;
                if (startNode && endNode) break; // Break if both nodes are found.
            }

            // If we found both nodes, create the range and wrap it in a span.
            if (startNode && endNode) {
                range.setStart(startNode, startOffset);
                range.setEnd(endNode, endOffset);

                const span = Create.highlightSpan(entity, range.toString());
                range.deleteContents();
                range.insertNode(span);
            }
        }
    }

    /**
     * Merges the text content of AI response spans.
     * @param {*} root The root element to start merging from.
     * @returns {void}
    */
    static #mergeResponse(root) {
        const tokenSpans = root.querySelectorAll('span#game-backdrop-saturate[aria-hidden="true"]');
        if (tokenSpans.length === 0) return;

        const parents = new Set();
        tokenSpans.forEach(span => {
            const parent = span.parentElement;
            if (!parent || parent.dataset.textEffectsMerged === 'true') return;
            parents.add(parent);
        });

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

            const combined = fragments.map(node => node.textContent ?? '').join('');
            parent.textContent = combined;
            parent.dataset.textEffectsMerged = 'true';
        });
    }
}