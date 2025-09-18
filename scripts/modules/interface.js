'use strict';

function injectButton(config) {
    const { id, label, icon, exitGameButton, listContainer, onClick } = config;
    if (document.getElementById(id)) return;

    const button = document.createElement('div');
    button.id = id;
    button.className = exitGameButton.className;
    button.setAttribute('role', 'button');
    button.setAttribute('aria-label', label);
    button.setAttribute('tabindex', '0');

    const originalIconContainer = exitGameButton.querySelector('div');
    const originalTextSpan = exitGameButton.querySelector('span.is_ButtonText');
    if (!originalIconContainer || !originalTextSpan) return;

    const iconContainer = document.createElement('div');
    iconContainer.className = originalIconContainer.className;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'material-symbols-rounded';
    iconSpan.textContent = icon;
    iconSpan.style.fontSize = '18px';

    const textSpan = document.createElement('span');
    textSpan.className = originalTextSpan.className;
    textSpan.textContent = label;

    iconContainer.appendChild(iconSpan);
    button.appendChild(iconContainer);
    button.appendChild(textSpan);

    button.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        if (onClick) onClick();
    });

    listContainer.appendChild(button);
}

function addCustomButtons() {
    const exitGameButton = document.querySelector(IDENTIFIERS.EXIT_GAME_BUTTON);
    const listContainer = exitGameButton ? exitGameButton.parentElement : null;
    if (!listContainer || document.getElementById('custom-buttons-wrapper')) return;

    const scrollableButtonArea = document.createElement('div');
    scrollableButtonArea.id = 'custom-buttons-wrapper';
    scrollableButtonArea.style.maxHeight = 'calc(100vh - 300px)';
    scrollableButtonArea.style.overflowY = 'auto';
    scrollableButtonArea.style.paddingRight = '8px';

    scrollableButtonArea.style.display = 'flex';
    scrollableButtonArea.style.flexDirection = 'column';
    scrollableButtonArea.style.gap = '16px';

    listContainer.insertBefore(scrollableButtonArea, exitGameButton);

    const buttonConfigs = [
        { id: 'custom-btn-characters', label: 'Characters', icon: 'group', onClick: onCharactersClick },
        { id: 'custom-btn-notes', label: 'Notes', icon: 'description', onClick: onNotesClick },
        { id: 'custom-btn-settings', label: 'Settings', icon: 'settings_heart', onClick: onSettingsClick },
        { id: 'custom-btn-share', label: 'Share', icon: 'share', onClick: onShareClick },
        { id: 'custom-btn-bugs', label: 'Bugs', icon: 'pest_control', onClick: onBugsClick },
        { id: 'custom-btn-refresh', label: 'Force Refresh', icon: 'refresh', onClick: onRefreshClick },
    ];

    buttonConfigs.forEach(config => {
        injectButton({ ...config, exitGameButton, listContainer: scrollableButtonArea });
    });

    scrollableButtonArea.appendChild(exitGameButton);
}
