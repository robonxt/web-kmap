// DOM Utility Functions
export function createElement(tag, options = {}) {
    const element = document.createElement(tag);
    
    if (options.className) {
        element.className = options.className;
    }
    
    if (options.textContent) {
        element.textContent = options.textContent;
    }
    
    if (options.dataset) {
        Object.entries(options.dataset).forEach(([key, value]) => {
            element.dataset[key] = value;
        });
    }
    
    if (options.attributes) {
        Object.entries(options.attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
    }
    
    if (options.children) {
        options.children.forEach(child => element.appendChild(child));
    }
    
    if (options.eventListeners) {
        Object.entries(options.eventListeners).forEach(([event, handler]) => {
            element.addEventListener(event, handler);
        });
    }
    
    return element;
}

export function dispatchCustomEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, { detail });
    document.dispatchEvent(event);
}

export function getComputedValue(element, property, fallback) {
    return window.getComputedStyle(element).getPropertyValue(property) || fallback;
}

export default {
    createElement,
    dispatchCustomEvent,
    getComputedValue
};
