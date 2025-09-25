"use strict";

class Panel {
    static prepare(panelId) {
        let panel = document.getElementById(panelId);
        Utils.freeze(panelId);
        return panel;
    }

    static close(id, refreshHighlights = false) {
        const panel = document.getElementById(id);
        if (panel) panel.classList.remove('visible');
        Utils.unfreeze();
        if (refreshHighlights) TextEffects.reloadAndApply();
    }
}