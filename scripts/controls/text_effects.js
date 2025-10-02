"use strict";

class TextEffects {
    static ping(hardRefresh = false) {
        CustomDebugger.say("Pinging text effects" + (hardRefresh ? " with hard refresh." : "."), true);

        if(hardRefresh) {
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

        const nodes =document.querySelectorAll(`${Configuration.ID_ADVENTURE_TEXT}:not([text-effect-entity])`);

        for (const node of nodes) {
            node.setAttribute('text-effect-entity', 'true');
            TextEffects.#apply(node);
        }
    }

    static #apply(node) {
        if (!node || !(node instanceof Node)) return;
        if (!PersistentStorage.getSetting('textEffectsEnabled', true)) return;

        const entities = PersistentStorage.cache.entities;
        if (!entities || entities.length === 0) return;

        const allTriggers = [...new Set(entities.flatMap(entity => [entity.name, ...(entity.triggers || [])]).filter(Boolean))];
        if (allTriggers.length === 0) return;

        const pattern = allTriggers.map(Utilities.escapeRegExp).join('|');
        const regex = new RegExp(`\\b(${pattern})('s)?\\b`, 'gi');

        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        const textNodes = [];
        let currentNode;
        while (currentNode = walker.nextNode()) {
            if (currentNode.parentElement && !currentNode.parentElement.closest('.entity-highlight')) {
                textNodes.push(currentNode);
            }
        }

        for (const textNode of textNodes) {
            const originalText = textNode.textContent;
            if (!originalText || !regex.test(originalText)) continue;

            const fragment = document.createDocumentFragment();
            let lastIndex = 0;
            let match;
            regex.lastIndex = 0;

            while ((match = regex.exec(originalText)) !== null) {
                const matchedName = match[1];
                const fullMatch = match[0];

                const entity = entities.find(e =>
                    e.name?.toLowerCase() === matchedName.toLowerCase() ||
                    e.triggers?.some(k => k.toLowerCase() === matchedName.toLowerCase())
                );

                if (!entity) continue;

                if (entity.restriction === 'action') {
                    if (!textNode.parentElement.closest('#action-text')) continue;
                } else if (entity.restriction === 'story') {
                    if (textNode.parentElement.closest('#action-text')) continue;
                }

                if (match.index > lastIndex) {
                    fragment.appendChild(document.createTextNode(originalText.substring(lastIndex, match.index)));
                }

                const span = this.#createHighlightSpan(entity, fullMatch);
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

    static #createHighlightSpan(entity, text) {
        const span = document.createElement('span');
        span.className = 'entity-highlight';
        span.dataset.entityId = entity.id;
        span.textContent = text;

        if (PersistentStorage.getSetting('textEffectsIcons', true) && entity.icons?.length > 0) {
            const icon = entity.icons.find(i => i.isPinned) || entity.icons[0];
            if (icon?.url) {
                const img = document.createElement('img');
                img.src = icon.url;
                img.className = 'entity-text-icon';
                img.alt = entity.name;
                span.insertBefore(img, span.firstChild);
            }
        }

        if (PersistentStorage.getSetting('textEffectsBold', true)) {
            span.style.fontWeight = 'bold';
        }

        if (PersistentStorage.getSetting('textEffectsColor', true)) {
            const color = entity.highlightMode === 'special' && entity.color
                ? entity.color
                : PersistentStorage.getSetting('textEffectsGlobalColor', '#f8ae2c');
            span.style.color = color;
        }

        return span;
    }
}