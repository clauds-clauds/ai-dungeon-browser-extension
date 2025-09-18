'use strict';

let hideTooltipTimeout;

function applyTooltipStuff() {
    const tooltip = document.getElementById('portrait-hover-tooltip');
    if (!tooltip || tooltip.dataset.interactive) return;
    tooltip.dataset.interactive = 'true';

    const hideTooltip = () => tooltip.classList.remove('visible');
    tooltip.addEventListener('mouseenter', () => clearTimeout(hideTooltipTimeout));
    tooltip.addEventListener('mouseleave', () => {
        hideTooltipTimeout = setTimeout(hideTooltip, 300); // Magic number here, make this customizable later.
    });

    const updateImage = (newIndex) => {
        if (!tooltip.portraits || !tooltip.sourceSpan) return;
        const numPortraits = tooltip.portraits.length;
        const validIndex = (newIndex + numPortraits) % numPortraits;
        tooltip.currentIndex = validIndex;

        const newPortrait = tooltip.portraits[validIndex];
        tooltip.querySelector('img').src = sanitizeUrl(newPortrait.fullUrl || newPortrait.iconUrl);

        const inlineIcon = tooltip.sourceSpan.querySelector('img.character-portrait');
        if (inlineIcon) inlineIcon.src = sanitizeUrl(newPortrait.iconUrl);

        const charId = tooltip.sourceSpan.dataset.charId;
        const char = dataStore.characters.find(c => c.id == charId);
        if (char) {
            const [movedPortrait] = char.portraits.splice(validIndex, 1);
            char.portraits.unshift(movedPortrait);

            tooltip.portraits = char.portraits;

            tooltip.currentIndex = 0;
            saveCharacters();
        }
    };

    document.getElementById('tooltip-prev-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        updateImage(tooltip.currentIndex - 1);
    });

    document.getElementById('tooltip-next-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        updateImage(tooltip.currentIndex + 1);
    });
}