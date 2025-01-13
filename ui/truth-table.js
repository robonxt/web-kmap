// Truth Table UI Manager
class TruthTable {
    constructor() {
        this.tbody = document.getElementById('truth-table-body');
        this.size = 16;
        this.values = Array(this.size).fill('0');
        this.initializeTable();
    }

    initializeTable() {
        this.tbody.innerHTML = '';
        
        for (let i = 0; i < this.size; i++) {
            const row = this.createRow(i);
            this.tbody.appendChild(row);
        }
    }

    createRow(index) {
        const row = document.createElement('tr');
        row.dataset.rowIndex = index;
        
        // Add row ID
        const idCell = document.createElement('td');
        idCell.textContent = index;
        idCell.classList.add('row-id');
        row.appendChild(idCell);
        
        // Add input columns (A, B, C, D)
        const binary = index.toString(2).padStart(4, '0');
        for (let j = 0; j < 4; j++) {
            const td = document.createElement('td');
            td.textContent = binary[j];
            row.appendChild(td);
        }
        
        // Add output column
        const outputTd = document.createElement('td');
        outputTd.textContent = '0';
        outputTd.dataset.index = index;
        outputTd.dataset.state = '0';
        outputTd.addEventListener('click', () => this.toggleCell(outputTd));
        row.appendChild(outputTd);
        
        return row;
    }

    toggleCell(cell) {
        const currentState = cell.dataset.state;
        let newState;
        
        switch (currentState) {
            case '0':
                newState = '1';
                cell.textContent = '1';
                break;
            case '1':
                newState = 'X';
                cell.textContent = 'X';
                break;
            default:
                newState = '0';
                cell.textContent = '0';
        }
        
        cell.dataset.state = newState;
        this.values[parseInt(cell.dataset.index)] = newState;
        this.notifyStateChange();
    }

    notifyStateChange() {
        // Dispatch custom event when table state changes
        const event = new CustomEvent('truth-table-change', {
            detail: { values: this.values }
        });
        document.dispatchEvent(event);
    }

    getState() {
        return this.values;
    }

    setState(newState) {
        this.values = newState;
        Array.from(this.tbody.querySelectorAll('td[data-index]')).forEach(cell => {
            const index = parseInt(cell.dataset.index);
            cell.textContent = newState[index];
            cell.dataset.state = newState[index];
        });
    }
}

export default TruthTable;
