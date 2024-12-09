let currentSize = 4;
let kmap = [];
let sopExpression = [];
let posExpression = [];
let globalState = []; // Global state to track all cell values

function initializeGlobalState(size) {
    const numCells = Math.pow(2, size);
    // console.log(`Initializing global state with size: ${size}`);
    // console.log(`Number of cells: ${numCells}`);
    globalState = new Array(numCells).fill('0');
    // console.log(`Global state initialized: ${globalState}`);
}

function updateGlobalState(index, value) {
    globalState[index] = value;
    updateKMapFromState();
    updateTruthTableFromState();
    updateOutputs();
    updateCellColors();
}

function updateKMapFromState() {
    const kmapCells = document.querySelectorAll('.kmap-cell .kmap-cell-value');
    kmapCells.forEach((cell, index) => {
        cell.innerText = globalState[index];
        cell.parentElement.setAttribute('data-state', globalState[index]);
    });
    // console.log('K-map updated from global state:', globalState);
}

function updateTruthTableFromState() {
    const outputCells = document.querySelectorAll('.truth-table-output');
    outputCells.forEach((cell, index) => {
        cell.innerText = globalState[index];
        cell.setAttribute('data-state', globalState[index]);
    });
}

function getBinaryString(num, bits) {
    return num.toString(2).padStart(bits, '0');
}

function createTruthTable() {
    const numVars = Math.log2(globalState.length);
    const table = document.createElement('table');
    table.classList.add('table', 'table-bordered');

    // Create header row
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    // Add variable headers (A, B, C, D)
    for (let i = 0; i < numVars; i++) {
        const th = document.createElement('th');
        th.innerText = String.fromCharCode(65 + i);
        headerRow.appendChild(th);
    }
    
    // Add output header
    const outputHeader = document.createElement('th');
    outputHeader.innerText = 'Output';
    headerRow.appendChild(outputHeader);
    
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create table body
    const tbody = document.createElement('tbody');
    for (let i = 0; i < Math.pow(2, numVars); i++) {
        const row = document.createElement('tr');
        
        // Add variable columns (0s and 1s)
        const binary = getBinaryString(i, numVars);
        for (let j = 0; j < numVars; j++) {
            const td = document.createElement('td');
            td.innerText = binary[j];
            row.appendChild(td);
        }
        
        // Add output column (clickable)
        const outputCell = document.createElement('td');
        outputCell.classList.add('truth-table-output');
        outputCell.setAttribute('data-state', globalState[i]);
        outputCell.innerText = globalState[i];
        outputCell.addEventListener('click', function() {
            const currentState = this.getAttribute('data-state');
            let newState;
            if (currentState === '0') {
                newState = '1';
            } else if (currentState === '1') {
                newState = 'X';
            } else {
                newState = '0';
            }
            updateGlobalState(i, newState);
        });
        row.appendChild(outputCell);
        
        tbody.appendChild(row);
    }
    table.appendChild(tbody);
    return table;
}

function createKMapGrid() {
    const kmapGrid = document.createElement('div');
    kmapGrid.classList.add('block');
    
    const numVars = Math.log2(globalState.length);
    let rows = 2, cols = 2;
    
    if (numVars === 3) {
        rows = 2;
        cols = 4;
    } else if (numVars === 4) {
        rows = 4;
        cols = 4;
    }

    // Create the grid container with headers
    const gridContainer = document.createElement('div');
    gridContainer.classList.add('kmap-container');

    // Create column headers
    const colHeaderRow = document.createElement('div');
    colHeaderRow.classList.add('kmap-header-row');

    const colHeaders = getColumnHeaders(numVars);
    colHeaders.forEach(header => {
        const headerCell = document.createElement('div');
        headerCell.classList.add('kmap-header-cell');
        headerCell.innerHTML = header;
        colHeaderRow.appendChild(headerCell);
    });
    
    gridContainer.appendChild(colHeaderRow);

    // Create rows with row headers
    const rowHeaders = getRowHeaders(numVars);
    for (let i = 0; i < rows; i++) {
        const rowContainer = document.createElement('div');
        rowContainer.classList.add('kmap-row-container');

        // Add row header
        const rowHeader = document.createElement('div');
        rowHeader.classList.add('kmap-header-cell');
        rowHeader.innerHTML = rowHeaders[i];
        rowContainer.appendChild(rowHeader);

        // Add cells
        const row = document.createElement('div');
        row.classList.add('kmap-row');
        for (let j = 0; j < cols; j++) {
            const cell = document.createElement('div');
            cell.classList.add('kmap-cell');
            const index = i * cols + j;
            cell.setAttribute('data-state', globalState[index]);
            
            const valueContainer = document.createElement('div');
            valueContainer.classList.add('kmap-cell-value');
            valueContainer.innerText = globalState[index];
            
            const indexContainer = document.createElement('div');
            indexContainer.classList.add('kmap-cell-index');
            indexContainer.innerText = index;
            
            cell.appendChild(valueContainer);
            cell.appendChild(indexContainer);
            
            // Add click handler
            cell.addEventListener('click', function() {
                const currentState = this.getAttribute('data-state');
                let newState;
                if (currentState === '0') {
                    newState = '1';
                } else if (currentState === '1') {
                    newState = 'X';
                } else {
                    newState = '0';
                }
                updateGlobalState(index, newState);
            });
            
            row.appendChild(cell);
        }
        rowContainer.appendChild(row);
        gridContainer.appendChild(rowContainer);
    }

    kmapGrid.appendChild(gridContainer);
    return kmapGrid;
}

function updateGridSize(size) {
    const numVars = parseInt(size);
    initializeGlobalState(numVars);

    // Clear existing grids
    document.getElementById('kmap-grid').innerHTML = '';
    document.getElementById('truth-table-grid').innerHTML = '';

    // Recreate grids with new size
    document.getElementById('kmap-grid').appendChild(createKMapGrid());
    document.getElementById('truth-table-grid').appendChild(createTruthTable());
    updateCellColors();
}

function solveExpression(selector, outputId, variables) {
    const cells = [...document.querySelectorAll(selector)];
    const minterms = cells
        .map((cell, i) => {
            const value = cell.querySelector('.kmap-cell-value').innerText;
            return value === '1' || value === 'X' ? i : null;
        })
        .filter(i => i !== null);

    const sop = generateSOP(minterms, variables);
    document.getElementById(outputId).innerText = sop || '0';
}

function solveKMap() {
    updateOutputs();
}

function solveTruthTable() {
    solveExpression('.kmap-cell', 'kmap-output', 'ABC');
}

function generatePOS(minterms, variables) {
    if (!minterms.length) return '';
    return minterms.map(term => {
        let binary = term.toString(2).padStart(variables.length, '0');
        return Array.from(binary).map((bit, idx) => bit === '1' ? variables[idx] : variables[idx] + '\u0304').join('');
    }).join(', ');
}

function findGroups(kmap, rows, cols) {
    const groups = [];
    const covered = new Set();
    
    for (let size of [8, 4, 2, 1]) {
        const sizeRows = size === 8 ? 4 : (size === 4 ? 2 : 1);
        const sizeCols = size / sizeRows;

        // Prevent checking groups that exceed the KMap bounds
        if (sizeRows > rows || sizeCols > cols) {
            continue;
        }

        for (let i = 0; i <= rows - sizeRows; i++) {
            for (let j = 0; j <= cols - sizeCols; j++) {
                if (isValidGroup(i, j, sizeRows, sizeCols, kmap, rows, cols, covered)) {
                    const group = {
                        startRow: i,
                        startCol: j,
                        rows: sizeRows,
                        cols: sizeCols,
                        cells: getCellsInGroup(i, j, sizeRows, sizeCols, rows, cols)
                    };
                    groups.push(group);
                    group.cells.forEach(cell => covered.add(cell));
                }
            }
        }
    }
    
    return groups;
}

function isValidGroup(startRow, startCol, numRows, numCols, kmap, totalRows, totalCols, covered) {
    for (let i = 0; i < numRows; i++) {
        for (let j = 0; j < numCols; j++) {
            const row = (startRow + i) % totalRows;
            const col = (startCol + j) % totalCols;
            const index = row * totalCols + col;
            
            if (covered.has(index) || (kmap[index] !== '1' && kmap[index] !== 'X')) {
                // console.log(`Invalid cell at (${row}, ${col}) - Index: ${index}`);
                return false;
            }
        }
    }
    return true;
}

function getCellsInGroup(startRow, startCol, numRows, numCols, totalRows, totalCols) {
    const cells = [];
    for (let i = 0; i < numRows; i++) {
        for (let j = 0; j < numCols; j++) {
            const row = (startRow + i) % totalRows;
            const col = (startCol + j) % totalCols;
            cells.push(row * totalCols + col);
        }
    }
    return cells;
}

function getBinaryForCell(cellIndex, numVars, rows, cols) {
    const row = Math.floor(cellIndex / cols);
    const col = cellIndex % cols;
    
    const grayRow = row ^ (row >> 1);
    const grayCol = col ^ (col >> 1);
    
    let binary = '';
    if (numVars === 2) {
        binary = (grayRow).toString(2).padStart(1, '0') + 
                (grayCol).toString(2).padStart(1, '0');
    } else if (numVars === 3) {
        binary = (grayRow).toString(2).padStart(1, '0') + 
                (grayCol).toString(2).padStart(2, '0');
    } else if (numVars === 4) {
        binary = (grayRow).toString(2).padStart(2, '0') + 
                (grayCol).toString(2).padStart(2, '0');
    }
    
    return binary.padStart(numVars, '0');
}

function generateTermForGroup(group, variables, rows, cols) {
    const numVars = variables.length;
    const binaryCells = group.cells.map(cell => getBinaryForCell(cell, numVars, rows, cols));
    
    const term = [];
    for (let i = 0; i < numVars; i++) {
        const bit = binaryCells[0][i];
        const isConstant = binaryCells.every(binary => binary[i] === bit);
        
        if (isConstant) {
            term.push(bit === '1' ? variables[i] : variables[i] + '\u0304');
        }
    }
    
    return term.length > 0 ? term.join('') : '1';
}
function generateSOP(minterms, variables) {
    if (!minterms.length) return '0';
    if (minterms.length === Math.pow(2, variables.length)) return '1';
    
    const rows = Math.pow(2, Math.floor(variables.length / 2));
    const cols = Math.pow(2, Math.ceil(variables.length / 2));
    
    const tempKmap = new Array(rows * cols).fill('0');
    minterms.forEach(index => {
        tempKmap[index] = '1';
    });
    // console.log('K-map after population:', tempKmap);
    
    const groups = findGroups(tempKmap, rows, cols);
    if (groups.length === 0) return '0';
    
    const terms = groups.map(group => generateTermForGroup(group, variables, rows, cols));
    return terms.join(' + ') || '0';
}

function getColumnHeaders(numVars) {
    if (numVars === 2) {
        return ['B̅', 'B'];
    } else if (numVars === 3) {
        return ['C̅B̅', 'C̅B', 'CB', 'CB̅'];
    } else {
        return ['C̅D̅', 'C̅D', 'CD', 'CD̅'];
    }
}

function getRowHeaders(numVars) {
    if (numVars === 2) {
        return ['A̅', 'A'];
    } else if (numVars === 3) {
        return ['A̅', 'A'];
    } else {
        return ['A̅B̅', 'A̅B', 'AB', 'AB̅'];
    }
}

function updateOutputs() {
    const kmapCells = [...document.querySelectorAll('.kmap-cell')];
    const numVars = Math.log2(globalState.length);
    const variables = Array.from({ length: numVars }, (_, i) => String.fromCharCode(65 + i));
    
    kmap = kmapCells.map(cell => cell.querySelector('.kmap-cell-value').innerText);
    
    const minterms = kmap
        .map((value, i) => value === '1' || value === 'X' ? i : null)
        .filter(i => i !== null);

    const expression = generateSOP(minterms, variables);
    
    const kmapOutput = document.getElementById('kmap-output');
    const truthTableOutput = document.getElementById('truth-table-output');
    
    const outputContent = `<div class="output-expression">${expression}</div>`;
    
    kmapOutput.innerHTML = outputContent;
    truthTableOutput.innerHTML = outputContent;
}

function updateCellColors() {
    const cells = document.querySelectorAll('.kmap-cell, .truth-table-output');
    cells.forEach(cell => {
        const value = cell.querySelector('.kmap-cell-value') ? cell.querySelector('.kmap-cell-value').textContent.trim() : cell.textContent.trim();
        if (value === '0') {
            cell.style.backgroundColor = '#ffecec';
        } else if (value === '1') {
            cell.style.backgroundColor = '#e6ffe6';
        } else if (value === 'X') {
            cell.style.backgroundColor = '#fff2cc';
        }
    });
}

function setAllValues(value) {
    const numCells = Math.pow(2, currentSize);
    let maxCells;
    switch (currentSize) {
        case 2:
            maxCells = 4;
            break;
        case 3:
            maxCells = 8;
            break;
        case 4:
            maxCells = 16;
            break;
        default:
            console.warn(`Unsupported variable size: ${currentSize}`);
            return;
    }
    if (numCells > maxCells) {
        console.warn(`Attempting to set values for ${numCells} cells, but KMap only supports up to ${maxCells} cells.`);
        return;
    }
    globalState = new Array(numCells).fill(value);
    updateKMapFromState();
    updateTruthTableFromState();
    updateOutputs();
    updateCellColors();
}

document.addEventListener('DOMContentLoaded', function() {
    const variableSelect = document.getElementById('variableSelect');
    variableSelect.addEventListener('change', function() {
        currentSize = parseInt(this.value);
        initializeGlobalState(currentSize);
        updateGridSize(currentSize);
        updateKMapFromState(); // Ensure KMap is refreshed
    });

    document.querySelectorAll('.set-all').forEach(button => {
        button.addEventListener('click', function() {
            const value = this.getAttribute('data-value');
            setAllValues(value);
        });
    });

    currentSize = parseInt(variableSelect.value);
    initializeGlobalState(currentSize);
    updateGridSize(currentSize);
    updateKMapFromState(); // Ensure K-map is updated from global state after initialization
    updateCellColors();
    updateOutputs();
});
