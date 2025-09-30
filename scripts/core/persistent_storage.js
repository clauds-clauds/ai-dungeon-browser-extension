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
        textEffectsEnabled: true,
        textEffectsColor: true,
        textEffectsBold: true,
        textEffectsStory: true,
        textEffectsDialogue: true,
        textEffectsIcon: true,
        textEffectsIconSize: 28,
        textEffectsIconBorderWidth: 1,
        textEffectsIconBorderRadius: 0,
        textEffectsColorGlobal: 'rgba(200, 170, 100, 1)',

        tooltipEnabled: true,
        tooltipScale: 25,
        tooltipHideDelay: 400
    };

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