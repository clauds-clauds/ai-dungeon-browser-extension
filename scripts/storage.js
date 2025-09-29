"use strict";

/**
 * Storage class for managing settings and entities using Dexie.js.
 */
class Storage {
    /**
     * Dexie database thingy.
     */
    static #db = new Dexie('DungeonExtensionDB');

    static {
        this.#db.version(1).stores({
            settings: 'key',
            entities: '++id, adventureTag, type, *keywords'
        });
    }

    /**
     * In-memory cache for settings and entities.
     */
    static cache = {
        entities: [],
        settings: {}
    }

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
        textEffectsColorDefault: '#f8ae2c',
        textEffectsColorGlobal: 'rgba(200, 170, 100, 1)',

        tooltipEnabled: true,
        tooltipScale: 25,
        tooltipHideDelay: 400
    };

    /**
     * Initialize the storage for a specific adventure.
     * @param {string} adventureTag The adventure tag to load entities for.
     */
    static async init(adventureTag) {
        // Load the data from the database.
        const [settingsData, entities] = await Promise.all([
            this.#db.settings.get(Config.DATABASE_KEY),
            adventureTag
                ? this.#db.entities.where('adventureTag').equals(adventureTag).toArray()
                : this.#db.entities.toArray()
        ]);

        // Load settings into cache.
        if (settingsData) Object.assign(this.cache.settings, settingsData.value);

        // Load entities into cache.
        this.cache.entities = entities.map(e => JSON.parse(JSON.stringify(e))); 

        document.dispatchEvent(new CustomEvent('storage-cache-updated'));

        Log.say(`Storage loaded ${entities.length} entities from the database for the current adventure.`);
    }

    /* Variable Stuff! */

    /**
     * Get a variable from storage.
     * @param {string} variable The name of the variable to retrieve.
     * @param {*} defaultValue The default value to return if the variable is not found.
     * @returns {*} The value of the variable or the default value.
     */
    static getVariable(variable, defaultValue = null) {
        return this.cache.settings[variable] ?? this.#defaults[variable] ?? defaultValue;
    }

    /**
     * Get the default value of a variable.
     * @param {string} variable The name of the variable to retrieve the default value for.
     * @returns {*} The default value of the variable or null if not found.
     */
    static getVariableDefault(variable) {
        return this.#defaults[variable];
    }

    /**
     * Save a variable to storage.
     * @param {string} variable The name of the variable to save.
     * @param {*} value The value to save.
     */
    static async saveVariable(variable, value) {
        this.cache.settings[variable] = value; // Update the in-memory cache.

        document.dispatchEvent(new CustomEvent('storage-cache-updated'));

        // Write the value to the database.
        await this.#db.settings.put({
            key: Config.DATABASE_KEY,
            value: this.cache.settings
        });

        // Log the saved setting.
        Log.say(`Storage saved setting "${variable}" with value: ${value}`);
    }

    /* Entity Stuff! */

    /**
     * Saves an entity to storage.
     * @param {*} entityData The entity data to save.
     */
    static async saveEntity(entityData) {
        await this.#db.entities.put(entityData); // Save or update the entity in the database.

        const cleanEntityData = JSON.parse(JSON.stringify(entityData));

        // Update or add the entity in the in-memory cache.
        const index = this.cache.entities.findIndex(e => e.id === cleanEntityData.id);

        // Update or add the entity in the in-memory cache.
        if (index > -1) this.cache.entities[index] = cleanEntityData;
        else this.cache.entities.push(cleanEntityData); // Add new entity.

        document.dispatchEvent(new CustomEvent('storage-cache-updated'));

        // Log the saved entity.
        Log.say(`Saved entity with name: ${entityData.name}`);
    }

    /**
     * Deletes an entity from storage.
     * @param {*} entityId The ID of the entity to delete.
     */
    static async deleteEntity(entityId) {
        try {
            await this.#db.entities.delete(entityId); // Delete from database.

            // Remove from cache.
            const index = this.cache.entities.findIndex(e => e.id === entityId);
            if (index > -1) this.cache.entities.splice(index, 1);

            document.dispatchEvent(new CustomEvent('storage-cache-updated'));

            // Log the deletion.
            Log.say(`Storage deleted entity with ID: ${entityId}`);
        } catch (error) {
            // Log the error.
            Log.scream('Failed to delete entity from storage:', error);
            throw error;
        }
    }

    /**
     * Deletes the entire database.
     */
    static async deleteDatabase() {
        Log.scream("Deleting all data!"); // Log something scary.
        this.#db?.delete({ disableAutoOpen: false }); // Delete the database.
    }
}