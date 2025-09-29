"use strict";

class Config {
    static LOG_ENABLE = true;
    static LOG_ENABLE_VERBOSE = true;

    static COLOR_WARNING = '#f8ae2c';
    static COLOR_ERROR = '#ef4444';

    static IDENTIFIER_FONT_MATERIAL_SYMBOLS = 'material-symbols-rounded';

    static IDENTIFIER_BUTTON_EXTENSION_MENU = 'dungeon-extension-menu-button';

    static IDENTIFIER_BUTTON_GAME_SETTINGS = '[aria-label="Game settings"]';
    static IDENTIFIER_BUTTON_EXIT_GAME = 'div[role="button"][aria-label="Exit game"]';

    static IDENTIFIER_CONTAINER_ADVENTURE_TEXT = '#transition-opacity';
    static IDENTIFIER_CONTAINER_NAVIGATION_BAR = '[aria-label="Navigation bar"][role="toolbar"]';

    static IDENTIFIER_STYLE_SETTINGS = 'important-override-style';

    static DATABASE_NAME = 'DungeonExtensionDB';
    static DATABASE_KEY = 'DungeonExtensionSettings';
}