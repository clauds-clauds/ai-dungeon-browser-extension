"use strict";

class Configuration {
    /**
     * Whether the custom debugger prints debug messages to the console.
     */
    static DEBUGGER_ENABLED = true;

    /**
     * A nice looking primary color.
     */
    static COLOR_PRIMARY = '#f8ae2c';

    /**
     * A very dangerous looking color.
     */
    static COLOR_DANGER = '#ef4444';

    /**
     * Element id for the material symbols rounded font.
     */
    static ID_MATERIAL_SYMBOLS_ROUNDED = 'material-symbols-rounded';

    /**
     * CSS selector for the "Exit game" button.
     */
    static ID_EXIT_GAME_BUTTON = 'div[role="button"][aria-label="Exit game"]';

    /**
     * Element ID for the custom menu button.
     */
    static ID_EXTENSION_MENU_BUTTON = 'de-menu-button';

    /**
     * CSS selector for the adventure text area.
     */
    static ID_ADVENTURE_TEXT = '#transition-opacity';

    /**
     * Element ID for the custom tooltip.
     */
    static ID_TOOLTIP = 'de-tooltip';

    /**
     * Element ID for the custom backdrop.
     */
    static ID_BACKDROP = 'de-backdrop';

    /**
     * Element ID for the custom menu itself.
     */
    static ID_EXTENSION_MENU = 'de-menu';

    /**
     * Element ID for the extension styles.
     */
    static ID_EXTENSION_STYLES = 'de-styles';

    /**
     * Event name for when the cache is updated.
     */
    static EVENT_CACHE_UPDATED = 'cacheupdated';

    /**
     * Event name for when the extension menu is created.
     */
    static EXTENSION_MENU_CREATED = 'extensionmenucreated';

    /**
     * Icon name for the custom menu button.
     */
    static CUSTOM_MENU_BUTTON_ICON = 'terminal';

    /**
     * Icon size for the custom menu button.
     */
    static CUSTOM_MENU_BUTTON_ICON_SIZE = '18px';

    /**
     * Name of the IndexedDB database.
     */
    static DATABASE_NAME = 'DEDB';

    /**
     * Key for the IndexedDB database.
     */
    static DATABASE_KEY = 'DEDBKey';

    /**
     * Categories and their icons.
     */
    static ICONS_CATEGORIES = {
        character: 'person',
        race: 'sword_rose',
        location: 'explore',
        faction: 'castle',
        custom: 'category'
    }
}