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
    iconSpan.className = 'material-symbols-outlined';
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

    listContainer.insertBefore(button, exitGameButton);
}

function addCustomButtons() {
    const exitGameButton = document.querySelector(SELECTORS.EXIT_GAME_BUTTON);
    const listContainer = exitGameButton ? exitGameButton.parentElement : null;
    if (!listContainer) return;

    if (!document.getElementById('custom-material-symbols')) {
        const link = document.createElement('link');
        link.id = 'custom-material-symbols';
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200';
        document.head.appendChild(link);
    }

    const buttonConfigs = [
        { id: 'custom-btn-characters', label: 'Characters', icon: 'group', onClick: onCharactersClick },
        { id: 'custom-btn-notes', label: 'Notes', icon: 'description', onClick: onNotesClick },
        { id: 'custom-btn-share', label: 'Share', icon: 'share', onClick: onShareClick },
        { id: 'custom-btn-faq', label: 'FAQ', icon: 'contact_support', onClick: onHelpClick }
    ];

    buttonConfigs.forEach(config => injectButton({ ...config, exitGameButton, listContainer }));
}