'use strict';

async function setupMainMenu() {
    let panel = document.getElementById('main-menu-panel');
    makePageInert('main-menu-panel');
    if (!panel) {
        panel = await injectPanel('resources/editor_menu.html');

        panel.addEventListener('click', e => {
            if (e.target === panel) closePanel('main-menu-panel');
        });

        const buttonMap = {
            'menu-btn-characters': onCharactersClick,
            'menu-btn-notes': onNotesClick,
            'menu-btn-settings': onSettingsClick,
            'menu-btn-share': onShareClick,
            'menu-btn-bugs': onBugsClick,
            'menu-btn-refresh': onRefreshClick,
        };

        for (const [id, action] of Object.entries(buttonMap)) {
            document.getElementById(id).addEventListener('click', () => {
                closePanel('main-menu-panel');
                setTimeout(action, 250);
            });
        }
    }

    setTimeout(() => panel.classList.add('visible'), 10);
}