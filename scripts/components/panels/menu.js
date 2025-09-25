'use strict';

class Menu extends Panel {
    static async show() {
        let panel = Panel.prepare('main-menu-panel');
        
        if (!panel) {
            Utils.printNeat('Injecting main menu panel.');
            panel = await Inject.panel('resources/panels/menu_panel.html');

            panel.addEventListener('click', e => {
                if (e.target === panel) Panel.close('main-menu-panel');
            });

            const buttonMap = {
                'menu-btn-characters': Events.onCharactersClick,
                'menu-btn-notes': Events.onNotesClick,
                'menu-btn-settings': Events.onSettingsClick,
                'menu-btn-share': Events.onShareClick,
                'menu-btn-bugs': Events.onBugsClick,
                'menu-btn-refresh': Events.onRefreshClick,
            };

            for (const [id, action] of Object.entries(buttonMap)) {
                document.getElementById(id).addEventListener('click', () => {
                    Panel.close('main-menu-panel');
                    setTimeout(action, Config.TIME_DELAY_SWITCH);
                });
            }
        }

        setTimeout(() => panel.classList.add('visible'), 10);
    }
}