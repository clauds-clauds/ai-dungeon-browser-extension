'use strict';

class TextEffects {
    static highlightNames(node) {
        if (!Store.data.characters || Store.data.characters.length === 0) return;

        const allNames = Store.data.characters.flatMap(char => [char.name, ...(char.nicknames || [])]).filter(Boolean);
        if (allNames.length === 0) return;

        const pattern = allNames.map(name => Utils.escapeRegExp(name)).join('|');
        const regex = new RegExp(`\\b(${pattern})('s)?\\b`, 'gi');

        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        const textNodesToProcess = [];
        let currentNode;

        while (currentNode = walker.nextNode()) {
            if (currentNode.parentElement && !currentNode.parentElement.closest('.character-highlight')) {
                textNodesToProcess.push(currentNode);
            }
        }

        for (const textNode of textNodesToProcess) {
            const originalText = textNode.textContent;
            if(!originalText || originalText.trim() === '') continue; // Skip empty or whitespace-only text nodes.

            if (!regex.test(originalText)) continue;

            const fragment = document.createDocumentFragment();
            let lastIndex = 0;
            let match;
            regex.lastIndex = 0;

            while ((match = regex.exec(originalText)) !== null) {
                const fullMatch = match[0];
                const baseName = match[1];

                const char = Store.data.characters.find(c =>
                    baseName.toLowerCase() === c.name.toLowerCase() ||
                    (c.nicknames || []).some(nick => nick.toLowerCase() === baseName.toLowerCase())
                );

                if (!char) continue;

                // This is to prevent the excessive `You` spam.
                if (char.pickMode === 'action') {
                    if (!textNode.parentElement.closest('#action-text')) { // Only highlight in action text area.
                        continue;
                    }
                }

                if (match.index > lastIndex) {
                    fragment.appendChild(document.createTextNode(originalText.substring(lastIndex, match.index)));
                }

                const span = document.createElement('span');
                span.className = 'character-highlight';
                span.dataset.charId = char.id;

                span.addEventListener('mouseenter', (e) => {
                    if (!Store.data.settings.visiblePortraits) return;

                    const tooltip = document.getElementById('portrait-hover-tooltip');
                    if (tooltip.classList.contains('visible')) return; // This is for locking the tooltip. Pretty required.

                    clearTimeout(hideTooltipTimeout);
                    if (!char.portraits || char.portraits.length === 0) return;

                    tooltip.portraits = [...char.portraits];
                    tooltip.originalChar = char;
                    tooltip.sourceSpan = e.target;

                    const img = tooltip.querySelector('img');
                    const activePortrait = char.portraits[0];
                    tooltip.currentIndex = 0;
                    img.src = Utils.sanitizeUrl(activePortrait?.fullUrl || activePortrait?.iconUrl);

                    const navButtons = tooltip.querySelectorAll('.tooltip-nav-btn');
                    navButtons.forEach(btn => {
                        btn.style.display = char.portraits.length > 1 ? 'flex' : 'none';
                    });

                    const rect = e.target.getBoundingClientRect();
                    tooltip.style.left = `${rect.left + rect.width / 2}px`;
                    tooltip.style.top = `${rect.top}px`;
                    tooltip.style.transform = `translate(-50%, -100%) translateY(-10px)`;
                    tooltip.classList.add('visible');
                });

                span.addEventListener('mouseleave', () => {
                    hideTooltipTimeout = setTimeout(() => {
                        const tooltip = document.getElementById('portrait-hover-tooltip');
                        if (tooltip) tooltip.classList.remove('visible');
                    }, Store.data.settings.tooltipHideDelay);
                });

                let formatText = true;

                if (Store.data.settings.visibleIcons && char.portraits && char.portraits.length > 0) {
                    const parentText = textNode.parentElement.textContent;
                    const isDialogue = parentText.includes('"');

                    let showIcon = true;

                    if (isDialogue && !Store.data.settings.visibleIconsDialogue) {
                        showIcon = false;
                        if (!Store.data.settings.textFormatDialogue) formatText = false;
                    } else if (!isDialogue && !Store.data.settings.visibleIconsStory) {
                        showIcon = false;
                        if (!Store.data.settings.textFormatStory) formatText = false;
                    }

                    if (showIcon) {
                        const img = document.createElement('img');
                        const activePortrait = char.portraits[char.activePortraitIndex] || char.portraits[0];

                        img.src = Utils.sanitizeUrl(activePortrait?.iconUrl || '');
                        img.className = 'character-portrait';
                        img.alt = char.name;
                        span.appendChild(img);
                    }
                }

                if (Store.data.settings.textColor && formatText) {
                    const colorToApply = char.colorMode === "special" ? char.color : Store.data.settings.sharedColor;
                    span.style.color = Utils.sanitizeColor(colorToApply) || 'inherit';
                }

                if (Store.data.settings.textBold && formatText) {
                    span.style.fontWeight = 'bold';
                }

                span.appendChild(document.createTextNode(fullMatch));
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

    static applyHighlights() {
        const storyContainers = document.querySelectorAll(`${Config.ID_STORY_CONTAINER}:not([data-chars-highlighted])`);

        for (const container of storyContainers) {
            container.setAttribute('data-chars-highlighted', 'true');
            TextEffects.highlightNames(container);
        }
    }

    static async reloadAndApply() {
        await Store.loadCharacters();

        document.querySelectorAll('.character-highlight').forEach(span => {
            const parent = span.parentElement;
            if (parent) {
                const text = span.textContent || '';
                parent.replaceChild(document.createTextNode(text), span);
                parent.normalize();
            }
        });

        document.querySelectorAll('[data-chars-highlighted]').forEach(el => el.removeAttribute('data-chars-highlighted'));
        TextEffects.applyHighlights();
    }
}