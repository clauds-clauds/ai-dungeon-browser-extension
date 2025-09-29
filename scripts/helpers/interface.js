"use strict";

class Interface {
    static getElementValue(element) {
        switch (element.type) {
            case 'checkbox':
                return element.checked;
            case 'range':
            case 'number':
                return parseFloat(element.value);
            default:
                return element.value;
        }
    }

    static setElementValue(element, value) {
        switch (element.type) {
            case 'checkbox':
                element.checked = value === 'true' || value === true;
                break;
            case 'range':
            case 'number':
                element.value = value;
                break;
            case 'color':
                element.value = value;
                break;
            default:
                element.value = value;
        }
    }

    static updateSliderTrack(slider) {
        const variable = slider.getAttribute('variable');
        const value = variable ? Storage.getVariable(variable) : slider.value;

        const min = slider.min || 0;
        const max = slider.max || 100;
        const percentage = ((value - min) / (max - min)) * 100;

        // TODO: Fix this!
        // const bg = `linear-gradient(to right, var(--c-primary) ${percentage}%, var(--c-core2) ${percentage}%)`;
        // slider.style.setProperty('--track-background', bg);
    }
}