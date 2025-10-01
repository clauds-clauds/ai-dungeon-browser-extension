"use strict";

class PersistentStorage {
    /**
     * The Dexie database instance.
     */
    static #db = new Dexie(Configuration.DATABASE_KEY);

    /**
    * The database schema.
    */
    static {
        this.#db.version(1).stores({
            settings: 'key',
            entities: '++id, adventureId, type, *triggers'
        });
    }

    /**
     * The in-memory cache of entities and settings.
     */
    static cache = {
        entities: [],
        settings: {}
    }

    /**
     * The default settings.
     */
    static #defaults = {
        /* Text Effects HERE! */
        textEffectsIcons: true,
        textEffectsColor: true,
        textEffectsBold: true,
        textEffectsStory: true,
        textEffectsDialogue: true,
        textEffectsIconSize: 28,
        textEffectsIconBorderWidth: 1,
        textEffectsIconBorderRadius: 0,
        textEffectsColor: "#f8ae2c",

        /* Tooltip HERE! */
        tooltipGraphics: true,
        tooltipGraphicSize: 20,
        tooltipHideDelay: 200
    };

    /**
     * Retrieves a setting value from the cache or defaults.
     * @param {*} setting The setting key to retrieve.
     * @param {*} defaultValue The default value to return if the setting is not found.
     * @returns {*} The setting value or the provided default value.
     */
    static getSetting(setting, defaultValue = null) {
        return this.cache.settings[setting] ?? this.#defaults[setting] ?? defaultValue;
    }

    /**
     * Saves a setting to the cache and database.
     * @param {*} setting 
     * @param {*} value 
     * @return {Promise<void>}
     */
    static async saveSetting(setting, value){
        this.cache.settings[setting] = value;

        document.dispatchEvent(new CustomEvent(Configuration.EVENT_CACHE_UPDATED));

        await this.#db.settings.put({
            key: Configuration.DATABASE_KEY,
            value: this.cache.settings
        });

        CustomDebugger.say(`Saved setting ${setting} with value ${value}.`, true);
    }

    /**
     * Saves an entity to the database and updates the cache.
     * @param {*} entity The entity to save.
     * @returns {Promise<void>}
     */
    static async saveEntity(entity) {
        if (!entity) return;
        await this.#db.entities.put(entity);

        const safeEntity = JSON.parse(JSON.stringify(entity));
        const index = this.cache.entities.findIndex(e => e.id === safeEntity.id);

        if (index > -1) this.cache.entities[index] = safeEntity;
        else this.cache.entities.push(safeEntity);

        document.dispatchEvent(new CustomEvent(Configuration.EVENT_CACHE_UPDATED));
        CustomDebugger.say(`Saved entity ${entity.id} (${entity.type}).`, true);
    }

    /**
     * Deletes an entity from the database and cache.
     * @param {*} entity The entity to delete.
     * @return {Promise<void>}
     */
    static async deleteEntity(entity) {
        try {
            await this.#db.entities.delete(entity); // Delete from database.

            const index = this.cache.entities.findIndex(e => e.id === entity);
            if (index > -1) this.cache.entities.splice(index, 1);

            document.dispatchEvent(new CustomEvent(Configuration.EVENT_CACHE_UPDATED));
            CustomDebugger.say(`Deleted entity ${entity}`, true);
        } catch (error) {
            CustomDebugger.scream('Failed to delete entity from storage!');
            throw error;
        }
    }

    /**
     * Pings the persistent storage for a specific adventure.
     * @param {string} adventureId 
     * @return {Promise<void>}
     */
    static async ping(adventureId) {
        // Ping some message.
        CustomDebugger.say("Pinging persistent storage.", true);

        // Load settings and entities into the in-memory cache.
        const [settings, entities] = await Promise.all([
            this.#db.settings.get(Configuration.DATABASE_KEY),
            adventureId
                ? this.#db.entities.where('adventureId').equals(adventureId).toArray()
                : this.#db.entities.toArray()
        ]);

        // Load the settings into the cache.
        if (settings) Object.assign(this.cache.settings, settings.value);

        // Load the entities into the cache.
        this.cache.entities = entities.map(e => JSON.parse(JSON.stringify(e))); 

        // Dispatch an event to notify that the cache has been updated.
        document.dispatchEvent(new CustomEvent('cacheupdated'));

        // Print how many entities were loaded.
        CustomDebugger.say(`Loaded ${entities.length} entities from the database.`, true);
    }
}