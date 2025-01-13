// K-Map Grid UI Manager
class KMapGrid {
    constructor() {
        this.grid = document.getElementById('kmap-grid');
        this.size = 16; // 4x4 grid for 4 variables
        this.cells = Array(this.size).fill(0);
        this.initializeGrid();
    }

    initializeGrid() {
        this.grid.innerHTML = '';
        
        // Gray code sequences for rows (AB) and columns (CD)
        const grayRows = ['00', '01', '11', '10'];
        const grayCols = ['00', '01', '11', '10'];
        
        // Create 4x4 grid in Gray code order
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const cell = this.createCell(row, col, grayRows, grayCols);
                this.grid.appendChild(cell);
            }
        }
    }

    createCell(row, col, grayRows, grayCols) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        
        const rowBits = parseInt(grayRows[row], 2);
        const colBits = parseInt(grayCols[col], 2);
        const index = (rowBits << 2) | colBits;
        
        cell.dataset.index = index;
        cell.dataset.state = '0';

        const binaryDisplay = document.createElement('div');
        binaryDisplay.className = 'binary-display';
        binaryDisplay.textContent = `${grayRows[row] + grayCols[col]} (${index})`;

        const valueDisplay = document.createElement('div');
        valueDisplay.className = 'value-display';
        valueDisplay.textContent = '0';

        cell.appendChild(binaryDisplay);
        cell.appendChild(valueDisplay);
        
        cell.addEventListener('click', () => this.toggleCell(cell));
        return cell;
    }

    toggleCell(cell) {
        const valueDisplay = cell.querySelector('.value-display');
        const currentState = cell.dataset.state;
        let newState;
        
        switch (currentState) {
            case '0':
                newState = '1';
                valueDisplay.textContent = '1';
                break;
            case '1':
                newState = 'X';
                valueDisplay.textContent = 'X';
                break;
            default:
                newState = '0';
                valueDisplay.textContent = '0';
        }
        
        cell.dataset.state = newState;
        this.cells[parseInt(cell.dataset.index)] = newState;
        this.notifyStateChange();
    }

    notifyStateChange() {
        // Dispatch custom event when grid state changes
        const event = new CustomEvent('kmap-grid-change', {
            detail: { cells: this.cells }
        });
        document.dispatchEvent(event);
    }

    getState() {
        return this.cells;
    }

    setState(newState) {
        this.cells = newState;
        Array.from(this.grid.children).forEach((cell, i) => {
            const valueDisplay = cell.querySelector('.value-display');
            valueDisplay.textContent = newState[i];
            cell.dataset.state = newState[i];
        });
    }
}

export default KMapGrid;
