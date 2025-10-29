// K-Map Interface
class KMapInterface {
    constructor(numVars = 4) {
        this.elements = {
            grid: document.getElementById('kmap-grid'),
            solution: document.getElementById('solution'),
            dropdownSolutionsContainer: document.getElementById('dropdown-solutions-container'),
            dropdownSolutionsToggle: document.getElementById('dropdown-solutions-toggle'),
            dropdownSolutionsLabel: document.getElementById('dropdown-solutions-label'),
            dropdownSolutionsMenu: document.getElementById('dropdown-solutions-menu'),
            btnCopySolution: document.getElementById('btn-copy-solution'),
            truthTableBody: document.getElementById('truth-table-body'),
            btnToggleLayout: document.getElementById('btn-toggle-layout'),
            btnSetOnes: document.getElementById('btn-set-ones'),
            btnSetXs: document.getElementById('btn-set-xs'),
            btnSetZeros: document.getElementById('btn-set-zeros'),
            kmapTab: document.getElementById('kmap'),
            dropdownVariablesToggle: document.getElementById('dropdown-variables-toggle'),
            dropdownVariablesLabel: document.getElementById('dropdown-variables-label'),
            dropdownVariablesMenu: document.getElementById('dropdown-variables-menu'),
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
                    result += `<span style="text-decoration: overline; margin: 0 1px;">${term[i]}</span>`;
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
        const { solution, dropdownSolutionsContainer, dropdownSolutionsMenu, dropdownSolutionsLabel } = this.elements;
        const solutions = result.solutions || [result];

        if (solutions.length > 1) {
            // Populate dropdown menu
            dropdownSolutionsMenu.innerHTML = solutions.map((sol, i) =>
                `<button class="dropdown-item" data-solution="${sol.replace(/"/g, '&quot;')}">#${i + 1} of ${solutions.length}</button>`
            ).join('');

            dropdownSolutionsContainer.style.display = 'inline-block';
            dropdownSolutionsLabel.textContent = `#1 of ${solutions.length}`;

            // Setup dropdown handlers
            const toggle = this.elements.dropdownSolutionsToggle;
            const menu = dropdownSolutionsMenu;

            toggle.onclick = (e) => {
                e.stopPropagation();
                menu.classList.toggle('is-visible');
            };

            // Close on outside click
            document.addEventListener('click', (e) => {
                if (!menu.contains(e.target) && e.target !== toggle) {
                    menu.classList.remove('is-visible');
                }
            });

            // Handle item clicks
            menu.querySelectorAll('.dropdown-item').forEach((item, index) => {
                item.onclick = () => {
                    const sol = item.dataset.solution;
                    solution.innerHTML = this.addOverline(sol);
                    dropdownSolutionsLabel.textContent = `#${index + 1} of ${solutions.length}`;
                    menu.classList.remove('is-visible');
                    const terms = sol.split(' + ');
                    this.updateGroupsFromTerms(terms);
                };
            });
        } else {
            dropdownSolutionsContainer.style.display = 'none';
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
        this.elements.dropdownSolutionsContainer.style.display = 'none';

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
        this.setupPopupHandlers();
        this.setupThemeHandlers();
        this.setupControlHandlers();
        this.setupVariableCycleHandler();
        this.setupLayoutHandlers();
        this.setupClipboardHandlers();
        this.setupNavigationHandlers();

        // Add event listener for hide zeros toggle
        this.elements.btnToggleZeros?.addEventListener('click', () => {
            this.hideZeros = !this.hideZeros;
            localStorage.setItem('hideZeros', this.hideZeros);
            this.updateAllCellDisplays();
            this.elements.btnToggleZeros.classList.toggle('active', this.hideZeros);
        });
    }


    setupPopupHandlers() {
        const closeBtnInfo = document.getElementById('btn-popup-close-info');
        const closeBtnSettings = document.getElementById('btn-popup-close-settings');
        const infoBtn = document.getElementById('btn-show-info');
        const infoPopup = document.getElementById('popup-info');
        const settingsBtn = document.getElementById('btn-show-settings');
        const settingsPopup = document.getElementById('popup-settings');
        const btnUpdateApp = document.getElementById('btn-update-app');
        const popupUpdateConfirm = document.getElementById('popup-update-confirm');
        const closeBtnUpdateConfirm = document.getElementById('btn-popup-close-update-confirm');
        const btnCancelUpdate = document.getElementById('btn-cancel-update');
        const btnConfirmUpdate = document.getElementById('btn-confirm-update');

        if (infoBtn && infoPopup) {
            infoBtn.addEventListener('click', () => infoPopup.classList.add('active'));
        }
        if (closeBtnInfo && infoPopup) {
            closeBtnInfo.addEventListener('click', () => infoPopup.classList.remove('active'));
            infoPopup.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) e.currentTarget.classList.remove('active');
            });
        }
        if (settingsBtn && settingsPopup) {
            settingsBtn.addEventListener('click', () => settingsPopup.classList.add('active'));
        }
        if (closeBtnSettings && settingsPopup) {
            closeBtnSettings.addEventListener('click', () => settingsPopup.classList.remove('active'));
            settingsPopup.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) e.currentTarget.classList.remove('active');
            });
        }

        if (btnUpdateApp && popupUpdateConfirm) {
            btnUpdateApp.addEventListener('click', () => {
                settingsPopup.classList.remove('active');
                popupUpdateConfirm.classList.add('active');
            });
        }

        if (closeBtnUpdateConfirm && popupUpdateConfirm) {
            closeBtnUpdateConfirm.addEventListener('click', () => popupUpdateConfirm.classList.remove('active'));
        }

        if (btnCancelUpdate && popupUpdateConfirm) {
            btnCancelUpdate.addEventListener('click', () => popupUpdateConfirm.classList.remove('active'));
        }

        if (popupUpdateConfirm) {
            popupUpdateConfirm.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) e.currentTarget.classList.remove('active');
            });
        }

        if (btnConfirmUpdate) {
            btnConfirmUpdate.addEventListener('click', async () => {
                try {
                    localStorage.clear();
                    const cacheNames = await caches.keys();
                    await Promise.all(cacheNames.map(name => caches.delete(name)));

                    const registration = await navigator.serviceWorker.getRegistration();
                    if (registration) await registration.unregister();

                    window.location.reload(true);
                } catch (error) {
                    console.error('Update failed:', error);
                    alert('Update failed. Please check console for details.');
                }
            });
        }
    }

    setupThemeHandlers() {
        const themeToggle = this.elements.btnToggleTheme;
        if (!themeToggle) return;
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        const prefersLightScheme = window.matchMedia('(prefers-color-scheme: light)');
        function initializeTheme() {
            const storedTheme = localStorage.getItem('theme');
            let theme = 'light';
            if (storedTheme) {
                theme = storedTheme;
            } else if (prefersLightScheme.matches) {
                theme = 'light';
            } else if (prefersDarkScheme.matches) {
                theme = 'dark';
            }
            document.documentElement.setAttribute('data-theme', theme);
            themeToggle.setAttribute('data-theme', theme);
        }
        initializeTheme();
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            themeToggle.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
        prefersLightScheme.addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                const theme = e.matches ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', theme);
                themeToggle.setAttribute('data-theme', theme);
            }
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
        const toggle = this.elements.dropdownVariablesToggle;
        const menu = this.elements.dropdownVariablesMenu;
        const label = this.elements.dropdownVariablesLabel;

        if (!toggle || !menu) return;

        // Set initial label
        label.textContent = `${this.numVars} Vars`;

        // Toggle dropdown
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('is-visible');
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!menu.contains(e.target) && e.target !== toggle) {
                menu.classList.remove('is-visible');
            }
        });

        // Handle item clicks
        menu.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                const value = parseInt(item.dataset.value);
                this.numVars = value;
                label.textContent = `${value} Vars`;
                menu.classList.remove('is-visible');

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
        });
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

    setupNavigationHandlers() {
        const headerNav = document.getElementById('header-nav');
        const navToggle = document.getElementById('nav-toggle');
        const navTitle = document.getElementById('nav-title');
        const navItems = document.getElementById('nav-items');
        const navPills = navItems?.querySelectorAll('.btn-pill');
        const slider = navItems?.querySelector('.pill-selector-slider');

        if (!headerNav || !navItems) return;

        // Set up pill click handlers
        navPills.forEach(pill => {
            pill.addEventListener('click', () => {
                navPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');

                if (!headerNav.classList.contains('compact') && slider) {
                    const pillRect = pill.getBoundingClientRect();
                    const containerRect = navItems.getBoundingClientRect();
                    slider.style.left = `${pillRect.left - containerRect.left}px`;
                    slider.style.width = `${pillRect.width}px`;
                    slider.style.height = `${pillRect.height}px`;
                }

                if (navTitle) navTitle.textContent = pill.textContent;
                if (headerNav.classList.contains('compact')) navItems.classList.remove('is-visible');

                const tabName = pill.dataset.tab;
                if (tabName) {
                    document.querySelectorAll('.tab-content-container').forEach(tab => tab.classList.remove('active'));
                    const selectedTab = document.getElementById(tabName);
                    if (selectedTab) selectedTab.classList.add('active');
                }
            });
        });

        if (navToggle) {
            navToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                navItems.classList.toggle('is-visible');
                navToggle.setAttribute('aria-expanded', navItems.classList.contains('is-visible'));
            });
        }

        document.addEventListener('click', (e) => {
            if (headerNav.classList.contains('compact') && navItems.classList.contains('is-visible') &&
                !navItems.contains(e.target) && !navToggle.contains(e.target)) {
                navItems.classList.remove('is-visible');
                navToggle.setAttribute('aria-expanded', 'false');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navItems.classList.contains('is-visible')) {
                navItems.classList.remove('is-visible');
                navToggle.setAttribute('aria-expanded', 'false');
            }
        });

        const checkOverflow = () => {
            headerNav.classList.remove('compact');
            navItems.classList.remove('is-visible');

            const headerRect = headerNav.getBoundingClientRect();
            const navItemsRect = navItems.getBoundingClientRect();
            const headerActions = document.querySelector('.header-actions');
            const actionsWidth = headerActions ? headerActions.getBoundingClientRect().width : 0;
            const needsCompact = navItemsRect.width > (headerRect.width - actionsWidth - 32);

            if (needsCompact) {
                headerNav.classList.add('compact');
                const activePill = navItems.querySelector('.btn-pill.active');
                if (activePill && navTitle) navTitle.textContent = activePill.textContent;
            } else {
                const activePill = navItems.querySelector('.btn-pill.active');
                if (activePill && slider) {
                    setTimeout(() => {
                        const pillRect = activePill.getBoundingClientRect();
                        const containerRect = navItems.getBoundingClientRect();
                        slider.style.left = `${pillRect.left - containerRect.left}px`;
                        slider.style.width = `${pillRect.width}px`;
                        slider.style.height = `${pillRect.height}px`;
                    }, 0);
                }
            }
        };

        checkOverflow();
        window.addEventListener('resize', checkOverflow);

        const activePill = navItems.querySelector('.btn-pill.active');
        if (activePill && slider) {
            const pillRect = activePill.getBoundingClientRect();
            const containerRect = navItems.getBoundingClientRect();
            slider.style.left = `${pillRect.left - containerRect.left}px`;
            slider.style.width = `${pillRect.width}px`;
            slider.style.height = `${pillRect.height}px`;
        }
    }
}

