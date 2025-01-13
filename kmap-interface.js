// K-Map Interface
class KMapInterface {
    constructor() {
        this.variables = ['A', 'B', 'C', 'D'];
        this.size = 16; // 4x4 grid for 4 variables
        this.grid = Array(this.size).fill(0);
        this.initializeUI();
        this.initializeTruthTable();
        this.setupEventListeners();
        
        // Initialize slider position
        const activeTab = document.querySelector('.tab-btn.active');
        if (activeTab) {
            const slider = document.querySelector('.slider-bg');
            const buttonRect = activeTab.getBoundingClientRect();
            const containerRect = activeTab.parentElement.getBoundingClientRect();
            slider.style.width = buttonRect.width + 'px';
            slider.style.transform = `translateX(${buttonRect.left - containerRect.left}px)`;
        }
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

    initializeTruthTable() {
        const tbody = document.getElementById('truth-table-body');
        tbody.innerHTML = '';
        
        // Create all possible combinations
        for (let i = 0; i < 16; i++) {
            const row = document.createElement('tr');
            row.dataset.rowIndex = i;
            
            // Add row ID (using row index)
            const idCell = document.createElement('td');
            idCell.textContent = i;
            idCell.classList.add('row-id');
            row.appendChild(idCell);
            
            // Convert number to 4-bit binary and create input columns
            const binary = i.toString(2).padStart(4, '0');
            for (let j = 0; j < 4; j++) {
                const td = document.createElement('td');
                td.textContent = binary[j];
                row.appendChild(td);
            }
            
            // Add output column
            const outputTd = document.createElement('td');
            outputTd.textContent = '0';
            outputTd.dataset.index = i;
            outputTd.dataset.state = '0';
            outputTd.addEventListener('click', () => this.toggleTruthTableCell(outputTd));
            row.appendChild(outputTd);
            
            tbody.appendChild(row);
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
        
        // Sync with Truth Table
        const index = parseInt(cell.dataset.index);
        const ttCell = document.querySelector(`#truth-table-body td[data-index="${index}"]`);
        if (ttCell) {
            ttCell.dataset.state = newState;
            ttCell.textContent = newState;
            if (newState === '1') {
                ttCell.classList.add('selected');
                ttCell.classList.remove('dont-care');
            } else if (newState === 'X') {
                ttCell.classList.remove('selected');
                ttCell.classList.add('dont-care');
            } else {
                ttCell.classList.remove('selected', 'dont-care');
            }
        }
        
        this.grid[index] = newState;
        this.solve();
    }

    toggleTruthTableCell(cell) {
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
        cell.textContent = newState;
        
        // Sync with K-Map
        const index = parseInt(cell.dataset.index);
        const kmapCell = document.querySelector(`.cell[data-index="${index}"]`);
        if (kmapCell) {
            kmapCell.dataset.state = newState;
            kmapCell.querySelector('.value-display').textContent = newState;
            if (newState === '1') {
                kmapCell.classList.add('selected');
                kmapCell.classList.remove('dont-care');
            } else if (newState === 'X') {
                kmapCell.classList.remove('selected');
                kmapCell.classList.add('dont-care');
            } else {
                kmapCell.classList.remove('selected', 'dont-care');
            }
        }
        
        this.grid[index] = newState;
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

    addOverline(expression) {  
        if (!expression || expression === '0' || expression === '1') return expression;
        
        return expression.split(' + ')
            .map(term => term.replace(/!([A-Z])/g, (_, p1) => `${p1}\u0305`))  
            .join(' + ');
    }

    updateSolution(result) {
        const solutionDiv = document.getElementById('solution');
        const solutionSelect = document.querySelector('.solution-select');
        
        const solutions = Array.isArray(result) ? result : [result];
        
        if (solutions.length > 1) {
            solutionSelect.innerHTML = '';
            solutionSelect.style.display = 'block';
            
            solutions.forEach((solution, index) => {
                const option = document.createElement('option');
                option.value = solution;
                option.textContent = `#${index + 1} of ${solutions.length}`;
                solutionSelect.appendChild(option);
            });
            
            solutionSelect.value = solutions[0];
            solutionSelect.onchange = () => {
                const solution = solutionSelect.value;
                solutionDiv.innerHTML = this.addOverline(solution);
            };
            
            solutionDiv.innerHTML = this.addOverline(solutions[0]);
        } else {
            const solution = solutions[0];
            solutionDiv.innerHTML = this.addOverline(solution);
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
        // Update K-Map
        document.querySelectorAll('.cell').forEach(cell => {
            cell.dataset.state = value;
            cell.querySelector('.value-display').textContent = value;
            if (value === '1') {
                cell.classList.add('selected');
                cell.classList.remove('dont-care');
            } else {
                cell.classList.remove('selected', 'dont-care');
            }
        });

        // Update Truth Table
        document.querySelectorAll('#truth-table-body td[data-index]').forEach(cell => {
            cell.dataset.state = value;
            cell.textContent = value;
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
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all tabs and contents
                document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => 
                    content.classList.remove('active')
                );
                
                // Add active class to clicked tab and corresponding content
                button.classList.add('active');
                const tabId = button.dataset.tab;
                document.getElementById(tabId).classList.add('active');

                // Update slider position and width
                const slider = document.querySelector('.slider-bg');
                const buttonRect = button.getBoundingClientRect();
                const containerRect = button.parentElement.getBoundingClientRect();
                
                // Set width to match the button
                slider.style.width = buttonRect.width + 'px';
                
                // Calculate offset from left edge of container
                const offset = buttonRect.left - containerRect.left;
                slider.style.transform = `translateX(${offset}px)`;
            });
        });

        // Controls
        document.getElementById('all-one-btn').addEventListener('click', () => this.setAllCells('1'));
        document.getElementById('all-zero-btn').addEventListener('click', () => this.setAllCells('0'));
        document.getElementById('clear-btn').addEventListener('click', () => this.clear());

    }
}
