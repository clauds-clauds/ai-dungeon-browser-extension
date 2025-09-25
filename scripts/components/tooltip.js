'use strict';

let hideTooltipTimeout;

function applyTooltipStuff() {
    const tooltip = document.getElementById('portrait-hover-tooltip');
    if (!tooltip || tooltip.dataset.interactive) return;
    tooltip.dataset.interactive = 'true';

    const hideAndSaveChanges = () => {
        if (tooltip.originalChar && typeof tooltip.currentIndex === 'number') {
            const char = tooltip.originalChar;
            const finalIndex = tooltip.currentIndex;

            if (finalIndex < char.portraits.length) {
                const [movedPortrait] = char.portraits.splice(finalIndex, 1);
                char.portraits.unshift(movedPortrait);
                Character.saveCharacters();
            }
        }
        tooltip.classList.remove('visible');
    };

    tooltip.addEventListener('mouseenter', () => clearTimeout(hideTooltipTimeout));
    tooltip.addEventListener('mouseleave', () => {
        hideTooltipTimeout = setTimeout(hideAndSaveChanges, Store.data.settings.tooltipHideDelay);
    });

    const updateImage = (newIndex) => {
        if (!tooltip.portraits) return;
        const numPortraits = tooltip.portraits.length;
        const validIndex = (newIndex + numPortraits) % numPortraits;
        tooltip.currentIndex = validIndex;

        const newPortrait = tooltip.portraits[validIndex];
        tooltip.querySelector('img').src = Utils.sanitizeUrl(newPortrait.fullUrl || newPortrait.iconUrl);

        const inlineIcon = tooltip.sourceSpan.querySelector('img.character-portrait');
        if (inlineIcon) inlineIcon.src = Utils.sanitizeUrl(newPortrait.iconUrl);
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