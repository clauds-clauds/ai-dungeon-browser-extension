"use strict";

class Find {
    static adventureTextContainer() {
        return document.querySelector(Config.IDENTIFIER_CONTAINER_ADVENTURE_TEXT);
    }

    static gameSettingsButton() {
        return document.querySelector(Config.IDENTIFIER_BUTTON_GAME_SETTINGS);
    }

    static menuButton() {
        return document.getElementById(Config.IDENTIFIER_BUTTON_EXTENSION_MENU);
    }

    static exitGameButton() {
        return document.querySelector(Config.IDENTIFIER_BUTTON_EXIT_GAME);
    }

    static materialSymbolsFontFace() {
        return document.getElementById(Config.IDENTIFIER_FONT_MATERIAL_SYMBOLS + '-injection');
    }

    static navigationBar() {
        return document.querySelector(Config.IDENTIFIER_CONTAINER_NAVIGATION_BAR);
    }

    static backdrop () {
        return document.getElementById('extension-backdrop');
    }

    static mainMenu() {
        return document.getElementById('extension-main-menu');
    }

    static menuCloseButton() {
        return document.getElementById('menu-close-btn');
    }

    static gameArea() {
        const navBar = this.navigationBar();
        return navBar ? navBar.parentElement.parentElement : null;
    }
}