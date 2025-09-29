"use strict";

class TextEffects {
    /**
     * Applies all text effects to a given node.
     * @param {HTMLElement} node The node to apply effects to.
     */
    static applyToTextContainer(node) {
        if (!node || !(node instanceof Node)) return;
        if (!Storage.getVariable('textEffectsEnabled', true)) return;

        const entities = Storage.cache.entities;
        if (!entities || entities.length === 0) return;

        // Gather all unique, non-empty keywords and names from entities.
        const allTriggers = [...new Set(entities.flatMap(entity => [entity.name, ...(entity.keywords || [])]).filter(Boolean))];
        if (allTriggers.length === 0) return;

        // Create a regex pattern to match all triggers.
        const pattern = allTriggers.map(Utils.escapeRegExp).join('|');
        const regex = new RegExp(`\\b(${pattern})('s)?\\b`, 'gi');

        // Use TreeWalker to find all text nodes.
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        const textNodes = [];
        let currentNode;
        while (currentNode = walker.nextNode()) {
            if (currentNode.parentElement && !currentNode.parentElement.closest('.entity-highlight')) {
                textNodes.push(currentNode);
            }
        }

        // Process each text node.
        for (const textNode of textNodes) {
            const originalText = textNode.textContent;
            if (!originalText || !regex.test(originalText)) continue;

            const fragment = document.createDocumentFragment();
            let lastIndex = 0;
            let match;
            regex.lastIndex = 0; // Reset regex state for each text node.

            while ((match = regex.exec(originalText)) !== null) {
                const matchedName = match[1];
                const fullMatch = match[0];

                // Find the entity by name or keyword (case-insensitive).
                const entity = entities.find(e =>
                    e.name?.toLowerCase() === matchedName.toLowerCase() ||
                    e.keywords?.some(k => k.toLowerCase() === matchedName.toLowerCase())
                );

                if (!entity) continue; // No matching entity found.

                if (entity.highlightRestriction === 'action-only') {
                    if (!textNode.parentElement.closest('#action-text')) continue;
                } else if (entity.highlightRestriction === 'story-only') {
                    if (textNode.parentElement.closest('#action-text')) continue;
                }

                // Add preceding text.
                if (match.index > lastIndex) {
                    fragment.appendChild(document.createTextNode(originalText.substring(lastIndex, match.index)));
                }

                // Create the highlight span.
                const span = this.#createHighlightSpan(entity, fullMatch);
                fragment.appendChild(span);

                lastIndex = regex.lastIndex;
            }

            // Add any remaining text after the last match.
            if (lastIndex < originalText.length) {
                fragment.appendChild(document.createTextNode(originalText.substring(lastIndex)));
            }

            // Replace the original text node with the new fragment.
            if (fragment.childNodes.length > 0) {
                textNode.parentElement.replaceChild(fragment, textNode);
            }
        }
    }

    static applyToAdventure(expensiveRefresh = false) {
        const nodes = expensiveRefresh
            ? document.querySelectorAll(Config.IDENTIFIER_CONTAINER_ADVENTURE_TEXT)
            : document.querySelectorAll(`${Config.IDENTIFIER_CONTAINER_ADVENTURE_TEXT}:not([text-effect-entity])`);

        for (const node of nodes) {
            node.setAttribute('text-effect-entity', 'true');
            TextEffects.applyToTextContainer(node);
        }
    }

    static async reloadAndApplyToAdventure() {
        document.querySelectorAll('.entity-highlight').forEach(span => {
            const parent = span.parentElement;
            if (parent) {
                const text = span.textContent || '';
                parent.replaceChild(document.createTextNode(text), span);
                parent.normalize();
            }
        });

        document.querySelectorAll('[text-effect-entity]').forEach(el => el.removeAttribute('text-effect-entity'));
        this.applyToAdventure();
    }

    /**
     * Creates a styled span element for a highlighted entity.
     * @param {object} entity The entity object.
     * @param {string} text The text content for the span.
     * @returns {HTMLElement} The created span element.
     */
    static #createHighlightSpan(entity, text) {
        const span = document.createElement('span');
        span.className = 'entity-highlight';
        span.dataset.entityId = entity.id;
        span.textContent = text;

        // Apply icon if enabled and available.
        if (Storage.getVariable('textEffectsIcon', true) && entity.icons?.length > 0) {
            const iconIndex = entity.currentIcon || 0;
            const iconUrl = entity.icons[iconIndex];
            if (iconUrl) {
                const img = document.createElement('img');
                img.src = iconUrl;
                img.className = 'entity-text-icon';
                img.alt = entity.name;
                span.insertBefore(img, span.firstChild);
            }
        }

        // Apply text styling from settings.
        if (Storage.getVariable('textEffectsBold', true)) {
            span.style.fontWeight = 'bold';
        }

        if (Storage.getVariable('textEffectsColor', true)) {
            // Use special color or default color based on entity settings.
            const color = entity.highlightMode === 'special' && entity.highlightColor
                ? entity.highlightColor
                : Storage.getVariable('textEffectsColorGlobal', 'rgba(200, 170, 100, 1)');
            span.style.color = color;
        }

        return span;
    }
}