"use strict";

function onNavigationChanged(newNavigation) {
    Log.say(`Navigated from ${previousNavigation} to ${newNavigation}.`, true);
    previousNavigation = newNavigation;
}

function onAdventureLoad(adventureTag) {
    Log.say("Loaded adventure with tag: " + Utils.getAdventureTag()); // Log the adventure tag.
    Storage.init(adventureTag); // Load the storage for the current adventure.
    loadedAdventureTag = adventureTag; // Set the loaded adventure tag.
}

function onAdventureExit(adventureTag) {
    Log.scream("Left adventure with tag: " + adventureTag + "!"); // Log the adventure tag.
    loadedAdventureTag = null; // Reset the loaded adventure tag.
}

async function onMenuButtonClicked() {
    Log.say("Menu button clicked.");

    // Initialize menu if not already done
    if (!Menu.isVisible) {
        // Ensure menu is initialized
        await Menu.init();
    }

    // Toggle the menu
    Menu.toggle();
}

async function onSubTabSwitched(subTabName, panel) {
    if (subTabName === 'entity' && panel) await EntityEditor.tryInit(panel)

    // Remove the 's' from the sub tab name, since there are some subtabs like 'characters', 'factions', and such.
    const sLessName = Utils.removeLastCharIfEquals(subTabName, 's');
    const validRenderCategories = ['all', 'character', 'race', 'location', 'faction', 'custom']; // Set the whitelisted categories, hardcoded for now.

    // If it is one of the valid categories, then call the renderer.
    if (validRenderCategories.includes(sLessName)) setTimeout(async () => await EntityRenderer.tryInit(panel, sLessName), 10);
}

function onStorageMutated() {
    setTimeout(() => {
        TextEffects.reloadAndApplyToAdventure();
    }, 100);

    Inject.settingsStyle();
}