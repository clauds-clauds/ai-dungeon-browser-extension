'use strict';

class Settings extends Panel {
    static applyStyles() {
        const styleId = 'character-highlight-styles';
        let styleElement = document.getElementById(styleId);
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = styleId;
            document.head.appendChild(styleElement);
        }

        const size = parseInt(Store.data.settings.portraitSize, 10) || 28;
        const radius = parseInt(Store.data.settings.borderRadius, 10) || 0;
        const width = parseInt(Store.data.settings.borderWidth, 10) || 0;

        const tooltipMaxWidth = parseInt(Store.data.settings.tooltipMaxWidth, 10) || 256;

        styleElement.textContent = `
            .character-portrait {
                width: ${size}px !important;
                height: ${size}px !important;
                border-radius: ${radius}% !important;
                border: ${width}px solid rgba(255, 255, 255, .3) !important;
            }
            #portrait-hover-tooltip {
                position: fixed;
                z-index: 10000;
                background-color: var(--c-core1, #1b1f22);
                border: 1px solid var(--c-core4, #3a4045);
                border-radius: 8px;
                padding: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
                pointer-events: none;
                opacity: 0;
                max-width: ${tooltipMaxWidth}px !important;
                transition: opacity 0.1s ease-out;
            }
        `;
    }

    static populateSettingsForm() {
        const form = document.getElementById('settings-form');
        if (!form) return;

        const syncInputAndSlider = (inputId, sliderId, value) => {
            const input = document.getElementById(inputId);
            const slider = document.getElementById(sliderId);
            if (input && slider) {
                input.value = value;
                slider.value = value;
                Settings.updateSliderTrack(slider);
            }
        };

        document.getElementById('setting-default-color').value = Store.data.settings.defaultColor;
        document.getElementById('setting-shared-color').value = Store.data.settings.sharedColor;
        
        syncInputAndSlider('setting-portrait-size', 'setting-portrait-size-slider', Store.data.settings.portraitSize);
        syncInputAndSlider('setting-portrait-size-limit', 'setting-portrait-size-limit-slider', Store.data.settings.portraitSizeLimit);
        syncInputAndSlider('setting-border-radius', 'setting-border-radius-slider', Store.data.settings.borderRadius);
        syncInputAndSlider('setting-border-width', 'setting-border-width-slider', Store.data.settings.borderWidth);
        syncInputAndSlider('setting-tooltip-max-width', 'setting-tooltip-max-width-slider', Store.data.settings.tooltipMaxWidth);
        syncInputAndSlider('setting-tooltip-hide-delay', 'setting-tooltip-hide-delay-slider', Store.data.settings.tooltipHideDelay);

        document.getElementById('setting-autosave').checked = Store.data.settings.autoSaveEnabled;
        document.getElementById('setting-autosize').checked = Store.data.settings.autoResizeEnabled;

        document.getElementById('setting-visible-icons').checked = Store.data.settings.visibleIcons;
        document.getElementById('setting-visible-portraits').checked = Store.data.settings.visiblePortraits;

        document.getElementById('setting-text-color').checked = Store.data.settings.textColor;
        document.getElementById('setting-text-bold').checked = Store.data.settings.textBold;

        document.getElementById('setting-default-note-color').value = Store.data.settings.defaultNoteColor;

        document.getElementById('info-adventure-id').textContent = Utils.getAdventureId() || 'N/A';
        document.getElementById('info-plugin-version').textContent = "Alpha " + chrome.runtime.getManifest().version;

        form.querySelectorAll('input[type="range"]').forEach(Settings.updateSliderTrack);
    }

    static async saveSettings(event) {
        if (event) {
            event.preventDefault();
        }

        Store.data.settings.defaultColor = document.getElementById('setting-default-color').value;
        Store.data.settings.sharedColor = document.getElementById('setting-shared-color').value;
        Store.data.settings.portraitSize = document.getElementById('setting-portrait-size').value;
        Store.data.settings.portraitSizeLimit = document.getElementById('setting-portrait-size-limit').value;

        Store.data.settings.tooltipMaxWidth = document.getElementById('setting-tooltip-max-width').value;
        Store.data.settings.tooltipHideDelay = document.getElementById('setting-tooltip-hide-delay').value;

        Store.data.settings.borderRadius = document.getElementById('setting-border-radius').value;
        Store.data.settings.borderWidth = document.getElementById('setting-border-width').value;

        Store.data.settings.autoSaveEnabled = document.getElementById('setting-autosave').checked;
        Store.data.settings.autoResizeEnabled = document.getElementById('setting-autosize').checked;

        Store.data.settings.visibleIcons = document.getElementById('setting-visible-icons').checked;
        Store.data.settings.visiblePortraits = document.getElementById('setting-visible-portraits').checked;

        Store.data.settings.textColor = document.getElementById('setting-text-color').checked;
        Store.data.settings.textBold = document.getElementById('setting-text-bold').checked;

        Store.data.settings.defaultNoteColor = document.getElementById('setting-default-note-color').value;

        await chrome.storage.local.set({ extensionSettings: Store.data.settings });
        Settings.applyStyles();
    }

    static updateSliderTrack(slider) {
        const min = slider.min || 0;
        const max = slider.max || 100;
        const value = slider.value;
        const percentage = ((value - min) / (max - min)) * 100;
        const bg = `linear-gradient(to right, var(--c-primary) ${percentage}%, var(--c-core2) ${percentage}%)`;
        slider.style.setProperty('--track-background', bg);
    }

    static async show() {
        let panel = Panel.prepare('settings-editor-panel');
        
        if (!panel) {
            Utils.printNeat('Injecting settings panel.');
            panel = await Inject.panel('resources/panels/settings_panel.html');

            document.getElementById('settings-back-to-menu-btn').addEventListener('click', () => {
                Panel.close('settings-editor-panel', true);
                setTimeout(Menu.show, Config.TIME_DELAY_SWITCH);
            });

            document.getElementById('save-settings-btn').addEventListener('click', () => {
                Settings.saveSettings();
            });
            
            const form = document.getElementById('settings-form');

            panel.addEventListener('click', e => { if (e.target === panel) Panel.close('settings-editor-panel', true); });

            form.addEventListener('input', (event) => {
                const target = event.target;

                if (target.type === 'range') {
                    const inputId = target.id.replace('-slider', '');
                    document.getElementById(inputId).value = target.value;
                    Settings.updateSliderTrack(target);
                } else if (target.type === 'number') {
                    const sliderId = `${target.id}-slider`;
                    const slider = document.getElementById(sliderId);
                    if (slider) {
                        slider.value = target.value;
                        Settings.updateSliderTrack(slider);
                    }
                }

                if (event.target.id === 'setting-autosave') {
                    Settings.saveSettings();
                } else if (Store.data.settings.autoSaveEnabled) {
                    Settings.saveSettings();
                }
            });

            form.addEventListener('click', (event) => {
                if (event.target.classList.contains('reset-btn')) {
                    const targetId = event.target.dataset.target;
                    const defaultSettings = new Store().constructor.data.settings;
                    const defaultValue = defaultSettings[targetId.replace('setting-', '').replace(/-\w/g, m => m[1].toUpperCase())];
                    
                    const input = document.getElementById(targetId);
                    const slider = document.getElementById(`${targetId}-slider`);

                    if (input) input.value = defaultValue;
                    if (slider) {
                        slider.value = defaultValue;
                        Settings.updateSliderTrack(slider);
                    }
                    
                    if (Store.data.settings.autoSaveEnabled) {
                        Settings.saveSettings();
                    }
                }
            });
        }

        await Store.loadSettings();
        Settings.populateSettingsForm();
        Settings.applyStyles();

        setTimeout(() => panel.classList.add('visible'), 10);
    }
}
