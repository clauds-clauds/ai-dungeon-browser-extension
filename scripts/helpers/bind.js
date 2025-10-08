"use strict";

class Bind {
    static actions(container, includeConditionals = true) {
        const actionButtons = container.querySelectorAll('[data-action]');

        actionButtons.forEach(button => {
            const action = button.dataset.action;
            const [className, methodName] = action.split('.');

            if (!className || !methodName) {
                console.error(`Invalid action format: ${action}`);
                return;
            }

            // Avoid re-adding listeners
            if (button.dataset.actionBound) return;
            button.dataset.actionBound = 'true';

            const targetClass = ActionMap[className];
            if (typeof targetClass?.[methodName] === 'function') {
                button.addEventListener('click', (event) => targetClass[methodName](event));
            } else {
                console.error(`Action not found: ${action}`);
            }
        });

        if (includeConditionals) this.conditionals(container);
    }

    static conditionals(container = document) {
        if (!container) return;

        const elements = container instanceof Element
            ? [
                ...(container.matches?.('[data-hide-if]') ? [container] : []),
                ...container.querySelectorAll('[data-hide-if]')
            ]
            : Array.from(document.querySelectorAll('[data-hide-if]'));

        elements.forEach(element => {
            const expression = element.dataset.hideIf;
            const [className, methodName] = expression?.split('.') ?? [];

            if (!className || !methodName) {
                CustomDebugger.say("Can't bind a malformed conditional!", false, true)
                return;
            }

            const targetClass = ActionMap[className];
            const fn = targetClass?.[methodName];

            if (typeof fn !== 'function') {
                CustomDebugger.say(`Can't bind to ${expression}`, false, true);
                return;
            }

            try {
                const shouldHide = !!fn.call(targetClass, element);
                if (element.dataset.hideIfDisplay == null) {
                    element.dataset.hideIfDisplay = element.style.display || '';
                }

                element.style.display = shouldHide ? 'none' : element.dataset.hideIfDisplay;
                element.hidden = shouldHide;
            } catch (error) {
                CustomDebugger.say(`Failed to evaluate "${expression}"`, false, true);
            }
        });
    }
}