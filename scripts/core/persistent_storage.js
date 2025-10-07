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
        /* General Defaults HERE! */
        debugVerbose: false,

        /* Theme Defaults HERE! */
        themeColor: "#f8ad2a",
        themeColorDanger: "#dd3647",

        /* Text Effects Defaults HERE! */
        textEffectsIcons: true,
        textEffectsColor: true,
        textEffectsBold: true,
        textEffectsStory: true,
        textEffectsAction: true,
        textEffectsIconSize: 28,
        textEffectsIconBorderWidth: 1,
        textEffectsIconBorderRadius: 0,
        textEffectsGlobalColor: "#f8ad2a",

        /* Tooltip Defaults HERE! */
        tooltipGraphics: true,
        tooltipGraphicSize: 20,
        tooltipHideDelay: 200,

        /* RegExp Defaults HERE! */
        textEffectsColon: true,

        /* Importer Defaults HERE! */
        importStoryCards: true,
        importCharacters: true,
        importRaces: false,
        importLocations: false,
        importFactions: false,
        importCustom: false,

        /* Experiments Defaults HERE! */
        experimentalStoragePerformanceMode: true
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
        CustomDebugger.say(`Saved entity ${entity.id} (${entity.category}).`, true);
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

        if (this.cache.entities.length > 0) CustomDebugger.say("First saved entity is " + JSON.stringify(this.cache.entities[0]), true);

        // Print how many entities were loaded.
        CustomDebugger.say(`Loaded ${entities.length} entities from the database.`, true);
    }

    /**
     * Deletes all settings from the database and reloads the page.
     * @returns {Promise<void>}
     */
    static async deleteSettings() {
        await this.#db.settings.delete(Configuration.DATABASE_KEY); // Delete settings from database.
        CustomDebugger.say("Deleted settings from database.", true);  // Log the deletion.
        location.reload(); // Reload the page to reset everything.
    }

    /**
     * Deletes the entire database and reloads the page.
     * @returns {Promise<void>}
     */
    static async deleteDatabase() {
        CustomDebugger.scream("Deleting all data!"); // Log something scary.
        this.#db?.delete({ disableAutoOpen: false }); // Delete the database.
        location.reload(); // Reload the page to reset everything.
    }

    static importMergeJSON() {
        CustomDebugger.say("Merging database from JSON.", true);
        this.#importJSON('merge');
    }

    static importReplaceJSON() {
        CustomDebugger.say("Replacing database from JSON.", true);
        this.#importJSON('replace');
    }

    /**
     * Exports all entities in the current adventure to a JSON file.
     * @returns {Promise<void>}
     */
    static async exportToJSON() {
        CustomDebugger.say("Exporting database to JSON.", true);

        try {
            const adventureId = Utilities.getAdventureId();

            if (!adventureId) {
                CustomDebugger.scream('Cannot export entities outside of an adventure!');
                return;
            }

            const entities = await this.#db.entities.where('adventureId').equals(adventureId).toArray();
            const data = JSON.stringify(entities, null, 4);
            const blob = new Blob([data], { type: 'application/json' });

            Utilities.download(`dungeon-extension-${adventureId}-entities.json`, URL.createObjectURL(blob));

            CustomDebugger.say(`Successfully exported ${entities.length} entities to JSON.`, true);
        } catch (error) {
            CustomDebugger.scream('Failed to export entities to JSON!');
            throw error;
        }
    }

    /**
     * Exports all entities in the database to a JSON file, regardless of adventure.
     * @returns {Promise<void>}
     */
    static async exportToJSONBackup() {
        try {
            const entities = await this.#db.entities.toArray();
            const data = JSON.stringify(entities, null, 4);
            const blob = new Blob([data], { type: 'application/json' });

            Utilities.download(`dungeon-extension-backup.json`, URL.createObjectURL(blob));

            CustomDebugger.say("Exported entities to JSON.", true);
        } catch (error) {
            CustomDebugger.scream('Failed to export entities to JSON!');
            throw error;
        }
    }

    static #migrateLegacy(data) {
        if (!data?.data?.characters) return [];

        return data.data.characters.map(char => {
            const entity = {
                name: char.name,
                category: 'character',
                triggers: char.nicknames?.filter(n => n !== char.name) ?? [],
                icons: [],
                graphics: []
            };

            char.portraits?.forEach(p => {
                if (p.iconUrl?.startsWith('data:image')) {
                    entity.icons.push({ url: p.iconUrl, isPinned: false });
                }
                if (p.fullUrl?.startsWith('data:image')) {
                    entity.graphics.push({ url: p.fullUrl, isPinned: false });
                }
            });

            return entity;
        });
    }

    static #migrateStoryCards(data) {
        const validCategories = new Set(['character', 'race', 'location', 'faction']);

        return data
            .map(card => {
                const category = card.type?.toLowerCase() ?? 'custom';
                return {
                    name: card.title,
                    triggers: card.keys?.split(',').map(k => k.trim()) ?? [],
                    category: validCategories.has(category) ? category : 'custom',
                    icons: [],
                    graphics: []
                };
            })
            .filter(entity => {
                switch (entity.category) {
                    case 'character':
                        return this.getSetting('importCharacters', true);
                    case 'race':
                        return this.getSetting('importRaces', false);
                    case 'location':
                        return this.getSetting('importLocations', false);
                    case 'faction':
                        return this.getSetting('importFactions', false);
                    case 'custom':
                        return this.getSetting('importCustom', false);
                    default:
                        return false;
                }
            });
    }

    static async #importJSON(mode) {
        const adventureId = Utilities.getAdventureId();
        if (!adventureId) {
            CustomDebugger.scream('Cannot import entities outside of an adventure!');
            return;
        }

        try {
            const fileContent = await Utilities.promptForJSON();
            if (!fileContent) return; // User cancelled file selection

            const data = JSON.parse(fileContent);
            let rawEntities = [];

            if (data?.data?.characters) { // Legacy format HERE!.
                CustomDebugger.say("Detected legacy format. Migrating...", true);
                rawEntities = this.#migrateLegacy(data);
            } else if (Array.isArray(data) && data[0]?.keys && data[0]?.title) { // Story card format HERE!
                CustomDebugger.say("Detected Story Card format. Migrating...", true);
                rawEntities = this.#migrateStoryCards(data);
            } else if (Array.isArray(data) && data[0]?.adventureId && data[0]?.name) { // Normal format HERE!
                CustomDebugger.say("Detected normal entity format.", true);
                rawEntities = data;
            } else {
                throw new Error("Unknown or invalid JSON format.");
            }

            if (rawEntities.length === 0) {
                CustomDebugger.say("No compatible entities found to import.", true);
                return;
            }

            let entitiesToAdd = rawEntities.map(entity => ({
                ...entity,
                adventureId: adventureId,
                id: undefined
            }));

            if (mode === 'replace') {
                const idsToDelete = this.cache.entities.map(e => e.id);
                if (idsToDelete.length > 0) {
                    await this.#db.entities.bulkDelete(idsToDelete);
                }
            } else {
                const existingNames = new Set(this.cache.entities.map(e => e.name));
                entitiesToAdd = entitiesToAdd.filter(e => !existingNames.has(e.name));
            }

            if (entitiesToAdd.length > 0) {
                await this.#db.entities.bulkAdd(entitiesToAdd);
                CustomDebugger.say(`Imported ${entitiesToAdd.length} entities.`, true);
            } else {
                CustomDebugger.say("No new entities added.", true);
            }

            await this.ping(adventureId);

        } catch (error) {
            CustomDebugger.scream('Failed to import from JSON!');
            console.error(error);
        }
    }
}