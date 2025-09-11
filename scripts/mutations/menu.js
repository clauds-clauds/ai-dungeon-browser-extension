// Menu ...
// Setup...
function injectButton(config) {
    const { id, label, icon, exitGameButton, listContainer, onClick } = config;

    if (document.getElementById(id)) {
        return;
    }

    const button = document.createElement('div');
    button.id = id;
    button.className = exitGameButton.className;
    button.setAttribute('role', 'button');
    button.setAttribute('aria-label', label);
    button.setAttribute('tabindex', '0');

    const originalIconContainer = exitGameButton.querySelector('div');
    const originalTextSpan = exitGameButton.querySelector('span.is_ButtonText');

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

        if (onClick) {
            onClick();
        }
    });

    listContainer.insertBefore(button, exitGameButton);
}

function applyMenuMutation() {
    // Try to grab the standard "Exit game" button.
    const exitGameButton = document.querySelector('div[role="button"][aria-label="Exit game"]');

    // Try to find the listcontainer, which is the parent of the exit button. This can only happen when the exit button is actually there (surprise).
    const listContainer = exitGameButton ? exitGameButton.parentElement : null;
    if (!listContainer) return; // Return if the list container is not valid.

    if (!document.getElementById('custom-material-symbols')) {
        const link = document.createElement('link');
        link.id = 'custom-material-symbols';
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200';
        document.head.appendChild(link);
    }

    const buttonConfigs = [
        { id: 'custom-btn-characters', label: 'Characters', icon: 'group', exitGameButton, listContainer, onCharactersClick },
        { id: 'custom-btn-notes', label: 'Notes', icon: 'description', exitGameButton, listContainer, onNotesClick },
        { id: 'custom-btn-share', label: 'Share', icon: 'share', exitGameButton, listContainer, onShareClick },
        { id: 'custom-btn-faq', label: 'FAQ', icon: 'contact_support', exitGameButton, listContainer, onHelpClick }
    ];

    buttonConfigs.forEach(injectButton);
}