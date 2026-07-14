const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Build a mock DOM inside the VM context.
const context = {
    console,
    setTimeout,
    clearTimeout,
    window: undefined, // will point to the context itself
    document: undefined
};

// Track document-level click listeners.
const listeners = [];

function mockElement() {
    return {
        innerHTML: '',
        textContent: '',
        style: {},
        dataset: {},
        classList: {
            _classes: new Set(),
            add(c) { this._classes.add(c); },
            remove(...cs) { cs.forEach(c => this._classes.delete(c)); },
            toggle(c) { this._classes.has(c) ? this._classes.delete(c) : this._classes.add(c); },
            contains(c) { return this._classes.has(c); }
        },
        querySelectorAll() { return []; },
        contains() { return false; },
        addEventListener() {},
        removeEventListener() {},
        getAttribute() { return null; },
        setAttribute() {}
    };
}

context.document = {
    getElementById: () => mockElement(),
    querySelector: () => null,
    addEventListener(type, fn) {
        if (type === 'click') listeners.push(fn);
    },
    removeEventListener(type, fn) {
        if (type === 'click') {
            const i = listeners.indexOf(fn);
            if (i !== -1) listeners.splice(i, 1);
        }
    },
    get activeListeners() { return listeners.length; }
};

context.window = context;
context.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
};

// KMapSolver stubs needed by initializeLayouts.
context.window.KMapSolver = {
    KMapGrayCodes: new Map([[2, {}], [3, {}], [4, {}]]),
    KMapBinaryLayouts: new Map([[2, {}], [3, {}], [4, {}]])
};

vm.createContext(context);

const sourceFile = process.argv[2]
    ? path.resolve(__dirname, process.argv[2])
    : path.resolve(__dirname, '../kmap-interface.js');
const expectedListeners = parseInt(process.argv[3], 10) || 1;
const source = fs.readFileSync(sourceFile, 'utf8');
vm.runInContext(source, context);

// Stub heavy DOM methods so the constructor does not need a full DOM.
vm.runInContext(`
KMapInterface.prototype.initializeUI = function() {};
KMapInterface.prototype.initializeTruthTable = function() {};
KMapInterface.prototype.setupEventListeners = function() {};
KMapInterface.prototype.clear = function() {};
KMapInterface.prototype.updateGroupsFromTerms = function() {};
`, context);

const instance = vm.runInContext('new KMapInterface()', context);

const result = {
    solutions: ['A + B', 'C + D'] // length > 1 triggers the dropdown
};

for (let i = 1; i <= 10; i++) {
    instance.updateSolution(result);
    const active = context.document.activeListeners;
    console.log(`After updateSolution call ${i}: document click listeners = ${active}`);
}

const final = context.document.activeListeners;
if (final !== expectedListeners) {
    console.error(`FAIL: expected ${expectedListeners} listener(s), got ${final}`);
    process.exit(1);
}

console.log(`PASS: updateSolution ended with ${final} document click listener(s)`);
