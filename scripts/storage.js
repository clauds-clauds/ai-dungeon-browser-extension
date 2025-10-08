"use strict";

/**
 * **DK Storage** handles storage stuff (*wow*).
*/
class DKStorage {
    /**
     * The Dexie database instance.
    */
    static #db = new Dexie(DKConfig.DATABASE_KEY);

    /**
     * Initializes the database and its stores.
    */
    static {
        this.#db.version(1).stores({
            settings: 'key',
            entities: '++id, adventureId, type, *triggers'
        });
    }

    /**
     * The cache for entities and settings.
    */
    static cache = {
        entities: [],
        settings: {}
    }

    /**
     * Gets a setting value or a default value if not found.
     * @param {*} variable The setting variable name.
     * @param {*} defaultValue The default value to return if not found.
     * @returns The setting value or the default value.
    */
    static getSettingOrDefault(variable, defaultValue) {
        const value = this.cache.settings[variable];
        if (value === undefined) this.saveSetting(variable, defaultValue);
        return value ?? defaultValue;
    }

    /**
     * Saves a setting to the cache and the database.
     * @param {*} variable The setting variable name.
     * @param {*} value The setting value.
    */
    static async saveSetting(variable, value) {
        this.cache.settings[variable] = value;

        document.dispatchEvent(new CustomEvent(DKConfig.EVENT_CACHE_UPDATED));

        await this.#db.settings.put({
            key: Configuration.DATABASE_KEY,
            value: this.cache.settings
        });
    }
}