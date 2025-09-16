'use strict';

function highlightNamesInNode(node) {
    if (!characterData || characterData.length === 0) return;

    const allNames = characterData.flatMap(char => [char.name, ...(char.nicknames || [])]).filter(Boolean);
    if (allNames.length === 0) return;

    const pattern = allNames.map(name => escapeRegExp(name)).join('|');
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
        if (!regex.test(originalText)) continue;

        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        let match;
        regex.lastIndex = 0;

        while ((match = regex.exec(originalText)) !== null) {
            const fullMatch = match[0];
            const baseName = match[1];

            const char = characterData.find(c =>
                baseName.toLowerCase() === c.name.toLowerCase() ||
                (c.nicknames || []).some(nick => nick.toLowerCase() === baseName.toLowerCase())
            );

            if (!char) continue;

            if (match.index > lastIndex) {
                fragment.appendChild(document.createTextNode(originalText.substring(lastIndex, match.index)));
            }
            const span = document.createElement('span');
            span.className = 'character-highlight';
            const colorToApply = char.colorMode === "special" ? char.color : extensionSettings.sharedColor;
            span.style.color = sanitizeColor(colorToApply) || 'inherit';

            if (char.portraitUrl) {
                const img = document.createElement('img');
                img.src = sanitizeUrl(char.portraitUrl);
                img.className = 'character-portrait';
                img.alt = char.name;
                span.appendChild(img);
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

function applyHighlights() {
    const storyContainers = document.querySelectorAll(`${IDENTIFIERS.STORY_CONTAINER}:not([data-chars-highlighted])`);

    for (const container of storyContainers) {
        container.setAttribute('data-chars-highlighted', 'true');
        highlightNamesInNode(container);
    }
}

async function reapplyAllHighlights() {
    await loadCharacterData();

    document.querySelectorAll('.character-highlight').forEach(span => {
        const parent = span.parentElement;
        if (parent) {
            const text = span.textContent || '';
            parent.replaceChild(document.createTextNode(text), span);
            parent.normalize();
        }
    });

    document.querySelectorAll('[data-chars-highlighted]').forEach(el => el.removeAttribute('data-chars-highlighted'));
    applyHighlights();
}