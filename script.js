let currentSize = 4;
let kmap = [];
let sopExpression = [];
let posExpression = [];
function solveExpression(selector, outputId, variables) {
    const minterms = [...document.querySelectorAll(selector)]
        .map((el, i) => el.getAttribute('data-state') === '1' ? i : null)
        .filter(i => i !== null);

    const sop = generateSOP(minterms, variables);

    document.getElementById(outputId).innerText = sop || 'No valid expression';
}

function solveKMap() {
    solveExpression('.kmap-cell', 'kmap-output', 'ABCD');
}

function solveTruthTable() {
    solveExpression('.truth-table-cell[data-state]', 'truth-table-output', 'ABC');
}

function generatePOS(minterms, variables) {
    if (!minterms.length) return '';
    return minterms.map(term => {
        let binary = term.toString(2).padStart(variables.length, '0');
        return Array.from(binary).map((bit, idx) => bit === '1' ? variables[idx] : variables[idx] + '\u0304').join('');
    }).join(', ');
}

function generateSOP(minterms, variables) {
    if (!minterms.length) return '';
    const pos = generatePOS(minterms, variables);
    sopExpression = pos;
    return sopExpression;
}

function createKMapGrid() {
    const kmapGrid = document.createElement('div');
    kmapGrid.classList.add('block');
    for (let i = 0; i < currentSize; i++) {
        const row = document.createElement('div');
        row.classList.add('d-flex');
        for (let j = 0; j < currentSize; j++) {
            const cell = document.createElement('div');
            cell.classList.add('kmap-cell');
            cell.setAttribute('data-state', kmap[i * currentSize + j] || '0');
            cell.innerText = kmap[i * currentSize + j] || '0';
            row.appendChild(cell);
        }
        kmapGrid.appendChild(row);
    }

    return kmapGrid;
}

function createTruthTable() {
    const truthTable = document.createElement('div');
    truthTable.classList.add('block', 'flex-column');

    const headerRow = document.createElement('div');
    headerRow.classList.add('d-flex');

    Array.from({ length: currentSize }).forEach((_, idx) => {
        const header = String.fromCharCode(65 + idx);
        const cell = document.createElement('div');
        cell.classList.add('truth-table-cell');
        cell.innerText = header;
        headerRow.appendChild(cell);
    });

    const outputHeader = document.createElement('div');
    outputHeader.classList.add('truth-table-cell');
    outputHeader.innerText = 'Output';
    headerRow.appendChild(outputHeader);

    truthTable.appendChild(headerRow);

    for (let i = 0; i < Math.pow(2, currentSize); i++) {
        const row = document.createElement('div');
        row.classList.add('d-flex');

        Array.from({ length: currentSize }).forEach((_, idx) => {
            const cell = document.createElement('div');
            cell.classList.add('truth-table-cell');
            cell.innerText = (i >> idx) & 1;
            row.appendChild(cell);
        });

        const outputCell = document.createElement('div');
        outputCell.classList.add('truth-table-cell');
        outputCell.setAttribute('data-state', sopExpression[i] || '0');
        outputCell.innerText = sopExpression[i] || '0';
        row.appendChild(outputCell);

        truthTable.appendChild(row);
    }

    return truthTable;
}

document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('#kmap .card-body').prepend(createKMapGrid());

    const kmapCells = document.querySelectorAll('.kmap-cell');

    kmapCells.forEach((cell, index) => {
        cell.addEventListener('click', () => {
            const states = ['0', '1', 'X'];
            let currentState = cell.getAttribute('data-state');
            let nextStateIndex = (states.indexOf(currentState) + 1) % states.length;
            cell.setAttribute('data-state', states[nextStateIndex]);
            cell.textContent = states[nextStateIndex];
            kmap[index] = states[nextStateIndex];
            solveKMap();
        });
    });

    document.querySelector('#truthtable .card-body').prepend(createTruthTable());

    const truthTableCells = document.querySelectorAll('.truth-table-cell[data-state]');

    truthTableCells.forEach((cell, index) => {
        cell.addEventListener('click', () => {
            const states = ['0', '1', 'X'];
            let currentState = cell.getAttribute('data-state');
            let nextStateIndex = (states.indexOf(currentState) + 1) % states.length;
            cell.setAttribute('data-state', states[nextStateIndex]);
            cell.textContent = states[nextStateIndex];
            sopExpression[index] = states[nextStateIndex];
            solveTruthTable();
        });
    });
});

