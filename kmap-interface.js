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
            inputToggleZeros: document.getElementById('input-toggle-zeros'),
            inputToggleTheme: document.getElementById('input-toggle-theme'),
            installPill: document.getElementById('install-pill'),
            btnInstallApp: document.getElementById('btn-install-app'),
            btnCloseInstallPill: document.getElementById('btn-close-install-pill'),
            updatePill: document.getElementById('update-pill'),
            btnApplyUpdate: document.getElementById('btn-apply-update'),
            btnCloseUpdatePill: document.getElementById('btn-close-update-pill')
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
        this.grid = Array(this.size).fill('0');
        this.kmapCells = [];
        this.truthCells = [];
        this.isTransposedLayout = true; // true = AB/CD, false = CD/AB
        this.hideZeros = localStorage.getItem('hideZeros') !== null ? localStorage.getItem('hideZeros') === 'true' : true;
        this.layouts = this.initializeLayouts();

        // Initialize UI components
        this.initializeUI();
        this.initializeTruthTable();
        this.setupEventListeners();
        this.setupInstallPrompt();
        this.setupUpdatePrompt();
        this.clear();
    }

    initializeLayouts() {
        const solver = window.KMapSolver;
        const toStandardMatrix = (vars) => {
            const gray = solver.KMapGrayCodes.get(vars);
            const colsLen = gray.cols.length;
            const shift = Math.log2(colsLen);
            return gray.rows.map(row => {
                const rBits = parseInt(row, 2);
                return gray.cols.map(col => (rBits << shift) | parseInt(col, 2));
            });
        };

        const createLayout = (matrix) => {
            const decimalToPos = [];
            for (let r = 0; r < matrix.length; r++) {
                for (let c = 0; c < matrix[r].length; c++) {
                    decimalToPos[matrix[r][c]] = { row: r, col: c };
                }
            }
            return { matrix, decimalToPos };
        };

        return {
            2: {
                standard: createLayout(toStandardMatrix(2)),
                transposed: createLayout(solver.KMapTransposedLayouts.get(2))
            },
            3: {
                standard: createLayout(toStandardMatrix(3)),
                transposed: createLayout(solver.KMapTransposedLayouts.get(3))
            },
            4: {
                standard: createLayout(toStandardMatrix(4)),
                transposed: createLayout(solver.KMapTransposedLayouts.get(4))
            }
        };
    }

    getCurrentLayout() {
        const layoutObj = this.layouts[this.numVars];
        return this.isTransposedLayout ? layoutObj.transposed : layoutObj.standard;
    }

    getCurrentLayoutMatrix() {
        return this.getCurrentLayout().matrix;
    }

    initializeUI() {
        const grid = this.elements.grid;
        grid.innerHTML = '';
        this.kmapCells = Array(this.size);

        const matrix = this.getCurrentLayoutMatrix();
        grid.style.gridTemplateColumns = `repeat(${matrix[0].length}, minmax(10px, 1fr))`;

        const fragment = document.createDocumentFragment();
        for (let r = 0; r < matrix.length; r++) {
            for (let c = 0; c < matrix[r].length; c++) {
                const cellIndex = matrix[r][c];
                const cell = this.createCell(cellIndex);
                this.kmapCells[cellIndex] = cell;
                fragment.appendChild(cell);
            }
        }
        grid.appendChild(fragment);

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

        // Binary representation
        const binaryPart = index.toString(2).padStart(this.numVars, '0');

        // Create decimal display
        const decDiv = document.createElement('div');
        decDiv.className = 'decimal-display';
        decDiv.textContent = index;

        // Create value display (center)
        const valDiv = document.createElement('div');
        valDiv.className = 'value-display';
        valDiv.textContent = (state === '1' || state === 'X') ? state : (this.hideZeros ? 'ㅤ' : '0');

        // Create binary display
        const binDiv = document.createElement('div');
        binDiv.className = 'binary-display';
        binDiv.textContent = binaryPart;

        if (state === '1') cell.classList.add('selected');
        else if (state === 'X') cell.classList.add('dont-care');

        const centerWrapper = document.createElement('div');
        centerWrapper.className = 'center-wrapper';
        centerWrapper.appendChild(valDiv);

        cell.append(decDiv, centerWrapper, binDiv);
        cell.addEventListener('click', () => this.toggleCell(index));
        return cell;
    }

    initializeTruthTable() {
        const tbody = this.elements.truthTableBody;
        tbody.innerHTML = '';
        this.truthCells = Array(this.size);

        // Update variable column visibility in header
        const varCols = document.querySelectorAll('.truth-table thead tr th:not(:first-child):not(:last-child)');
        varCols.forEach((col, i) => col.style.display = i < this.numVars ? '' : 'none');

        const fragment = document.createDocumentFragment();
        for (let i = 0; i < this.size; i++) {
            const row = document.createElement('tr');
            row.dataset.rowIndex = i;

            const binary = i.toString(2).padStart(this.numVars, '0');
            const state = this.grid[i] || '0';
            const valueCell = this.createTableCell((state === '1' || state === 'X') ? state : (this.hideZeros ? 'ㅤ' : '0'), '', true, i);
            this.truthCells[i] = valueCell;

            const cells = [
                this.createTableCell(i, 'row-id'),
                ...Array.from({ length: 4 }, (_, j) =>
                    this.createTableCell(j < this.numVars ? binary[j] : '', '', j < this.numVars)),
                valueCell
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
            td.dataset.state = this.grid[index] || '0';
            td.addEventListener('click', () => this.toggleCell(index));
        }
        return td;
    }

    toggleCell(index) {
        const currentState = this.grid[index] || '0';
        const newState = this.cycleState(currentState);
        this.setCellState(index, newState);

        clearTimeout(this._solveTimer);
        this._solveTimer = setTimeout(() => this.solve(), 100);
    }

    setCellState(index, newState) {
        this.grid[index] = newState;

        const kmapCell = this.kmapCells[index];
        if (kmapCell) {
            kmapCell.dataset.state = newState;
            const valDiv = kmapCell.querySelector('.value-display');
            if (valDiv) {
                valDiv.textContent = (newState === '1' || newState === 'X') ? newState : (this.hideZeros ? 'ㅤ' : '0');
            }
            kmapCell.classList.toggle('selected', newState === '1');
            kmapCell.classList.toggle('dont-care', newState === 'X');
        }

        const truthCell = this.truthCells[index];
        if (truthCell) {
            truthCell.dataset.state = newState;
            truthCell.textContent = (newState === '1' || newState === 'X') ? newState : (this.hideZeros ? 'ㅤ' : '0');
            truthCell.classList.toggle('selected', newState === '1');
            truthCell.classList.toggle('dont-care', newState === 'X');
        }
    }

    getMintermsAndDontCares() {
        const minterms = [];
        const dontcares = [];
        for (let i = 0; i < this.size; i++) {
            const st = this.grid[i];
            if (st === '1') minterms.push(i);
            else if (st === 'X') dontcares.push(i);
        }
        return { minterms, dontcares };
    }

    addOverline(solution) {
        // Special cases
        if (solution === "0" || solution === "1" || solution === "X") {
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
            if (this._closeSolutionsDropdown) {
                document.removeEventListener('click', this._closeSolutionsDropdown);
            }
            this._closeSolutionsDropdown = (e) => {
                if (!menu.contains(e.target) && e.target !== toggle) {
                    menu.classList.remove('is-visible');
                }
            };
            document.addEventListener('click', this._closeSolutionsDropdown);

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
        for (let i = 0; i < this.size; i++) {
            this.setCellState(i, '0');
        }
        this.elements.solution.innerHTML = '';
        this.elements.dropdownSolutionsContainer.style.display = 'none';

        const svg = this.elements.grid.querySelector('.kmap-groups-svg');
        if (svg) svg.innerHTML = '';
    }

    setAllStates(value) {
        for (let i = 0; i < this.size; i++) {
            this.setCellState(i, value);
        }
        this.solve();
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
        btnCopySolution.style.color = 'var(--kmap-primary)';
        setTimeout(() => {
            btnCopySolution.style.color = 'var(--color-text-medium)';
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
        if (!terms || terms.length === 0 || terms[0] === "0" || terms[0] === "X") {
            return; // No groups for empty solution, "0", or "X"
        }

        const gridRect = this.elements.grid.getBoundingClientRect();
        if (gridRect.width === 0 || gridRect.height === 0) return;

        // Special case for "1" - group all cells
        if (terms.length === 1 && terms[0] === "1") {
            const allRects = this.kmapCells.map(c => c?.getBoundingClientRect()).filter(Boolean);
            if (allRects.length > 0) {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.classList.add('kmap-group-path');
                path.style.stroke = this.groupColors[0];
                path.setAttribute('d', this.calculateGroupPath(allRects, gridRect));
                svg.appendChild(path);
            }
            return;
        }

        const { decimalToPos, matrix } = this.getCurrentLayout();

        // Process each term
        terms.forEach((term, index) => {
            if (term === "1") return;

            // Build careMask and matchMask directly using bit operations
            let careMask = 0;
            let matchMask = 0;
            for (let i = 0; i < term.length; i++) {
                const isNeg = term[i] === '!';
                const char = isNeg ? term[++i] : term[i];
                const varIdx = this.variables.indexOf(char);
                if (varIdx !== -1) {
                    const shift = this.numVars - 1 - varIdx;
                    careMask |= (1 << shift);
                    if (!isNeg) matchMask |= (1 << shift);
                }
            }

            // Find matching cells using bitwise comparison
            const matchingCells = [];
            for (let dec = 0; dec < this.size; dec++) {
                if ((dec & careMask) === matchMask) {
                    const pos = decimalToPos[dec];
                    if (pos) {
                        matchingCells.push({ decimal: dec, row: pos.row, col: pos.col });
                    }
                }
            }

            if (matchingCells.length > 0) {
                const rects = matchingCells.map(m => this.kmapCells[m.decimal]?.getBoundingClientRect()).filter(Boolean);
                if (rects.length === 0) return;

                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.classList.add('kmap-group-path');
                path.dataset.wrap = this.isWrapped(matchingCells, matrix) ? 'true' : 'false';
                path.style.stroke = this.groupColors[index % this.groupColors.length];
                path.setAttribute('d', this.calculateGroupPath(rects, gridRect));
                svg.appendChild(path);
            }
        });
    }

    calculateGroupPath(rects, gridRect) {
        const padding = 5;
        const radius = 30;

        let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
        for (let i = 0; i < rects.length; i++) {
            const r = rects[i];
            const rLeft = r.left - gridRect.left - padding;
            const rTop = r.top - gridRect.top - padding;
            const rRight = r.right - gridRect.left + padding;
            const rBottom = r.bottom - gridRect.top + padding;

            if (rLeft < left) left = rLeft;
            if (rTop < top) top = rTop;
            if (rRight > right) right = rRight;
            if (rBottom > bottom) bottom = rBottom;
        }

        return `M ${left + radius} ${top}
            L ${right - radius} ${top}
            Q ${right} ${top} ${right} ${top + radius}
            L ${right} ${bottom - radius}
            Q ${right} ${bottom} ${right - radius} ${bottom}
            L ${left + radius} ${bottom}
            Q ${left} ${bottom} ${left} ${bottom - radius}
            L ${left} ${top + radius}
            Q ${left} ${top} ${left + radius} ${top}`;
    }

    isWrapped(cells, matrix) {
        const rowCount = matrix.length;
        const colCount = matrix[0].length;

        // Sort by row, then col
        cells.sort((a, b) => a.row - b.row || a.col - b.col);

        for (let i = 1; i < cells.length; i++) {
            const prev = cells[i - 1];
            const curr = cells[i];

            if (Math.abs(curr.row - prev.row) > 1 || Math.abs(curr.col - prev.col) > 1) {
                const wrapRow = Math.min(
                    Math.abs(curr.row - prev.row + rowCount),
                    Math.abs(curr.row - prev.row - rowCount)
                );
                const wrapCol = Math.min(
                    Math.abs(curr.col - prev.col + colCount),
                    Math.abs(curr.col - prev.col - colCount)
                );
                if (wrapRow <= 1 || wrapCol <= 1) return true;
            }
        }
        return false;
    }

    toggleLayout() {
        if (this.numVars === 2) return;

        this.isTransposedLayout = !this.isTransposedLayout;
        this.initializeUI();
        this.updateLayoutText();
        this.solve();
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
        if (this.elements.inputToggleZeros) {
            this.elements.inputToggleZeros.checked = this.hideZeros;
            this.elements.inputToggleZeros.addEventListener('change', () => {
                this.hideZeros = this.elements.inputToggleZeros.checked;
                localStorage.setItem('hideZeros', this.hideZeros);
                this.updateAllCellDisplays();
            });
        }
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
        const themeToggle = this.elements.inputToggleTheme;
        if (!themeToggle) return;
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        const prefersLightScheme = window.matchMedia('(prefers-color-scheme: light)');
        function applyTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            themeToggle.checked = theme === 'dark';
        }
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
            applyTheme(theme);
        }
        initializeTheme();
        themeToggle.addEventListener('change', () => {
            const newTheme = themeToggle.checked ? 'dark' : 'light';
            applyTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        });
        prefersLightScheme.addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                applyTheme(e.matches ? 'light' : 'dark');
            }
        });
    }

    updateAllCellDisplays() {
        const zeroChar = this.hideZeros ? 'ㅤ' : '0';
        for (let i = 0; i < this.size; i++) {
            const st = this.grid[i] || '0';
            const text = (st === '1' || st === 'X') ? st : zeroChar;

            const kCell = this.kmapCells[i];
            if (kCell) {
                const valDiv = kCell.querySelector('.value-display');
                if (valDiv) valDiv.textContent = text;
            }

            const tCell = this.truthCells[i];
            if (tCell) {
                tCell.textContent = text;
            }
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
            layoutText.textContent = this.isTransposedLayout ? 'AB/C' : 'C/AB';
        } else {
            layoutText.textContent = this.isTransposedLayout ? 'AB/CD' : 'CD/AB';
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

                // Force transposed layout for 2 variables
                if (this.numVars === 2) {
                    this.isTransposedLayout = false;
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
            this.updateToggleButton();
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
                    this.updateToggleButton();
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

    setupFloatingPill({ pillElement, closeBtn, storageKey }) {
        if (!pillElement) return { show: () => {}, hide: () => {} };

        let startY = 0;
        let currentTranslateY = 0;

        const updateBodyInset = () => {
            const hasVisiblePill = document.querySelector('.bottom-pill.anim-in') !== null;
            document.body.classList.toggle('has-bottom-pill', hasVisiblePill);
        };

        const hide = (persistDismiss = true) => {
            pillElement.classList.remove('anim-in');
            pillElement.classList.add('anim-out');
            if (persistDismiss && storageKey) {
                sessionStorage.setItem(storageKey, 'true');
            }
            setTimeout(() => {
                pillElement.style.display = 'none';
                updateBodyInset();
            }, 300);
        };

        const show = () => {
            if (storageKey && sessionStorage.getItem(storageKey) === 'true') {
                return;
            }
            pillElement.style.display = 'inline-flex';
            pillElement.classList.remove('anim-out');
            pillElement.classList.add('anim-in');
            updateBodyInset();
        };

        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                hide(true);
            });
        }

        // Swipe-down to dismiss gesture
        pillElement.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            currentTranslateY = 0;
            pillElement.style.transition = 'none';
        }, { passive: true });

        pillElement.addEventListener('touchmove', (e) => {
            const deltaY = e.touches[0].clientY - startY;
            if (deltaY > 0) {
                currentTranslateY = deltaY;
                pillElement.style.transform = `translateX(-50%) translateY(${deltaY}px)`;
            }
        }, { passive: true });

        pillElement.addEventListener('touchend', () => {
            pillElement.style.transition = '';
            if (currentTranslateY > 40) {
                hide(true);
            } else {
                pillElement.style.transform = 'translateX(-50%) translateY(0)';
            }
        });

        return { show, hide };
    }

    setupInstallPrompt() {
        const { installPill, btnInstallApp, btnCloseInstallPill } = this.elements;
        if (!installPill || !btnInstallApp) return;

        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;

        if (isStandalone) return;

        const pill = this.setupFloatingPill({
            pillElement: installPill,
            closeBtn: btnCloseInstallPill,
            storageKey: 'dismissed_install_pill'
        });

        let deferredPrompt = null;

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            pill.show();
        });

        btnInstallApp.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            deferredPrompt = null;
            if (outcome === 'accepted') {
                pill.hide(true);
            }
        });

        window.addEventListener('appinstalled', () => {
            deferredPrompt = null;
            pill.hide(true);
        });
    }

    setupUpdatePrompt() {
        const { updatePill, btnApplyUpdate, btnCloseUpdatePill } = this.elements;
        if (!updatePill || !btnApplyUpdate || !('serviceWorker' in navigator)) return;

        const pill = this.setupFloatingPill({
            pillElement: updatePill,
            closeBtn: btnCloseUpdatePill,
            storageKey: 'dismissed_update_pill'
        });

        let waitingWorker = null;
        let isRefreshing = false;

        const onUpdateFound = (registration) => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    waitingWorker = newWorker;
                    pill.show();
                }
            });
        };

        navigator.serviceWorker.getRegistration().then(reg => {
            if (!reg) return;

            if (reg.waiting && navigator.serviceWorker.controller) {
                waitingWorker = reg.waiting;
                pill.show();
            }

            reg.addEventListener('updatefound', () => onUpdateFound(reg));

            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    reg.update().catch(() => {});
                }
            });
        });

        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (isRefreshing) return;
            isRefreshing = true;
            window.location.reload();
        });

        btnApplyUpdate.addEventListener('click', () => {
            if (waitingWorker) {
                waitingWorker.postMessage({ type: 'SKIP_WAITING' });
            } else {
                window.location.reload();
            }
        });
    }
}


