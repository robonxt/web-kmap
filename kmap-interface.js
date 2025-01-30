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
            sliderBg: document.querySelector('.slider-bg'),
            hamburgerBtn: document.querySelector('.hamburger-menu'),
            tabsWrapper: document.querySelector('.tab-container .tabs-wrapper'),
            tabButtons: document.querySelectorAll('.tab-btn')
        };

        // Predefined distinct colors for groups
        this.groupColors = [
            'hsla(0, 80%, 50%, 0.8)',    // Red
            'hsla(210, 80%, 50%, 0.8)',  // Blue
            'hsla(120, 80%, 50%, 0.8)',  // Green
            'hsla(45, 80%, 50%, 0.8)',   // Orange
            'hsla(280, 80%, 50%, 0.8)',  // Purple
            'hsla(180, 80%, 50%, 0.8)',  // Cyan
            'hsla(330, 80%, 50%, 0.8)',  // Pink
            'hsla(150, 80%, 50%, 0.8)'   // Teal
        ];

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
        this.clear(); // Clear on initialization
    }

    initializeLayouts() {
        // Use gray code layouts from KMapSolver and only maintain normal layouts here
        return {
            2: {
                gray: window.KMapSolver.KMapGrayCodes.get(2),
                normal: window.KMapSolver.KMapGrayCodes.get(2)
            },
            3: {
                gray: window.KMapSolver.KMapGrayCodes.get(3),
                normal: [[0, 2, 6, 4], [1, 3, 7, 5]]
            },
            4: {
                gray: window.KMapSolver.KMapGrayCodes.get(4),
                normal: [[0, 4, 12, 8], [1, 5, 13, 9], [3, 7, 15, 11], [2, 6, 14, 10]]
            }
        };
    }

    updateSliderPosition(activeTab = document.querySelector('.tab-btn.active')) {
        const sliderBg = this.elements.sliderBg;
        if (sliderBg && activeTab) {
            const tabWidth = activeTab.offsetWidth;
            const tabLeft = activeTab.offsetLeft;
            sliderBg.style.width = `${tabWidth}px`;
            sliderBg.style.transform = `translateX(${tabLeft}px)`;
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

        // Add SVG after grid is populated
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('kmap-groups-svg');
        grid.appendChild(svg);

        // Initial update after a short delay to ensure grid is rendered
        setTimeout(() => this.updateSvgViewBox(svg), 0);
    }

    updateSvgViewBox(svg) {
        const gridRect = this.elements.grid.getBoundingClientRect();
        svg.setAttribute('width', gridRect.width);
        svg.setAttribute('height', gridRect.height);
        svg.setAttribute('viewBox', `0 0 ${gridRect.width} ${gridRect.height}`);
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
        this.updateCellAndLinkedCell(cell, true);
    }

    toggleTruthTableCell(cell) {
        this.updateCellAndLinkedCell(cell, false);
    }

    updateCellAndLinkedCell(cell, isKMapCell) {
        const newState = this.getNextState(cell.dataset.state);
        this.updateCellState(cell, newState, isKMapCell);

        const index = parseInt(cell.dataset.index);
        const linkedSelector = isKMapCell ?
            `td[data-index="${index}"]` :
            `.cell[data-index="${index}"]`;
        const linkedCell = isKMapCell ?
            this.elements.truthTableBody.querySelector(linkedSelector) :
            this.elements.grid.querySelector(linkedSelector);

        if (linkedCell) {
            this.updateCellState(linkedCell, newState, !isKMapCell);
        }

        this.grid[index] = newState;

        // Clear any pending solve operation
        clearTimeout(this._solveTimer);
        // Schedule a new solve operation
        this._solveTimer = setTimeout(() => this.solve(), 100);
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

    addOverline(solution) {
        // Special cases
        if (solution === "0" || solution === "1") {
            return solution;
        }

        // Split into terms
        const terms = solution.split(' + ');

        return terms.map((term, index) => {
            const color = this.groupColors[index % this.groupColors.length];

            // Process each character for overline
            let result = '';
            let overlineActive = false;

            for (let i = 0; i < term.length; i++) {
                if (term[i] === '!') {
                    overlineActive = true;
                    continue;
                }

                if (overlineActive) {
                    result += `<span style="text-decoration: overline">${term[i]}</span>`;
                    overlineActive = false;
                } else {
                    result += term[i];
                }
            }

            // Wrap term in colored span
            return `<span style="color: ${color}">${result}</span>`;
        }).join(' + ');
    }

    updateSolution(result) {
        const { solution, solutionSelect } = this.elements;
        const solutions = result.solutions || [result];

        if (solutions.length > 1) {
            solutionSelect.innerHTML = solutions.map((sol, i) =>
                `<option value="${sol}">#${i + 1} of ${solutions.length}</option>`).join('');
            solutionSelect.style.display = 'block';
            solutionSelect.value = solutions[0];
            solutionSelect.onchange = () => {
                solution.innerHTML = this.addOverline(solutionSelect.value);
                const terms = solutionSelect.value.split(' + ');
                this.updateGroupsFromTerms(terms);
            };
        } else {
            solutionSelect.style.display = 'none';
        }

        // Use innerHTML since we're adding styled spans
        solution.innerHTML = this.addOverline(solutions[0]);

        // Update groups based on solution terms
        const terms = solutions[0].split(' + ');
        this.updateGroupsFromTerms(terms);
    }

    solve() {
        const { minterms, dontcares } = this.getMintermsAndDontCares();
        const result = window.KMapSolver.solve(this.variables.slice(0, this.numVars), minterms, dontcares);
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
        this.elements.tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.switchTab(button.dataset.tab);
                this.elements.tabsWrapper.classList.remove('show');
                // Update slider after tab switch animation
                setTimeout(() => this.updateSliderPosition(button), 0);
            });
        });

        // Hamburger menu
        if (this.elements.hamburgerBtn && this.elements.tabsWrapper) {
            this.elements.hamburgerBtn.addEventListener('click', () => {
                this.elements.tabsWrapper.classList.toggle('show');
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!this.elements.tabsWrapper.contains(e.target) &&
                    !this.elements.hamburgerBtn.contains(e.target)) {
                    this.elements.tabsWrapper.classList.remove('show');
                }
            });
        }

        // Controls
        document.getElementById('all-one-btn').addEventListener('click', () => this.setAllCells('1'));
        document.getElementById('all-zero-btn').addEventListener('click', () => this.setAllCells('0'));
        document.getElementById('clear-btn').addEventListener('click', () => this.clear());

        // Setup variable cycle button
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
            toggleLayoutBtn.addEventListener('click', () => this.toggleLayout());
        }

        // Add resize observer for SVG updates
        const resizeObserver = new ResizeObserver(() => {
            const svg = this.elements.grid.querySelector('.kmap-groups-svg');
            if (svg) {
                this.updateSvgViewBox(svg);
                this.solve(); // This will trigger group updates
            }
        });
        resizeObserver.observe(this.elements.grid);
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

    updateGroupsFromTerms(terms) {
        const svg = this.elements.grid.querySelector('.kmap-groups-svg');
        if (!svg) return;

        this.updateSvgViewBox(svg);
        svg.innerHTML = '';

        // Handle special cases
        if (!terms || terms.length === 0 || terms[0] === "0") {
            return; // No groups for empty solution or "0"
        }

        const gridRect = this.elements.grid.getBoundingClientRect();
        if (gridRect.width === 0 || gridRect.height === 0) return;

        // Special case for "1" - group all cells
        if (terms.length === 1 && terms[0] === "1") {
            const allCells = Array.from(this.elements.grid.querySelectorAll('.cell'))
                .map(cell => cell.getBoundingClientRect())
                .filter(rect => rect);

            if (allCells.length > 0) {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.classList.add('kmap-group-path');
                path.style.stroke = this.groupColors[0];

                const pathData = this.calculateGroupPath(allCells, gridRect);
                path.setAttribute('d', pathData);

                svg.appendChild(path);
            }
            return;
        }

        // Process each term
        terms.forEach((term, index) => {
            // Skip if term is just "1"
            if (term === "1") return;

            // Parse variables in the term
            const variables = {};
            let currentVar = '';
            for (let i = 0; i < term.length; i++) {
                if (term[i] === '!') {
                    currentVar = term[i + 1];
                    variables[currentVar] = false;
                    i++; // Skip next character
                } else {
                    currentVar = term[i];
                    variables[currentVar] = true;
                }
            }

            // Find cells that match this term
            const matchingCells = [];
            const KMap = getKMap(this.variables.slice(0, this.numVars));

            for (let row = 0; row < KMap.length; row++) {
                for (let col = 0; col < KMap[0].length; col++) {
                    const cell = KMap[row][col];
                    const binary = cell.binary.split('');
                    let matches = true;

                    // Check if cell matches all variables in term
                    for (const [variable, value] of Object.entries(variables)) {
                        const varIndex = this.variables.indexOf(variable);
                        if (varIndex === -1) continue;

                        const cellValue = binary[varIndex] === '1';
                        if (cellValue !== value) {
                            matches = false;
                            break;
                        }
                    }

                    if (matches) {
                        matchingCells.push(cell);
                    }
                }
            }

            // Create path for matching cells
            if (matchingCells.length > 0) {
                const cells = matchingCells.map(cell => {
                    const pos = findDecimalPos(cell.decimal, KMap);
                    const element = this.getCellElement(pos.row, pos.col);
                    return element.getBoundingClientRect();
                }).filter(rect => rect);

                if (cells.length === 0) return;

                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.classList.add('kmap-group-path');
                path.dataset.wrap = this.isWraparound(matchingCells) ? 'true' : 'false';
                path.style.stroke = this.groupColors[index % this.groupColors.length];

                const pathData = this.calculateGroupPath(cells, gridRect);
                path.setAttribute('d', pathData);

                svg.appendChild(path);
            }
        });
    }

    getCellElement(row, col) {
        const layout = this.isGrayCodeLayout ?
            this.layouts[this.numVars].gray :
            this.layouts[this.numVars].normal;

        const colLength = this.isGrayCodeLayout ? layout.cols.length : layout[0].length;
        const index = row * colLength + col;
        return this.elements.grid.children[index];
    }

    calculateGroupPath(cells, gridRect) {
        const padding = 4;
        const radius = 20;

        // Convert cell rects to relative coordinates
        const rects = cells.map(rect => ({
            left: rect.left - gridRect.left - padding,
            top: rect.top - gridRect.top - padding,
            right: rect.right - gridRect.left + padding,
            bottom: rect.bottom - gridRect.top + padding
        }));

        // Find bounds
        const bounds = {
            left: Math.min(...rects.map(r => r.left)),
            top: Math.min(...rects.map(r => r.top)),
            right: Math.max(...rects.map(r => r.right)),
            bottom: Math.max(...rects.map(r => r.bottom))
        };

        // Create rounded rectangle path
        return `M ${bounds.left + radius} ${bounds.top}
            L ${bounds.right - radius} ${bounds.top}
            Q ${bounds.right} ${bounds.top} ${bounds.right} ${bounds.top + radius}
            L ${bounds.right} ${bounds.bottom - radius}
            Q ${bounds.right} ${bounds.bottom} ${bounds.right - radius} ${bounds.bottom}
            L ${bounds.left + radius} ${bounds.bottom}
            Q ${bounds.left} ${bounds.bottom} ${bounds.left} ${bounds.bottom - radius}
            L ${bounds.left} ${bounds.top + radius}
            Q ${bounds.left} ${bounds.top} ${bounds.left + radius} ${bounds.top}`;
    }

    isWraparound(cells) {
        // Check if cells are not adjacent in the grid
        const positions = cells.map(cell =>
            findDecimalPos(cell.decimal, getKMap(this.variables.slice(0, this.numVars)))
        );

        // Sort positions by row and column
        positions.sort((a, b) => a.row - b.row || a.col - b.col);

        // Check for gaps larger than 1 in rows or columns
        for (let i = 1; i < positions.length; i++) {
            const prev = positions[i - 1];
            const curr = positions[i];

            const rowGap = Math.abs(curr.row - prev.row);
            const colGap = Math.abs(curr.col - prev.col);

            if (rowGap > 1 || colGap > 1) return true;
        }

        return false;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new KMapInterface();
});
