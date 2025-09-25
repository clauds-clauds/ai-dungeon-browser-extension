'use strict';

class Store {
    static data = {
        characters: [],
        notes: [],
        settings: {
            defaultColor: '#c8aa64',
            sharedColor: '#c8aa64',
            portraitSize: 28,
            portraitSizeLimit: 256,
            tooltipMaxWidth: 256,
            tooltipHideDelay: 400,
            borderRadius: 0,
            borderWidth: 1,
            visibleIcons: true,
            visiblePortraits: true,
            notesPerPage: 16,
            defaultNoteColor: '#3a4045',
            autoSaveEnabled: true,
            autoResizeEnabled: true,
            portraitFallback: false,
            textColor: true,
            textBold: true
        },
        ui: {
            editingCharacterId: null,
        }
    };

    static async loadSettings() {
        const data = await chrome.storage.local.get('extensionSettings');
        Object.assign(Store.data.settings, data.extensionSettings);
    }

    static async loadCharacters() {
        const adventureId = Utils.getAdventureId();

        if (!adventureId) {
            Store.data.characters = [];
            return;
        }

        const storageData = await chrome.storage.local.get(adventureId);
        let characters = storageData[adventureId] || [];

        characters = characters.map(char => {
            if (!char.portraits || typeof char.portraits[0] === 'string' || !char.portraits[0]?.iconUrl) {
                const oldPortraits = char.portraits || char.portraitUrls || (char.portraitUrl ? [char.portraitUrl] : []);
                char.portraits = oldPortraits.map(p => {
                    const url = typeof p === 'string' ? p : (p.thumbnail || p.full);
                    return {
                        id: Date.now() + Math.random(),
                        iconUrl: url,
                        fullUrl: url
                    };
                });
            }
            if (typeof char.activePortraitIndex !== 'number' || char.activePortraitIndex >= char.portraits.length) {
                char.activePortraitIndex = 0;
            }
            delete char.portraitUrl;
            delete char.portraitUrls;
            return char;
        });

        Store.data.characters = characters;
    }
}