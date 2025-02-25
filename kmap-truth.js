// K-Map Truth Table Functionality
class KMapTruth extends KMapGrid {
    constructor(numVars = 4) {
        super(numVars);
        this.initializeTruthTable();
    }

    initializeTruthTable() {
        const tbody = this.elements.truthTableBody;
        tbody.innerHTML = '';

        // Update variable column visibility in header
        const varCols = document.querySelectorAll('.truth-table thead tr th:not(:first-child):not(:last-child)');
        varCols.forEach((col, i) => col.style.display = i < this.numVars ? '' : 'none');

        const fragment = document.createDocumentFragment();
        for (let i = 0; i < this.size; i++) {
            const row = document.createElement('tr');
            row.dataset.rowIndex = i;

            const binary = i.toString(2).padStart(this.numVars, '0');
            const cells = [
                this.createTableCell(i, 'row-id'),
                ...Array.from({ length: 4 }, (_, j) =>
                    this.createTableCell(j < this.numVars ? binary[j] : '', '', j < this.numVars)),
                this.createTableCell('0', '', true, i)
            ];

            row.append(...cells);
            fragment.appendChild(row);
        }
        tbody.appendChild(fragment);
    }

    createTableCell(text, className = '', show = true, index = null) {
        const td = document.createElement('td');
        td.textContent = text;
        if (className) td.classList.add(className);
        if (!show) td.style.display = 'none';
        if (index !== null) {
            td.dataset.index = index;
            td.dataset.state = '0';
            td.addEventListener('click', () => this.toggleTruth(td));
        }
        return td;
    }

    toggleTruth(cell) {
        const newState = this.cycleState(cell.dataset.state);
        this.applyState(cell, newState, false);

        const index = parseInt(cell.dataset.index);
        const linkedCell = this.elements.grid.querySelector(`.cell[data-index="${index}"]`);

        if (linkedCell) {
            this.applyState(linkedCell, newState);
        }

        this.grid[index] = newState;
        this.solve();
    }

    // Override clear to handle truth table specific elements
    clear() {
        super.clear();

        // Clear truth table cells
        this.elements.truthTableBody.querySelectorAll('td[data-index]').forEach(cell => {
            this.applyState(cell, '0', false);
        });
    }

    // Override setAllStates to handle truth table specific elements
    setAllStates(value) {
        super.setAllStates(value);

        // Update truth table cells
        this.elements.truthTableBody.querySelectorAll('td[data-index]').forEach(cell =>
            this.applyState(cell, value, false));
    }

    onVariableChange(newVars) {
        super.onVariableChange(newVars);
        this.initializeTruthTable();
    }
}

// Export the class
window.KMapTruth = KMapTruth;
