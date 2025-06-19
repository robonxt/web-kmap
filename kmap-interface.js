// K-Map Interface
class KMapInterface {
    constructor(numVars = 4) {
        this.elements = {
            grid: document.getElementById('kmap-grid'),
            solution: document.getElementById('solution'),
            dropdownSolutions: document.getElementById('dropdown-solutions'),
            btnCopySolution: document.getElementById('btn-copy-solution'),
            truthTableBody: document.getElementById('truth-table-body'),
            btnToggleLayout: document.getElementById('btn-toggle-layout'),
            sliderBg: document.getElementById('slider-bg'),
            btnShowMenu: document.getElementById('btn-show-menu'),
            tabsWrapper: document.getElementById('wrapper-tabs'),
            btnTab: document.querySelectorAll('.btn-tab'),
            kmapTab: document.getElementById('btn-tab-kmap'),
            btnSetOnes: document.getElementById('btn-set-ones'),
            btnSetXs: document.getElementById('btn-set-xs'),
            btnSetZeros: document.getElementById('btn-set-zeros'),
            dropdownVariables: document.getElementById('dropdown-variables'),
            btnToggleZeros: document.getElementById('btn-toggle-zeros'),
            btnToggleTheme: document.getElementById('btn-toggle-theme')
        };

        // Predefined distinct colors for groups
        this.groupColors = [
            'hsla(0, 100%, 60%, 0.8)',    // Red
            'hsla(210, 100%, 60%, 0.8)',  // Blue
            'hsla(120, 100%, 60%, 0.8)',  // Green
            'hsla(45, 100%, 60%, 0.8)',   // Orange
            'hsla(280, 100%, 60%, 0.8)',  // Purple
            'hsla(180, 100%, 60%, 0.8)',  // Cyan
            'hsla(330, 100%, 60%, 0.8)',  // Pink
            'hsla(150, 100%, 60%, 0.8)'   // Teal
        ];

        // Initialize state
        this.variables = [...Array(numVars).keys()].map(i => String.fromCharCode(65 + i));
        this.numVars = numVars;
        this.size = 1 << numVars; // 2^numVars
        this.grid = Array(this.size).fill(0);
        this.isGrayCodeLayout = true;
        this.hideZeros = localStorage.getItem('hideZeros') !== null ? localStorage.getItem('hideZeros') === 'true' : true;
        this.layouts = this.initializeLayouts();

        // Update variable count attribute
        document.body.setAttribute('data-vars', numVars);

        // Initialize UI components
        this.initializeUI();
        this.initializeTruthTable();
        this.setupEventListeners();
        this.updateSliderPosition();
        this.elements.btnToggleZeros?.classList.toggle('active', this.hideZeros);
        this.clear();
    }

        initializeLayouts() {
        // Fetch all layouts from KMapSolver to centralize definitions
        return {
            2: {
                gray: window.KMapSolver.KMapGrayCodes.get(2),
                normal: window.KMapSolver.KMapBinaryLayouts.get(2)
            },
            3: {
                gray: window.KMapSolver.KMapGrayCodes.get(3),
                normal: window.KMapSolver.KMapBinaryLayouts.get(3)
            },
            4: {
                gray: window.KMapSolver.KMapGrayCodes.get(4),
                normal: window.KMapSolver.KMapBinaryLayouts.get(4)
            }
        };
    }

    updateSliderPosition(activeTab = document.querySelector('.btn-tab.active')) {
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

        // Update SVG viewBox
        this.updateSvgViewBox(svg);
    }

    updateSvgViewBox(svg) {
        const gridRect = this.elements.grid.getBoundingClientRect();
        svg.setAttribute('width', gridRect.width);
        svg.setAttribute('height', gridRect.height);
        svg.setAttribute('viewBox', `0 0 ${gridRect.width} ${gridRect.height}`);
    }

    createCell(index) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = index;

        // Initialize with current state from grid
        const state = this.grid[index] || '0';
        cell.dataset.state = state;

        // Extract binary representation from binaryDisplay
        const binaryPart = index.toString(2).padStart(this.numVars, '0');
        
        // Create decimal display
        const decDiv = document.createElement('div');
        decDiv.className = 'decimal-display';
        decDiv.textContent = index;
        
        // Create value display (center)
        const valDiv = document.createElement('div');
        valDiv.className = 'value-display';
        valDiv.textContent = (state === '1' || state === 'X') ? state : 
            (this.hideZeros ? 'ㅤ' : '0');
        // Create binary display
        const binDiv = document.createElement('div');
        binDiv.className = 'binary-display';
        binDiv.textContent = binaryPart;

        // Add appropriate classes based on state
        if (state === '1') {
            cell.classList.add('selected');
        } else if (state === 'X') {
            cell.classList.add('dont-care');
        }

        // Create a wrapper for the value display to center it
        const centerWrapper = document.createElement('div');
        centerWrapper.className = 'center-wrapper';
        centerWrapper.appendChild(valDiv);

        cell.append(decDiv, centerWrapper, binDiv);
        cell.addEventListener('click', () => this.toggleKMap(cell));
        return cell;
    }

    createGrayCodeGrid(layout) {
        const fragment = document.createDocumentFragment();
        layout.rows.forEach(row => {
            layout.cols.forEach(col => {
                const rowBits = parseInt(row, 2);
                const colBits = parseInt(col, 2);
                const index = (rowBits << Math.log2(layout.cols.length)) | colBits;
                fragment.appendChild(this.createCell(index));
            });
        });
        this.elements.grid.appendChild(fragment);
    }

    createBinaryGrid(layout) {
        const fragment = document.createDocumentFragment();
        layout.forEach(row => {
            row.forEach(index => {
                fragment.appendChild(this.createCell(index));
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
                ...Array.from({ length: 4 }, (_, j) =>
                    this.createTableCell(j < this.numVars ? binary[j] : '', '', j < this.numVars)),
                this.createTableCell(this.hideZeros ? 'ㅤ' : '0', '', true, i)
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

    toggleKMap(cell) {
        this.syncViews(cell, true);
    }

    toggleTruth(cell) {
        this.syncViews(cell, false);
    }

    syncViews(cell, isKMapCell) {
        const newState = this.cycleState(cell.dataset.state);
        this.applyState(cell, newState, isKMapCell);

        const index = parseInt(cell.dataset.index);
        const linkedSelector = isKMapCell ?
            `td[data-index="${index}"]` :
            `.cell[data-index="${index}"]`;
        const linkedCell = isKMapCell ?
            this.elements.truthTableBody.querySelector(linkedSelector) :
            this.elements.grid.querySelector(linkedSelector);

        if (linkedCell) {
            this.applyState(linkedCell, newState, !isKMapCell);
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
            return `<span>${solution}</span>`;
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
        const { solution, dropdownSolutions } = this.elements;
        const solutions = result.solutions || [result];

        if (solutions.length > 1) {
            dropdownSolutions.innerHTML = solutions.map((sol, i) =>
                `<option value="${sol}">#${i + 1} of ${solutions.length}</option>`).join('');
            dropdownSolutions.style.display = 'block';
            dropdownSolutions.value = solutions[0];
            dropdownSolutions.onchange = () => {
                solution.innerHTML = this.addOverline(dropdownSolutions.value);
                const terms = dropdownSolutions.value.split(' + ');
                this.updateGroupsFromTerms(terms);
            };
        } else {
            dropdownSolutions.style.display = 'none';
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
            this.applyState(cell, '0', true);
        });

        // Clear truth table cells
        this.elements.truthTableBody.querySelectorAll('td[data-index]').forEach(cell => {
            this.applyState(cell, '0', false);
        });

        // Reset grid state
        this.grid.fill(0);
        this.elements.solution.innerHTML = '';
        this.elements.dropdownSolutions.style.display = 'none';

        // Clear group circles by removing all path elements from the SVG
        const svg = this.elements.grid.querySelector('.kmap-groups-svg');
        if (svg) {
            const paths = svg.querySelectorAll('path');
            paths.forEach(path => path.remove());
        }
    }

    setAllStates(value) {
        // Update K-Map and Truth Table cells
        this.elements.grid.querySelectorAll('.cell').forEach(cell =>
            this.applyState(cell, value, true));

        this.elements.truthTableBody.querySelectorAll('td[data-index]').forEach(cell =>
            this.applyState(cell, value, false));

        // Update grid state and solve
        this.grid = Array(this.size).fill(value);
        this.solve();
    }

    applyState(cell, newState, isKMapCell = true) {
        if (isKMapCell) {
            const valueDisplay = cell.querySelector('.value-display');
            if (valueDisplay) {
                valueDisplay.textContent = (newState === '1' || newState === 'X') ? newState : 
                    (this.hideZeros ? 'ㅤ' : '0');
            }
        } else {
            cell.textContent = (newState === '1' || newState === 'X') ? newState : 
                (this.hideZeros ? 'ㅤ' : '0');
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

    cycleState(currentState) {
        switch (currentState) {
            case '0': return '1';
            case '1': return 'X';
            case 'X': return '0';
            default: return '0';
        }
    }

    showCopySuccess() {
        const btnCopySolution = this.elements.btnCopySolution;
        btnCopySolution.style.color = 'var(--primary-color)';
        setTimeout(() => {
            btnCopySolution.style.color = 'var(--text-color)';
        }, 1000);
    }

    getSolutionTextWithOverlines() {
        const solutionDiv = this.elements.solution;
        // If there's only text content (no spans), return it directly
        if (solutionDiv.children.length === 0) {
            return solutionDiv.textContent;
        }
        const terms = Array.from(solutionDiv.children).map(span => {
            // Process each term's characters
            const chars = Array.from(span.childNodes).map(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    return node.textContent;
                } else if (node.nodeType === Node.ELEMENT_NODE && node.style.textDecoration === 'overline') {
                    // Use Unicode combining overline character (U+0305)
                    return node.textContent + '\u0305';
                }
                return '';
            }).join('');
            return chars;
        });
        return terms.join(' + ');
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

    setupClipboardHandlers() {
        this.elements.btnCopySolution.addEventListener('click', () => {
            const solutionText = this.getSolutionTextWithOverlines();

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
    }

    updateGroupsFromTerms(terms) {
        const svg = this.elements.grid.querySelector('.kmap-groups-svg');
        if (!svg) return;

        this.updateSvgViewBox(svg);
        svg.innerHTML = 'ㅤ';

        // Handle special cases
        if (!terms || terms.length === 0 || terms[0] === "0") {
            return; // No groups for empty solution or "0"
        }

        const gridRect = this.elements.grid.getBoundingClientRect();
        if (gridRect.width === 0 || gridRect.height === 0) return;

        const allCellElements = this.elements.grid.querySelectorAll('.cell');
        const allCellRects = new Map();
        allCellElements.forEach(cellEl => {
            allCellRects.set(cellEl.dataset.index, cellEl.getBoundingClientRect());
        });

        // Special case for "1" - group all cells
        if (terms.length === 1 && terms[0] === "1") {
            const allCellsForGroup1 = Array.from(allCellElements) // Use already queried elements
                .map(cellEl => allCellRects.get(cellEl.dataset.index)) // Get pre-calculated rects
                .filter(rect => rect);
            
            if (allCellsForGroup1.length > 0) {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.classList.add('kmap-group-path');
                path.style.stroke = this.groupColors[0];

                const pathData = this.calculateGroupPath(allCellsForGroup1, gridRect);
                path.setAttribute('d', pathData);
                svg.appendChild(path);
            }
            return;
        }

        // Get current layout
        const layout = this.isGrayCodeLayout ?
            window.KMapSolver.KMapGrayCodes.get(this.numVars) :
            this.layouts[this.numVars].normal;

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
            const rows = this.isGrayCodeLayout ? layout.rows : layout;
            const cols = this.isGrayCodeLayout ? layout.cols : layout[0];

            for (let row = 0; row < rows.length; row++) {
                for (let col = 0; col < cols.length; col++) {
                    const cellValue = this.isGrayCodeLayout ?
                        parseInt(`${rows[row]}${cols[col]}`, 2) :
                        layout[row][col];
                    const binary = cellValue.toString(2).padStart(this.numVars, '0');
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
                        matchingCells.push({ decimal: cellValue, row, col });
                    }
                }
            }

            // Create path for matching cells
            if (matchingCells.length > 0) {
                const groupCellRects = matchingCells.map(cellInfo => { // cellInfo is { decimal, row, col }
                    return allCellRects.get(String(cellInfo.decimal)); // Get from pre-calculated Map
                                                                    // Ensure key type matches (string if dataset.index is string)
                }).filter(rect => rect); // Filter out any undefined if a cell wasn't found (shouldn't happen)

                if (groupCellRects.length === 0) return;

                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.classList.add('kmap-group-path');
                path.dataset.wrap = this.isWrapped(matchingCells) ? 'true' : 'false';
                path.style.stroke = this.groupColors[index % this.groupColors.length];

                const pathData = this.calculateGroupPath(groupCellRects, gridRect); // Pass the rects
                path.setAttribute('d', pathData);

                svg.appendChild(path);
            }
        });
    }

    getCellElement(row, col) {
        const layout = this.isGrayCodeLayout ?
            window.KMapSolver.KMapGrayCodes.get(this.numVars) :
            this.layouts[this.numVars].normal;

        const colLength = this.isGrayCodeLayout ? layout.cols.length : layout[0].length;
        const index = row * colLength + col;
        return this.elements.grid.children[index];
    }

    calculateGroupPath(cells, gridRect) {
        const padding = 5;
        const radius = 30;

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

    isWrapped(cells) {
        // Get current layout and convert Gray code to 2D array if needed
        let layoutArray;
        if (this.isGrayCodeLayout) {
            const layout = this.layouts[this.numVars].gray;
            layoutArray = layout.rows.map(row =>
                layout.cols.map(col => parseInt(row + col, 2))
            );
        } else {
            layoutArray = this.layouts[this.numVars].normal;
        }

        // Find positions of cells in layout array
        const positions = [];
        const decimals = cells.map(cell => cell.decimal);

        for (let r = 0; r < layoutArray.length; r++) {
            for (let c = 0; c < layoutArray[r].length; c++) {
                if (decimals.includes(layoutArray[r][c])) {
                    positions.push({ row: r, col: c });
                }
            }
        }

        // Sort positions by row and column
        positions.sort((a, b) => a.row - b.row || a.col - b.col);

        // Check for wraparound in rows or columns
        for (let i = 1; i < positions.length; i++) {
            const prev = positions[i - 1];
            const curr = positions[i];

            // Check if cells are adjacent in the grid
            const rowDiff = Math.abs(curr.row - prev.row);
            const colDiff = Math.abs(curr.col - prev.col);

            // If cells aren't directly adjacent in either direction
            if (rowDiff > 1 || colDiff > 1) {
                // Check if they're adjacent through wraparound
                const wrapRowDiff = Math.min(
                    Math.abs(curr.row - prev.row + layoutArray.length),
                    Math.abs(curr.row - prev.row - layoutArray.length)
                );
                const wrapColDiff = Math.min(
                    Math.abs(curr.col - prev.col + layoutArray[0].length),
                    Math.abs(curr.col - prev.col - layoutArray[0].length)
                );

                // If cells are adjacent through wraparound
                if (wrapRowDiff <= 1 || wrapColDiff <= 1) {
                    return true;
                }
            }
        }

        return false;
    }

    toggleLayout() {
        if (this.numVars === 2) return; // Disable for 2 variables

        this.isGrayCodeLayout = !this.isGrayCodeLayout;
        const states = this.grid.slice();

        // Update layout icon using classes
        const btn = this.elements.btnToggleLayout;
        btn.classList.remove(this.isGrayCodeLayout ? 'binary-layout' : 'gray-layout');
        btn.classList.add(this.isGrayCodeLayout ? 'gray-layout' : 'binary-layout');

        this.initializeUI();

        // Restore states
        states.forEach((state, index) => {
            const cell = this.elements.grid.querySelector(`.cell[data-index="${index}"]`);
            if (cell) this.applyState(cell, state, true);
        });

        // Update layout text
        this.updateLayoutText();

        // Recalculate groups
        this.solve();
    }

    switchTab(tabName) {
        // Update active tab
        document.querySelectorAll('.btn-tab').forEach(button => {
            button.classList.toggle('active', button.dataset.tab === tabName);

            // Update slider position if this is the active button
            if (button.dataset.tab === tabName) {
                this.updateSliderPosition(button);
            }
        });

        // Show/hide content
        document.querySelectorAll('.tab-content-container').forEach(content => {
            content.classList.toggle('active', content.id === tabName);
        });

        // Show/hide layout button based on tab and variable count
        const layoutBtn = this.elements.btnToggleLayout;
        if (layoutBtn) {
            // Only show layout button if we're in kmap tab AND not in 2-variable mode
            layoutBtn.style.display = (tabName === 'kmap' && this.numVars !== 2) ? 'flex' : 'none';
        }
    }

    setupEventListeners() {
        this.setupTabHandlers();
        this.setupMenuHandlers();
        this.setupControlHandlers();
        this.setupVariableCycleHandler();
        this.setupLayoutHandlers();
        this.setupClipboardHandlers();

        // Add event listener for hide zeros toggle
        this.elements.btnToggleZeros?.addEventListener('click', () => {
            this.hideZeros = !this.hideZeros;
            localStorage.setItem('hideZeros', this.hideZeros);
            this.updateAllCellDisplays();
            this.elements.btnToggleZeros.classList.toggle('active', this.hideZeros);
        });
    }

    updateAllCellDisplays() {
        // Update K-Map cells
        const kmapCells = this.elements.grid.querySelectorAll('.cell');
        kmapCells.forEach(cell => {
            const valDiv = cell.querySelector('.value-display');
            if (valDiv) {
                const state = cell.dataset.state || '0';
                valDiv.textContent = (state === '1' || state === 'X') ? state : 
                    (this.hideZeros ? 'ㅤ' : '0');
            }
        });
        
        // Update Truth Table cells
        const truthTableCells = this.elements.truthTableBody?.querySelectorAll('td[data-index]');
        truthTableCells?.forEach(cell => {
            const state = cell.dataset.state || '0';
            cell.textContent = (state === '1' || state === 'X') ? state : 
                (this.hideZeros ? 'ㅤ' : '0');
        });
    }

    setupTabHandlers() {
        // Tab switching
        this.elements.btnTab.forEach(button => {
            button.addEventListener('click', () => {
                this.switchTab(button.dataset.tab);
                this.elements.tabsWrapper.classList.remove('show');
                this.updateSliderPosition(button);
            });
        });
    }

    setupMenuHandlers() {
        // Hamburger menu
        if (this.elements.btnShowMenu && this.elements.tabsWrapper) {
            this.elements.btnShowMenu.addEventListener('click', () => {
                this.elements.tabsWrapper.classList.toggle('show');
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!this.elements.tabsWrapper.contains(e.target) &&
                    !this.elements.btnShowMenu.contains(e.target)) {
                    this.elements.tabsWrapper.classList.remove('show');
                }
            });
        }
    }

    setupControlHandlers() {
        // Controls
        this.elements.btnSetOnes.addEventListener('click', () => this.setAllStates('1'));
        this.elements.btnSetXs.addEventListener('click', () => this.setAllStates('X'));
        this.elements.btnSetZeros.addEventListener('click', () => this.setAllStates('0'));
    }

    updateToggleButton() {
        const { btnToggleLayout, kmapTab } = this.elements;
        const isKmapActive = kmapTab && kmapTab.classList.contains('active');
        if (btnToggleLayout) {
            btnToggleLayout.style.display = isKmapActive ? 'flex' : 'none';
            btnToggleLayout.disabled = this.numVars === 2;
            btnToggleLayout.classList.toggle('disabled', this.numVars === 2);
            this.updateLayoutText();
        }
    }

    updateLayoutText() {
        const layoutText = this.elements.btnToggleLayout.querySelector('.layout-text');
        if (!layoutText) return;

        if (this.numVars === 2) {
            layoutText.textContent = 'AB';
        } else if (this.numVars === 3) {
            layoutText.textContent = this.isGrayCodeLayout ? 'C/AB' : 'AB/C';
        } else {
            layoutText.textContent = this.isGrayCodeLayout ? 'CD/AB' : 'AB/CD';
        }
    }

    setupVariableCycleHandler() {
        if (this.elements.dropdownVariables) {
            // Set initial value
            this.elements.dropdownVariables.value = this.numVars;

            // Handle variable changes
            this.elements.dropdownVariables.addEventListener('change', () => {
                this.numVars = parseInt(this.elements.dropdownVariables.value);

                // Update variables array
                this.variables = [...Array(this.numVars).keys()].map(i => String.fromCharCode(65 + i));
                this.size = 1 << this.numVars;

                // Update data-vars attribute
                document.body.setAttribute('data-vars', this.numVars);

                // Force Gray code layout for 2 variables
                if (this.numVars === 2) {
                    this.isGrayCodeLayout = true;
                }

                // Reinitialize UI with new variable count
                this.initializeUI();
                this.initializeTruthTable();

                // Update toggle button visibility and text
                this.updateToggleButton();

                // Clear all states and solution
                this.clear();
            });
        }
    }

    setupLayoutHandlers() {
        // Setup layout toggle button
        const btnToggleLayout = this.elements.btnToggleLayout;
        if (btnToggleLayout) {
            btnToggleLayout.addEventListener('click', () => this.toggleLayout());
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
}

