'use strict';

const dataStore = {
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
        notesPerPage: 16,
        defaultNoteColor: '#3a4045',
        autoSaveEnabled: true,
        autoResizeEnabled: true,
        portraitFallback: false
    },
    ui: {
        editingCharacterId: null,
    }
};