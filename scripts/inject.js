"use strict";

class Inject {
    static backdrop() {
        if (document.getElementById('extension-backdrop')) return;
        const backdrop = document.createElement('div');
        backdrop.id = 'extension-backdrop';
        document.body.appendChild(backdrop);
        Utils.printNeat('Injected backdrop.');
    }

    static contextMenuButton(buttonSettings) {
        const { id, label, icon, exitGameButton, listContainer, onClick } = buttonSettings;
        if (document.getElementById(id)) return;

        const button = document.createElement('div');
        button.id = id;
        button.className = exitGameButton.className;
        button.setAttribute('role', 'button');
        button.setAttribute('aria-label', label);
        button.setAttribute('tabindex', '0');

        const originalIconContainer = exitGameButton.querySelector('div');
        const originalTextSpan = exitGameButton.querySelector('span.is_ButtonText');
        if (!originalIconContainer || !originalTextSpan) return;

        const iconContainer = document.createElement('div');
        iconContainer.className = originalIconContainer.className;

        const iconSpan = document.createElement('span');
        iconSpan.className = Config.ID_FONT_SYMBOLS_CLASS;
        iconSpan.textContent = icon;
        iconSpan.style.fontSize = '18px';

        const textSpan = document.createElement('span');
        textSpan.className = originalTextSpan.className;
        textSpan.textContent = label;

        iconContainer.appendChild(iconSpan);
        button.appendChild(iconContainer);
        button.appendChild(textSpan);

        button.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            if (onClick) onClick();
        });

        listContainer.insertBefore(button, exitGameButton);
    }

    static customContextMenuElements() {
        const exitGameButton = document.querySelector(Config.ID_EXIT_GAME_BUTTON);
        const listContainer = exitGameButton ? exitGameButton.parentElement : null;
        if (!listContainer) return;

        const buttonSettings = {
            id: 'custom-btn-main-menu',
            label: 'Extension Menu',
            icon: 'widgets',
            onClick: Menu.show,
            exitGameButton,
            listContainer
        };

        Inject.contextMenuButton(buttonSettings);
    }

    static async panel(panelPath) {
        const url = chrome.runtime.getURL(panelPath);
        const html = await (await fetch(url)).text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const panel = doc.querySelector('div');
        if (panel) document.body.appendChild(panel);
        return panel;
    }

    static symbols() {
        const injectId = Config.ID_FONT_SYMBOLS_INJECT;
        if (!document.getElementById(injectId)) {
            const browserApi = typeof browser !== 'undefined' ? browser : chrome;
            const fontURL = browserApi.runtime.getURL("fonts/material_symbols_rounded.ttf");
            const fontStyleSheet = document.createElement("style");
            fontStyleSheet.id = injectId;
            fontStyleSheet.textContent = `@font-face { font-family: 'Material Symbols Rounded'; font-style: normal; font-weight: 100 700; src: url('${fontURL}') format('truetype'); }`;
            document.head.appendChild(fontStyleSheet);
        }
    }

    static tooltip() {
        if (document.getElementById('portrait-hover-tooltip')) return;
        const tooltip = document.createElement('div');
        tooltip.id = 'portrait-hover-tooltip';

        const img = document.createElement('img');
        const prevBtn = document.createElement('button');
        prevBtn.id = 'tooltip-prev-btn';
        prevBtn.className = 'tooltip-nav-btn';
        prevBtn.innerHTML = '<span class="material-symbols-rounded">arrow_back_ios</span>';

        const nextBtn = document.createElement('button');
        nextBtn.id = 'tooltip-next-btn';
        nextBtn.className = 'tooltip-nav-btn';
        nextBtn.innerHTML = '<span class="material-symbols-rounded">arrow_forward_ios</span>';

        tooltip.appendChild(img);
        tooltip.appendChild(prevBtn);
        tooltip.appendChild(nextBtn);
        document.body.appendChild(tooltip);
    }
}