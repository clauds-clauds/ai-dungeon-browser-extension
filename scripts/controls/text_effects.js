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

        const baseRegex = this.#getRegex();
        if (!baseRegex) return;

        const entities = PersistentStorage.cache.entities;
        if (!entities || entities.length === 0) return;

        const walker = document.createTreeWalker(
            node,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode(textNode) {
                    const parent = textNode.parentElement;
                    if (!parent) return NodeFilter.FILTER_REJECT;
                    if (parent.closest('.entity-highlight')) return NodeFilter.FILTER_REJECT;
                    return textNode.textContent ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                }
            }
        );

        const segments = [];
        let aggregatedText = '';
        let currentNode;

        while ((currentNode = walker.nextNode())) {
            const value = currentNode.textContent;
            if (!value) continue;

            segments.push({
                node: currentNode,
                start: aggregatedText.length,
                end: aggregatedText.length + value.length,
                length: value.length
            });

            aggregatedText += value;
        }

        if (!aggregatedText) return;

        const regex = new RegExp(baseRegex.source, baseRegex.flags);
        const matches = [];
        let match;

        while ((match = regex.exec(aggregatedText)) !== null) {
            const matchedName = match[1];

            const entity = entities.find(e =>
                e.name?.toLowerCase() === matchedName.toLowerCase() ||
                e.triggers?.some(k => k.toLowerCase() === matchedName.toLowerCase())
            );

            if (!entity) continue;

            const matchStart = match.index;
            const matchEnd = match.index + match[0].length;
            const matchSegments = this.#collectMatchSegments(segments, matchStart, matchEnd);
            if (!matchSegments.length) continue;

            const isAction = !!matchSegments[0].node.parentElement?.closest('#action-text');

            if (isAction) {
                if (!PersistentStorage.getSetting('textEffectsAction', true)) continue;
                if (entity.restriction === 'story') continue;
            } else {
                if (!PersistentStorage.getSetting('textEffectsStory', true)) continue;
                if (entity.restriction === 'action') continue;
            }

            matches.push({ segments: matchSegments, entity });
        }

        for (let i = matches.length - 1; i >= 0; i--) {
            const { segments: matchSegments, entity } = matches[i];
            for (let j = matchSegments.length - 1; j >= 0; j--) {
                const segment = matchSegments[j];
                const includeIcon = j === 0;
                this.#wrapSegment(segment, entity, includeIcon);
            }
        }
    }

    static #collectMatchSegments(segments, matchStart, matchEnd) {
        const pieces = [];
        for (const segment of segments) {
            if (segment.end <= matchStart) continue;
            if (segment.start >= matchEnd) break;

            const startOffset = Math.max(0, matchStart - segment.start);
            const endOffset = Math.min(segment.length, matchEnd - segment.start);
            if (endOffset <= startOffset) continue;

            pieces.push({
                node: segment.node,
                startOffset,
                endOffset
            });
        }
        return pieces;
    }

    static #wrapSegment(segment, entity, includeIcon) {
        const { node, startOffset, endOffset } = segment;
        if (!node || startOffset === endOffset) return;

        const range = document.createRange();
        range.setStart(node, startOffset);
        range.setEnd(node, endOffset);

        const extracted = range.extractContents();
        const span = this.#createHighlightSpan(entity, null, includeIcon);
        span.appendChild(extracted);
        range.insertNode(span);
    }

    static #createHighlightSpan(entity, text = null, includeIcon = true) {
        const span = document.createElement('span');
        span.className = 'entity-highlight';
        span.dataset.entityId = entity.id;

        if (text !== null && text !== undefined) {
            span.textContent = text;
        }

        if (includeIcon && PersistentStorage.getSetting('textEffectsIcons', true) && entity.icons?.length > 0) {
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