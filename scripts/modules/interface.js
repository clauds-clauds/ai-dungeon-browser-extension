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

    listContainer.insertBefore(button, exitGameButton);
}

function addCustomButtons() {
    const exitGameButton = document.querySelector(SELECTORS.EXIT_GAME_BUTTON);
    const listContainer = exitGameButton ? exitGameButton.parentElement : null;
    if (!listContainer) return;

    const buttonConfigs = [
        /* 
        You can define any and all new buttons here, it's pretty modular.
        Also, I use some cute Material Icons by Google from here:
        https://fonts.google.com/icons?selected=Material+Symbols+Outlined
        */
        { id: 'custom-btn-characters', label: 'Characters', icon: 'group', onClick: onCharactersClick },
        { id: 'custom-btn-notes', label: 'Notes', icon: 'description', onClick: onNotesClick },
        { id: 'custom-btn-settings', label: 'Settings', icon: 'settings_heart', onClick: onSettingsClick },
        { id: 'custom-btn-share', label: 'Share', icon: 'share', onClick: onShareClick },
        { id: 'custom-btn-bugs', label: 'Bugs', icon: 'pest_control', onClick: onBugsClick }, // DEV FEATURE: REMOVE FROM STABLE PRODUCTION.
        { id: 'custom-btn-refresh', label: 'Refresh', icon: 'refresh', onClick: onRefreshClick }, // DEV FEATURE: REMOVE FROM STABLE PRODUCTION.
        // { id: 'custom-btn-scripts', label: 'Scripts', icon: 'data_object', onClick: onScriptsClick },
        // { id: 'custom-btn-faq', label: 'FAQ', icon: 'contact_support', onClick: onHelpClick },
        // { id: 'custom-btn-language', label: 'Language', icon: 'glyphs', onClick: onLanguageClick } // HOW WOULD THEY UNDERSTAND IF THEY DO NOT SPEAK ENGLISH WITHOUT TAKING UP 3000 LINES ON THIS BAR?! TODO: SOMEHOW GET BROWSER LANGUAGE LOCALES.
    ];

    buttonConfigs.forEach(config => injectButton({ ...config, exitGameButton, listContainer }));
}