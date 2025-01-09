// K-Map Interface
class KMapInterface {
    constructor() {
        this.variables = ['A', 'B', 'C', 'D'];
        this.size = 16; // 4x4 grid for 4 variables
        this.grid = Array(this.size).fill(0);
        this.initializeUI();
        this.setupEventListeners();
    }

    initializeUI() {
        const grid = document.getElementById('kmap-grid');
        grid.innerHTML = '';
        
        // Gray code sequences for rows (AB) and columns (CD)
        const grayRows = ['00', '01', '11', '10'];
        const grayCols = ['00', '01', '11', '10'];
        
        // Create 4x4 grid in Gray code order
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                
                // Calculate index in Gray code order
                const rowBits = parseInt(grayRows[row], 2);
                const colBits = parseInt(grayCols[col], 2);
                const index = (rowBits << 2) | colBits;
                cell.dataset.index = index;
                cell.dataset.state = '0'; // Track cell state: '0', '1', or 'X'

                // Create cell content
                const binaryDisplay = document.createElement('div');
                binaryDisplay.className = 'binary-display';
                binaryDisplay.textContent = `${grayRows[row] + grayCols[col]} (${index})`;

                const valueDisplay = document.createElement('div');
                valueDisplay.className = 'value-display';
                valueDisplay.textContent = '0';

                cell.appendChild(binaryDisplay);
                cell.appendChild(valueDisplay);
                
                cell.addEventListener('click', () => this.toggleCell(cell));
                grid.appendChild(cell);
            }
        }
    }

    toggleCell(cell) {
        const valueDisplay = cell.querySelector('.value-display');
        const currentState = cell.dataset.state;
        let newState;
        
        // Cycle through states: 0 -> 1 -> X -> 0
        switch (currentState) {
            case '0':
                newState = '1';
                cell.classList.add('selected');
                cell.classList.remove('dont-care');
                break;
            case '1':
                newState = 'X';
                cell.classList.remove('selected');
                cell.classList.add('dont-care');
                break;
            case 'X':
                newState = '0';
                cell.classList.remove('selected', 'dont-care');
                break;
        }
        
        cell.dataset.state = newState;
        valueDisplay.textContent = newState;
        this.grid[parseInt(cell.dataset.index)] = newState;
        
        // Auto-solve when cell changes
        this.solve();
    }

    getMintermsAndDontCares() {
        const minterms = [];
        const dontcares = [];
        const cells = document.querySelectorAll('.cell');
        
        cells.forEach(cell => {
            const index = parseInt(cell.dataset.index);
            const state = cell.dataset.state;
            
            if (state === '1') {
                minterms.push(index);
            } else if (state === 'X') {
                dontcares.push(index);
            }
        });
        
        return { minterms, dontcares };
    }

    convertToOverline(expression) {
        if (expression === '0' || expression === '1') return expression;
        
        // Split into terms
        return expression.split(' + ').map(term => {
            // Process each variable in the term
            return term.split(/(!)?([A-Z])/).filter(Boolean).map((part, i, arr) => {
                if (part === '!') return '';
                if (i > 0 && arr[i-1] === '!') {
                    return `<span class="var-not">${part}</span>`;
                }
                return part;
            }).join('');
        }).join(' + ');
    }

    updateSolution(result) {
        const solutionDiv = document.getElementById('solution');
        const solutionSelect = document.getElementById('solution-select');
        
        // Handle special cases
        if (!result || result === '0') {
            solutionDiv.innerHTML = '0';
            solutionSelect.style.display = 'none';
            return;
        }
        if (result === '1') {
            solutionDiv.innerHTML = '1';
            solutionSelect.style.display = 'none';
            return;
        }

        // Handle array of solutions
        if (Array.isArray(result)) {
            const totalSolutions = result.length;
            solutionSelect.style.display = totalSolutions > 1 ? 'block' : 'none';
            solutionSelect.innerHTML = '';
            
            if (totalSolutions > 1) {
                result.forEach((solution, index) => {
                    const option = document.createElement('option');
                    option.value = solution;
                    option.textContent = `#${index + 1}/${totalSolutions}`;
                    solutionSelect.appendChild(option);
                });
                
                // Show first solution by default
                solutionSelect.value = result[0];
                
                // Update solution display when selection changes
                solutionSelect.onchange = () => {
                    solutionDiv.innerHTML = this.convertToOverline(solutionSelect.value);
                };
            }
            
            // Display the first solution
            solutionDiv.innerHTML = this.convertToOverline(result[0]);
        } else {
            // Single solution
            solutionDiv.innerHTML = this.convertToOverline(result);
            solutionSelect.style.display = 'none';
        }
    }

    solve() {
        const { minterms, dontcares } = this.getMintermsAndDontCares();
        const result = window.KMapSolver.solve(this.variables, minterms, dontcares);
        this.updateSolution(result);
    }

    clear() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            const valueDisplay = cell.querySelector('.value-display');
            valueDisplay.textContent = '0';
            cell.classList.remove('selected', 'dont-care');
            cell.dataset.state = '0';
        });
        this.grid.fill(0);
        document.getElementById('solution').innerHTML = '';
        document.getElementById('solution-select').style.display = 'none';
    }

    setAllCells(value) {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            const valueDisplay = cell.querySelector('.value-display');
            valueDisplay.textContent = value;
            cell.dataset.state = value;
            
            if (value === '1') {
                cell.classList.add('selected');
                cell.classList.remove('dont-care');
            } else {
                cell.classList.remove('selected', 'dont-care');
            }
        });
        this.grid = Array(this.size).fill(value);
        this.solve();
    }

    setupEventListeners() {
        document.getElementById('all-one-btn').addEventListener('click', () => this.setAllCells('1'));
        document.getElementById('all-zero-btn').addEventListener('click', () => this.setAllCells('0'));
        document.getElementById('clear-btn').addEventListener('click', () => this.clear());
        document.getElementById('solve-btn').addEventListener('click', () => this.solve());
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new KMapInterface();
});
