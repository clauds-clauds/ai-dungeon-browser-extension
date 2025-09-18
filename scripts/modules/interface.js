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
    if (!listContainer) return;

    const buttonConfig = {
        id: 'custom-btn-main-menu',
        label: 'Extension Menu',
        icon: 'widgets',
        onClick: setupMainMenu,
        exitGameButton,
        listContainer
    };

    injectButton(buttonConfig);
}