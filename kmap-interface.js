// K-Map Interface
class KMapInterface {
    constructor(numVars = 4) {
        // Cache frequently used DOM elements
        this.elements = {
            grid: document.getElementById('kmap-grid'),
            solution: document.getElementById('solution'),
            solutionSelect: document.querySelector('.solution-select'),
            copyBtn: document.getElementById('copy-solution'),
            truthTableBody: document.getElementById('truth-table-body'),
            toggleLayoutBtn: document.getElementById('toggle-layout-btn'),
            sliderBg: document.querySelector('.slider-bg')
        };

        // Initialize state
        this.variables = [...Array(numVars).keys()].map(i => String.fromCharCode(65 + i));
        this.numVars = numVars;
        this.size = 1 << numVars; // 2^numVars
        this.grid = Array(this.size).fill(0);
        this.isGrayCodeLayout = true;
        this.layouts = this.initializeLayouts();
        
        // Update variable count attribute
        document.body.setAttribute('data-vars', numVars);
        
        // Initialize UI components
        this.initializeUI();
        this.initializeTruthTable();
        this.setupEventListeners();
        this.updateSliderPosition();
    }

    initializeLayouts() {
        return {
            2: {
                gray: { rows: [''], cols: ['00', '01', '11', '10'] },
                normal: [[0, 1, 3, 2]]
            },
            3: {
                gray: { rows: ['0', '1'], cols: ['00', '01', '11', '10'] },
                normal: [[0, 2, 6, 4], [1, 3, 7, 5]]
            },
            4: {
                gray: { rows: ['00', '01', '11', '10'], cols: ['00', '01', '11', '10'] },
                normal: [[0, 4, 12, 8], [1, 5, 13, 9], [3, 7, 15, 11], [2, 6, 14, 10]]
            }
        };
    }

    updateSliderPosition(activeTab = document.querySelector('.tab-btn.active')) {
        if (activeTab && this.elements.sliderBg) {
            const buttonRect = activeTab.getBoundingClientRect();
            const containerRect = activeTab.parentElement.getBoundingClientRect();
            this.elements.sliderBg.style.width = buttonRect.width + 'px';
            this.elements.sliderBg.style.transform = `translateX(${buttonRect.left - containerRect.left}px)`;
        }
    }

    initializeUI() {
        const grid = this.elements.grid;
        grid.innerHTML = '';
        
        const layout = this.isGrayCodeLayout ? 
            this.layouts[this.numVars].gray :
            this.layouts[this.numVars].normal;
        
        grid.style.gridTemplateColumns = `repeat(${this.isGrayCodeLayout ? layout.cols.length : layout[0].length}, minmax(10px, 1fr))`;
        
        if (this.isGrayCodeLayout) {
            this.createGrayCodeGrid(layout);
        } else {
            this.createBinaryGrid(layout);
        }
    }

    createCell(index, binaryDisplay) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = index;
        
        // Initialize with current state from grid
        const state = this.grid[index] || '0';
        cell.dataset.state = state;

        const binDiv = document.createElement('div');
        binDiv.className = 'binary-display';
        binDiv.textContent = binaryDisplay;

        const valDiv = document.createElement('div');
        valDiv.className = 'value-display';
        valDiv.textContent = state;

        // Add appropriate classes based on state
        if (state === '1') {
            cell.classList.add('selected');
        } else if (state === 'X') {
            cell.classList.add('dont-care');
        }

        cell.append(binDiv, valDiv);
        cell.addEventListener('click', () => this.toggleCell(cell));
        return cell;
    }

    createGrayCodeGrid(layout) {
        const fragment = document.createDocumentFragment();
        layout.rows.forEach(row => {
            layout.cols.forEach(col => {
                const rowBits = parseInt(row, 2);
                const colBits = parseInt(col, 2);
                const index = (rowBits << Math.log2(layout.cols.length)) | colBits;
                fragment.appendChild(this.createCell(index, `${row}${col} (${index})`));
            });
        });
        this.elements.grid.appendChild(fragment);
    }

    createBinaryGrid(layout) {
        const fragment = document.createDocumentFragment();
        layout.forEach(row => {
            row.forEach(index => {
                fragment.appendChild(this.createCell(index, 
                    index.toString(2).padStart(this.numVars, '0') + ` (${index})`));
            });
        });
        this.elements.grid.appendChild(fragment);
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
                ...Array.from({length: 4}, (_, j) => 
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
            td.addEventListener('click', () => this.toggleTruthTableCell(td));
        }
        return td;
    }

    toggleCell(cell) {
        const newState = this.getNextState(cell.dataset.state);
        this.updateCellState(cell, newState, true);
        
        const index = parseInt(cell.dataset.index);
        const ttCell = this.elements.truthTableBody.querySelector(`td[data-index="${index}"]`);
        if (ttCell) {
            this.updateCellState(ttCell, newState, false);
        }
        
        this.grid[index] = newState;
        this.debounce(() => this.solve(), 100);
    }

    toggleTruthTableCell(cell) {
        const newState = this.getNextState(cell.dataset.state);
        this.updateCellState(cell, newState, false);
        
        const index = parseInt(cell.dataset.index);
        const kmapCell = this.elements.grid.querySelector(`.cell[data-index="${index}"]`);
        if (kmapCell) {
            this.updateCellState(kmapCell, newState, true);
        }
        
        this.grid[index] = newState;
        this.debounce(() => this.solve(), 100);
    }

    getMintermsAndDontCares() {
        const cells = this.elements.grid.querySelectorAll('.cell');
        return Array.from(cells).reduce((acc, cell) => {
            const index = parseInt(cell.dataset.index);
            const state = cell.dataset.state;
            if (state === '1') acc.minterms.push(index);
            else if (state === 'X') acc.dontcares.push(index);
            return acc;
        }, { minterms: [], dontcares: [] });
    }

    addOverline(expression) {
        if (!expression || expression === '0' || expression === '1') return expression;
        return expression.split(' + ')
            .map(term => term.replace(/!([A-Z])/g, (_, p1) => `${p1}\u0305`))
            .join(' + ');
    }

    updateSolution(result) {
        const { solution, solutionSelect } = this.elements;
        const solutions = Array.isArray(result) ? result : [result];
        
        if (solutions.length > 1) {
            solutionSelect.innerHTML = solutions.map((sol, i) => 
                `<option value="${sol}">#${i + 1} of ${solutions.length}</option>`).join('');
            solutionSelect.style.display = 'block';
            solutionSelect.value = solutions[0];
            solutionSelect.onchange = () => {
                solution.innerHTML = this.addOverline(solutionSelect.value);
            };
        } else {
            solution.innerHTML = this.addOverline(solutions[0]);
            solutionSelect.style.display = 'none';
        }
        solution.innerHTML = this.addOverline(solutions[0]);
    }

    solve() {
        const { minterms, dontcares } = this.getMintermsAndDontCares();
        const result = window.KMapSolver.solve(this.variables, minterms, dontcares);
        this.updateSolution(result);
    }

    clear() {
        // Clear K-map cells
        this.elements.grid.querySelectorAll('.cell').forEach(cell => {
            this.updateCellState(cell, '0', true);
        });

        // Clear truth table cells
        this.elements.truthTableBody.querySelectorAll('td[data-index]').forEach(cell => {
            this.updateCellState(cell, '0', false);
        });

        // Reset grid state and clear solution
        this.grid.fill(0);
        this.elements.solution.innerHTML = '';
        this.elements.solutionSelect.style.display = 'none';
    }

    setAllCells(value) {
        // Update K-Map and Truth Table cells
        this.elements.grid.querySelectorAll('.cell').forEach(cell => 
            this.updateCellState(cell, value, true));
        
        this.elements.truthTableBody.querySelectorAll('td[data-index]').forEach(cell => 
            this.updateCellState(cell, value, false));

        // Update grid state and solve
        this.grid = Array(this.size).fill(value);
        this.solve();
    }

    toggleLayout() {
        if (this.numVars === 2) return; // Disable for 2 variables
        
        this.isGrayCodeLayout = !this.isGrayCodeLayout;
        const states = this.grid.slice();
        
        // Update layout icon
        this.elements.toggleLayoutBtn.innerHTML = this.isGrayCodeLayout ? 
            `<svg viewBox="0 0 24 24">
                <rect x="4" y="4" width="7" height="7" fill="none" stroke="currentColor" stroke-width="2"/>
                <rect x="13" y="13" width="7" height="7" fill="none" stroke="currentColor" stroke-width="2"/>
                <path d="M17 7l3-3-3-3M7 17l-3 3 3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>` :
            `<svg viewBox="0 0 24 24">
                <rect x="4" y="13" width="7" height="7" fill="none" stroke="currentColor" stroke-width="2"/>
                <rect x="13" y="4" width="7" height="7" fill="none" stroke="currentColor" stroke-width="2"/>
                <path d="M7 7l-3-3 3-3M17 17l3 3-3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>`;
        
        this.initializeUI();
        
        // Restore states
        states.forEach((state, index) => {
            if (state !== '0') {
                const cell = this.elements.grid.querySelector(`.cell[data-index="${index}"]`);
                if (cell) this.updateCellState(cell, state, true);
            }
        });
    }

    switchTab(tabName) {
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(button => {
            button.classList.toggle('active', button.dataset.tab === tabName);

            // Update slider position if this is the active button
            if (button.dataset.tab === tabName) {
                this.updateSliderPosition(button);
            }
        });

        // Show/hide content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tabName);
        });

        // Show/hide layout button based on tab and variable count
        const layoutBtn = this.elements.toggleLayoutBtn;
        if (layoutBtn) {
            // Only show layout button if we're in kmap tab AND not in 2-variable mode
            layoutBtn.style.display = (tabName === 'kmap' && this.numVars !== 2) ? 'flex' : 'none';
        }
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(button => {
            button.addEventListener('click', () => {
                this.switchTab(button.dataset.tab);
            });
        });

        // Controls
        document.getElementById('all-one-btn').addEventListener('click', () => this.setAllCells('1'));
        document.getElementById('all-zero-btn').addEventListener('click', () => this.setAllCells('0'));
        document.getElementById('clear-btn').addEventListener('click', () => this.clear());

        // Setup layout toggle button
        const varCycleBtn = document.getElementById('var-cycle-btn');
        if (varCycleBtn) {
            // Update toggle button visibility based on variable count and current tab
            const updateToggleButton = () => {
                const toggleLayoutBtn = this.elements.toggleLayoutBtn;
                const kmapTab = document.querySelector('.tab-btn[data-tab="kmap"]');
                const isKmapActive = kmapTab && kmapTab.classList.contains('active');
                if (toggleLayoutBtn) {
                    toggleLayoutBtn.style.display = (this.numVars !== 2 && isKmapActive) ? 'flex' : 'none';
                }
            };

            // Initial visibility
            updateToggleButton();

            varCycleBtn.addEventListener('click', () => {
                // Cycle between 4 -> 3 -> 2 -> 4
                this.numVars = this.numVars > 2 ? this.numVars - 1 : 4;

                // Update variables array
                this.variables = [...Array(this.numVars).keys()].map(i => String.fromCharCode(65 + i));
                this.size = 1 << this.numVars;

                // Reset grid state
                this.grid = Array(this.size).fill(0);

                // Update data-vars attribute
                document.body.setAttribute('data-vars', this.numVars);

                // Force Gray code layout for 2 variables
                if (this.numVars === 2) {
                    this.isGrayCodeLayout = true;
                }

                // Reinitialize UI with new variable count
                this.initializeUI();
                this.initializeTruthTable();

                // Clear all states and solution
                this.clear();

                // Update toggle button visibility
                updateToggleButton();

                // Dispatch event for variable change
                document.dispatchEvent(new Event('varchange'));
            });
        }

        // Add copy to clipboard functionality
        this.elements.copyBtn.addEventListener('click', () => {
            const solutionDiv = this.elements.solution;
            const solutionText = String(solutionDiv.textContent || '');

            // Try modern clipboard API first
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(solutionText)
                    .then(() => this.showCopySuccess())
                    .catch(() => this.copyTextFallback(solutionText));
            } else {
                // Use fallback method for non-HTTPS
                this.copyTextFallback(solutionText);
            }
        });

        // Setup variable cycle button
        const toggleLayoutBtn = this.elements.toggleLayoutBtn;
        if (toggleLayoutBtn) {
            toggleLayoutBtn.addEventListener('click', () => {
                if (this.numVars === 2) return; // Disable for 2 variables
                this.isGrayCodeLayout = !this.isGrayCodeLayout;
                this.initializeUI();
            });
        }
    }

    // Helper method to update cell state and appearance
    updateCellState(cell, newState, isKMapCell = true) {
        const display = isKMapCell ? cell.querySelector('.value-display') : cell;
        if (isKMapCell) {
            display.textContent = newState;
        } else {
            cell.textContent = newState;
        }

        cell.dataset.state = newState;

        // Update classes
        if (newState === '1') {
            cell.classList.add('selected');
            cell.classList.remove('dont-care');
        } else if (newState === 'X') {
            cell.classList.remove('selected');
            cell.classList.add('dont-care');
        } else {
            cell.classList.remove('selected', 'dont-care');
        }
    }

    // Helper method to get next state in the cycle
    getNextState(currentState) {
        switch (currentState) {
            case '0': return '1';
            case '1': return 'X';
            case 'X': return '0';
            default: return '0';
        }
    }

    showCopySuccess() {
        const copyBtn = this.elements.copyBtn;
        copyBtn.style.color = 'var(--primary-color)';
        setTimeout(() => {
            copyBtn.style.color = 'var(--text-color)';
        }, 1000);
    }

    copyTextFallback(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';
        document.body.appendChild(textArea);

        try {
            textArea.select();
            document.execCommand('copy');
            this.showCopySuccess();
        } catch (err) {
            console.error('Failed to copy text: ', err);
        } finally {
            document.body.removeChild(textArea);
        }
    }

    // Update toggle button visibility based on variable count and current tab
    updateToggleButton() {
        const toggleLayoutBtn = this.elements.toggleLayoutBtn;
        const kmapTab = document.querySelector('.tab-btn[data-tab="kmap"]');
        const isKmapActive = kmapTab && kmapTab.classList.contains('active');
        if (toggleLayoutBtn) {
            toggleLayoutBtn.style.display = (this.numVars !== 2 && isKmapActive) ? 'flex' : 'none';
        }
    }

    debounce(func, wait) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(func, wait);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new KMapInterface();
});
