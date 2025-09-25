"use strict";

class Utils {
    static getAdventureId() {
        const match = window.location.pathname.match(/adventure\/([^\/]+)/);
        return match ? match[1] : null;
    }

    static printNeat(message) {
        const style = [
            'font-weight: bold',
            'color: #f8ae2c'
        ].join(';');
        console.log('%cDungeon Extension:%c ' + message, style, '');
    }

    static escapeRegExp(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    static async hardRefresh() {
        await Store.loadSettings();
        await Store.loadCharacters();
        Settings.applyStyles();
        TextEffects.reloadAndApply();
    }

    static freeze(excludeId) {
        document.getElementById('extension-backdrop')?.classList.add('visible');

        const selectors = 'body > div, body > main, body > header, body > footer';
        document.querySelectorAll(selectors).forEach(element => {
            if (element.id !== excludeId && !element.querySelector(`#${excludeId}`)) {
                element.setAttribute('inert', '');
            }
        });
    }

    static unfreeze() {
        document.getElementById('extension-backdrop')?.classList.remove('visible');

        document.querySelectorAll('[inert]').forEach(element => {
            element.removeAttribute('inert');
        });
    }

    static async resizeImage(dataUrl, width, height, quality = 1.0) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                const sourceSize = Math.min(img.width, img.height);
                const sx = (img.width - sourceSize) / 2;
                const sy = (img.height - sourceSize) / 2;
                ctx.drawImage(img, sx, sy, sourceSize, sourceSize, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = reject;
            img.src = dataUrl;
        });
    }

    static sanitizeUrl(url) {
        if (!url) return '';

        const validStarts = [
            'https://',
            'http://',
            'data:image/png;base64,',
            'data:image/jpeg;base64,',
            'data:image/gif;base64,',
            'data:image/webp;base64,'
        ];

        if (validStarts.some(start => url.startsWith(start))) {
            return url;
        }

        return '';
    }

    static sanitizeColor(color) {
        if (!color) return null;
        const s = new Option().style;
        s.color = color;
        return s.color ? color : null;
    }

    static sanitizeString(str) {
        if (typeof str !== 'string') return str;
        const parser = new DOMParser();
        const doc = parser.parseFromString(str, 'text/html');
        return doc.body.textContent || "";
    }

    static sanitizeImportedJSON(importObject) {
        if (!importObject || typeof importObject.data !== 'object' ||
            !Array.isArray(importObject.data.characters) ||
            !Array.isArray(importObject.data.notes)) {
            throw new Error("Invalid file format or missing required data arrays.");
        }

        const sanitizedChars = importObject.data.characters.map((char, index) => {
            if (!char.id || !char.name) throw new Error(`Character at index ${index} is missing required 'id' or 'name'.`);

            let portraits = [];
            if (char.portraits && Array.isArray(char.portraits)) {
                portraits = char.portraits.map(p => ({
                    iconUrl: Utils.sanitizeUrl(p.iconUrl || p.thumbnail),
                    fullUrl: Utils.sanitizeUrl(p.fullUrl || p.full)
                }));
            } else if (char.portraitUrls && Array.isArray(char.portraitUrls)) { // Older legacy.
                portraits = char.portraitUrls.map(url => ({ iconUrl: Utils.sanitizeUrl(url), fullUrl: Utils.sanitizeUrl(url) }));
            } else if (char.portraitUrl) { // Older older legacy.
                const url = Utils.sanitizeUrl(char.portraitUrl);
                portraits = [{ iconUrl: url, fullUrl: url }];
            }

            return {
                ...char,
                name: Utils.sanitizeString(char.name),
                nicknames: (char.nicknames || []).map(Utils.sanitizeString),
                portraits: portraits,
                activePortraitIndex: char.activePortraitIndex || 0,
                color: Utils.sanitizeColor(char.color),
                colorMode: char.colorMode || 'shared',
                pickMode: char.pickMode || 'trigger',
            };
        });

        const sanitizedNotes = importObject.data.notes.map((note, index) => {
            if (!note.id || typeof note.text === 'undefined') throw new Error(`Note at index ${index} is missing required 'id' or 'text'.`);
            return {
                ...note,
                text: Utils.sanitizeString(note.text),
                tags: (note.tags || []).map(Utils.sanitizeString),
                color: Utils.sanitizeColor(note.color),
            };
        });

        return {
            ...importObject,
            data: {
                characters: sanitizedChars,
                notes: sanitizedNotes,
            }
        };
    }
}