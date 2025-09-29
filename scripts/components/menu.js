"use strict";

class Menu {
    static #isVisible = false;

    /**
     * Inits the menu by creating all required elements and adding the event listeners.
     */
    static async init() {
        // Create backdrop if it doesn't exist.
        if (!Find.backdrop()) {
            const backdrop = document.createElement('div');
            backdrop.id = 'extension-backdrop';
            document.body.appendChild(backdrop);
        }

        // Return if the menu already exists.
        if (Find.mainMenu()) return;

        // Otherwise create a new menu container.
        const menuContainer = document.createElement('div');
        menuContainer.id = 'extension-menu-overlay';

        // Load and inject the menu.
        await Inject.injectable('injectables/menu.html', menuContainer);

        // Append the menu container to the body.
        document.body.appendChild(menuContainer);

        // Init event listeners here:
        this.initEventListeners();

        // Load the correct data for the info and plugin version.
        document.getElementById('info-adventure-id').textContent = Utils.getAdventureTag() || 'N/A';
        document.getElementById('info-plugin-version').textContent = Utils.getVersion();

        // Handle the slider updating for all sliders.
        document.querySelectorAll('input[type="range"]').forEach(Interface.updateSliderTrack);

        // Log something.
        Log.say("The menu has been initialized.");
    }

    /**
     * Creates all the menu event listeners for the settings, tabs, and more.
     */
    static initEventListeners() {
        // Close menu button.
        Find.menuCloseButton()?.addEventListener('click', () => this.hide());

        document.getElementById('add-entity-btn')?.addEventListener('click', () => {
            this.setTabs('editor', 'entity');
        });

        // Close the menu when you press escape.
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.#isVisible) {
                this.hide();
            }
        });

        // Add more stuff for main tab switching.
        document.addEventListener('click', (e) => {
            const tab = e.target.closest('.menu-tab');
            if (tab) {
                this.#switchMainTab(tab.dataset.tab);
            }
        });

        // Add the stuff for sub menu tab switching.
        document.addEventListener('click', (e) => {
            const subTab = e.target.closest('.sub-menu-tab');
            if (subTab) {
                this.#switchSubTab(subTab.dataset.subtab);
            }
        });

        // Add the stuff for setting interactions.
        document.addEventListener('input', (e) => {
            const target = e.target;

            // Sync the slider and the menu input.
            if (target.type === 'range') {
                const inputId = target.id.replace('-slider', '');
                const numberInput = document.getElementById(inputId);
                if (numberInput) {
                    numberInput.value = target.value;
                }
                Interface.updateSliderTrack(target);
            } else if (target.type === 'number' && document.getElementById(`${target.id}-slider`)) {
                const slider = document.getElementById(`${target.id}-slider`);
                if (slider) {
                    slider.value = target.value;
                    Interface.updateSliderTrack(slider);
                }
            }

            // Handle any setting changes directly.
            if (target.id.startsWith('setting-')) {
                this.#handleSettingChange(target);
            }
        });

        // TODO: Add reset button stuff to this.
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('reset-btn')) {
                const targetId = e.target.dataset.target;
                this.#resetSetting(targetId);
            }
        });
    }

    /**
     * Ensures the menu and backdrop are visible by adding the 'visible' class.
     */
    static async show() {
        if (this.#isVisible) return;

        // Ensure menu is initialized
        if (!Find.mainMenu) {
            await this.init();
        }

        // Show both the backdrop and the menu.
        Find.backdrop().classList.add('visible');
        Find.mainMenu().classList.add('visible');

        Utils.fixVampire(); // Dracula was here.

        // This is actually kinda important, since it ensures that the subtask refreshes when you change adventures for example.
        // If this wasn't called then you would see the old entities from another adventure until you clicked any other subtab.
        // this.#switchSubTab(this.getCurrentSubTab());
        this.setTabs('entities', 'characters');

        // The menu is now visible.
        this.#isVisible = true;

        // Log something.
        Log.say("Extension is now visible.");
    }

    /**
     * Hides the menu and backdrop by removing the 'visible' class.
     */
    static hide() {
        if (!this.#isVisible) return; // Return if already hidden.

        // Hide both the backdrop and the menu.
        Find.backdrop().classList.remove('visible');
        Find.mainMenu().classList.remove('visible');

        // Give Dracula back.
        Utils.addVampireBack();

        // The menu is now hidden.
        this.#isVisible = false;

        // Log something.
        Log.say("Extension is now hidden.");
    }

    /**
     * Flips the visibility state of the menu.
     */
    static toggle() {
        if (this.#isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    static #loadVariables(container) {
        const elements = container.querySelectorAll('[variable]');

        elements.forEach(element => {
            const variable = element.getAttribute('variable');
            const storedValue = Storage.getVariable(variable);

            Interface.setElementValue(element, storedValue);
        });

        Log.say(`Loaded ${elements.length} variables from storage.`);
    }

    /**
     * Handle setting changes
     */
    static #handleSettingChange(element) {
        const variableName = element.getAttribute('variable');
        if (!variableName) return;

        const value = Interface.getElementValue(element);
        Storage.saveVariable(variableName, value);
    }

    static async setTabs(mainTabName, subTabName) {
        await this.#switchMainTab(mainTabName);
        if (subTabName) {
            await this.#switchSubTab(subTabName);
        }
    }

    /**
     * Reset a setting to default value
     */
    static #resetSetting(settingId) {
        const input = document.getElementById(settingId);
        if (!input) return;

        const variableName = input.getAttribute('variable');
        const defaultValue = Storage.getVariableDefault(variableName);

        if (defaultValue !== undefined) {
            const slider = document.getElementById(`${settingId}-slider`);

            Interface.setElementValue(input, defaultValue);
            if (slider) {
                Interface.setElementValue(slider, defaultValue);
                Interface.updateSliderTrack(slider);
            }

            this.#handleSettingChange(input);
            Log.say(`Reset setting: ${settingId} to ${defaultValue}`);
        }
    }

    static async #switchMainTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.menu-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tabName}-tab`);
        });

        // Reset sub-tabs to first option
        const activePanel = document.querySelector(`#${tabName}-tab`);
        if (activePanel) {
            const firstSubTab = activePanel.querySelector('.sub-menu-tab');
            if (firstSubTab) {
                await this.#switchSubTab(firstSubTab.dataset.subtab);
            }
        }

        Log.say(`Switched to ${tabName} tab.`);
    }

    static async #switchSubTab(subTabName) {
        Log.say(`Switched to ${subTabName} sub-tab.`); // Say which sub-tab was switched to.

        // Update all the sub tab buttons.
        document.querySelectorAll('.sub-menu-tab').forEach(subTab => {
            subTab.classList.toggle('active', subTab.dataset.subtab === subTabName);
        });

        // Update all the sub tab panels.
        document.querySelectorAll('.subtab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${subTabName}-subtab`);
        });

        // Get the actual subtab element.
        const panel = document.getElementById(`${subTabName}-subtab`);

        if (panel) this.#loadVariables(panel);

        // Do the event stuff for the sub tab switching.
        onSubTabSwitched(subTabName, panel)
    }

    /**
     * Get current active tab
     */
    static getCurrentTab() {
        const activeTab = document.querySelector('.menu-tab.active');
        return activeTab?.dataset.tab || null;
    }

    /**
     * Get current active sub-tab
     */
    static getCurrentSubTab() {
        const activeSubTab = document.querySelector('.sub-menu-tab.active');
        return activeSubTab?.dataset.subtab || null;
    }

    /**
     * Check if menu is visible
     */
    static get isVisible() {
        return this.#isVisible;
    }
}