function handleHighlighting(mutations) {
    for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach(node => {
                // We are only interested in elements that can contain story text.
                if (node.nodeType === Node.ELEMENT_NODE) {
                    processNodeForHighlighting(node);
                }
            });
        }
    }
}

async function processNodeForHighlighting(node) {
    // The character list is loaded once from the main state.
    const characters = characterState.characters;
    if (characters.length === 0) return;

    // Create a single, powerful regex from all character names and nicknames.
    const namesToMatch = characters.flatMap(c => [c.name, ...(c.nicknames || [])]).filter(Boolean);
    if (namesToMatch.length === 0) return;
    const namesRegex = new RegExp(`\\b(${namesToMatch.join('|')})\\b`, 'gi');

    // Find all text nodes within the newly added element that aren't inside links or buttons.
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
            return (node.parentElement.nodeName.toLowerCase() !== 'a' &&
                node.parentElement.nodeName.toLowerCase() !== 'button')
                ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
    });

    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    // Process each text node for potential matches.
    for (const textNode of textNodes) {
        const textContent = textNode.textContent;
        if (!namesRegex.test(textContent)) continue;

        // Reset regex for new execution
        namesRegex.lastIndex = 0;

        const parent = textNode.parentNode;
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        let match;

        while ((match = namesRegex.exec(textContent)) !== null) {
            const matchedName = match[0];
            const char = characters.find(c => c.name.toLowerCase() === matchedName.toLowerCase() || c.nicknames?.map(n => n.toLowerCase()).includes(matchedName.toLowerCase()));

            if (!char) continue;

            // Add the text before the match
            fragment.appendChild(document.createTextNode(textContent.substring(lastIndex, match.index)));

            // Create the portrait image
            const img = document.createElement('img');
            img.src = char.portraitUrl;
            img.style.width = '24px';
            img.style.height = '24px';
            img.style.borderRadius = '50%';
            img.style.verticalAlign = 'middle';
            img.style.marginRight = '4px';
            if (char.status === 'dead') {
                img.style.filter = 'saturate(0)';
            }
            fragment.appendChild(img);

            // Create the colored name span
            const nameSpan = document.createElement('span');
            nameSpan.textContent = matchedName;
            nameSpan.style.color = char.color;
            nameSpan.style.fontWeight = 'bold';
            if (char.status === 'dead') {
                nameSpan.style.textDecoration = 'line-through';
            }
            fragment.appendChild(nameSpan);

            lastIndex = namesRegex.lastIndex;
        }

        // Add any remaining text after the last match
        fragment.appendChild(document.createTextNode(textContent.substring(lastIndex)));
        parent.replaceChild(fragment, textNode);
    }
}