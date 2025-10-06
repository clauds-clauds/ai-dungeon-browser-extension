"use strict";

class TextEffects {
    static #cachedRegex = null;
    static #cachedTriggers = null;

    static invalidateCache() {
        this.#cachedRegex = null;
        this.#cachedTriggers = null;
        CustomDebugger.say("Invalidated text effects cache.", true);
    }

    static #getRegex() {
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

        const regex = this.#getRegex();
        if (!regex) return;

        const entities = PersistentStorage.cache.entities;
        if (!entities || entities.length === 0) return;

        const fullText = node.textContent;
        if (!fullText) return;

        regex.lastIndex = 0;
        let match;
        const matches = [];
        while ((match = regex.exec(fullText)) !== null) {
            matches.push(match);
        }

        if (matches.length === 0) return;

        for (const match of matches.reverse()) {
            const matchedName = match[1];
            const fullMatchText = match[0];
            const startIndex = match.index;
            const endIndex = startIndex + fullMatchText.length;

            const entity = entities.find(e =>
                e.name?.toLowerCase() === matchedName.toLowerCase() ||
                e.triggers?.some(k => k.toLowerCase() === matchedName.toLowerCase())
            );

            if (!entity) continue;

            const isAction = !!node.closest('#action-text');
            if (isAction) {
                if (!PersistentStorage.getSetting('textEffectsAction', true)) continue;
                if (entity.restriction === 'story') continue;
            } else {
                if (!PersistentStorage.getSetting('textEffectsStory', true)) continue;
                if (entity.restriction === 'action') continue;
            }

            const range = document.createRange();
            let charIndex = 0;
            let startNode, startOffset, endNode, endOffset;

            const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
            let textNode;

            while (textNode = walker.nextNode()) {
                if (textNode.parentElement.closest('.entity-highlight')) continue;

                const textLength = textNode.length;
                const nodeStart = charIndex;
                const nodeEnd = charIndex + textLength;

                if (!startNode && startIndex >= nodeStart && startIndex < nodeEnd) {
                    startNode = textNode;
                    startOffset = startIndex - nodeStart;
                }
                if (!endNode && endIndex > nodeStart && endIndex <= nodeEnd) {
                    endNode = textNode;
                    endOffset = endIndex - nodeStart;
                }

                charIndex = nodeEnd;
                if (startNode && endNode) break;
            }

            if (startNode && endNode) {
                range.setStart(startNode, startOffset);
                range.setEnd(endNode, endOffset);

                const span = this.#createHighlightSpan(entity, range.toString());
                range.deleteContents();
                range.insertNode(span);
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
            const color = entity.colorMode === 'special' && entity.color
                ? entity.color
                : PersistentStorage.getSetting('themeColor', '#f8ad2a');
            span.style.color = color;
        }

        return span;
    }
}