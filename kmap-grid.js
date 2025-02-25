// K-Map Grid Functionality
class KMapGrid extends KMapCore {
    constructor(numVars = 4) {
        super(numVars);
        this.initializeUI();
        this.clear(); // Clear on initialization
    }

    initializeUI() {
        super.initializeUI();
        
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

    updateSvgViewBox(svg) {
        const gridRect = this.elements.grid.getBoundingClientRect();
        svg.setAttribute('viewBox', `0 0 ${gridRect.width} ${gridRect.height}`);
        svg.style.width = `${gridRect.width}px`;
        svg.style.height = `${gridRect.height}px`;
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

    toggleKMap(cell) {
        const newState = this.cycleState(cell.dataset.state);
        this.applyState(cell, newState);

        const index = parseInt(cell.dataset.index);
        const linkedCell = this.elements.truthTableBody.querySelector(`td[data-index="${index}"]`);

        if (linkedCell) {
            this.applyState(linkedCell, newState, false);
        }

        this.grid[index] = newState;
        this.solve();
    }

    cycleState(currentState) {
        if (currentState === '0') return '1';
        if (currentState === '1') return 'x';
        return '0';
    }

    applyState(cell, state, isKMapCell = true) {
        cell.dataset.state = state;
        cell.textContent = state.toUpperCase();
        
        if (isKMapCell) {
            // Update cell appearance based on state
            cell.classList.remove('state-0', 'state-1', 'state-x');
            cell.classList.add(`state-${state.toLowerCase()}`);
        }
        
        // Update solution
        this.solve();
    }

    updateGroupsFromTerms(terms) {
        const svg = this.elements.grid.querySelector('.kmap-groups-svg');
        if (!svg) return;

        // Clear existing groups
        svg.innerHTML = '';

        // Create new groups
        terms.forEach((term, index) => {
            const cells = this.getCellsForTerm(term);
            if (cells.length > 0) {
                const color = this.groupColors[index % this.groupColors.length];
                const path = this.calculateGroupPath(cells);
                path.setAttribute('stroke', color);
                path.setAttribute('fill', color.replace('0.8', '0.2'));
                svg.appendChild(path);
            }
        });
    }

    getCellsForTerm(term) {
        // Get cells that match the term pattern
        const cells = [];
        const pattern = term.split('').map(char => {
            if (char === "'") return '0';
            if (/[A-D]/.test(char)) return '1';
            return '.';
        }).join('');

        this.elements.grid.querySelectorAll('.cell[data-state="1"]').forEach(cell => {
            const index = parseInt(cell.dataset.index);
            const binary = index.toString(2).padStart(this.numVars, '0');
            if (binary.match(pattern)) {
                cells.push(cell);
            }
        });

        return cells;
    }

    calculateGroupPath(cells) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill-opacity', '0.2');
        path.setAttribute('stroke-opacity', '0.8');

        // Calculate path based on cell positions
        const points = cells.map(cell => {
            const rect = cell.getBoundingClientRect();
            const gridRect = this.elements.grid.getBoundingClientRect();
            return {
                x: rect.left - gridRect.left + rect.width / 2,
                y: rect.top - gridRect.top + rect.height / 2
            };
        });

        // Generate path data
        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            d += ` L ${points[i].x} ${points[i].y}`;
        }
        d += ' Z';

        path.setAttribute('d', d);
        return path;
    }

    clear() {
        super.clear();

        // Clear K-map cells
        this.elements.grid.querySelectorAll('.cell').forEach(cell => {
            this.applyState(cell, '0', true);
        });

        // Clear group circles by removing all path elements from the SVG
        const svg = this.elements.grid.querySelector('.kmap-groups-svg');
        if (svg) {
            const paths = svg.querySelectorAll('path');
            paths.forEach(path => path.remove());
        }
    }

    setAllStates(value) {
        super.setAllStates(value);

        // Update K-Map cells
        this.elements.grid.querySelectorAll('.cell').forEach(cell =>
            this.applyState(cell, value, true));
    }

    toggleLayout() {
        // Store current grid state
        const currentState = [...this.grid];
        
        // Toggle layout
        super.toggleLayout();
        
        // Reinitialize UI with new layout
        this.initializeUI();
        
        // Restore grid state
        this.grid = currentState;
        
        // Update cell states in new layout
        this.elements.grid.querySelectorAll('.cell').forEach(cell => {
            const index = parseInt(cell.dataset.index);
            this.applyState(cell, this.grid[index], true);
        });

        // Update solution and groups
        this.solve();
    }

    onVariableChange(newVars) {
        super.onVariableChange(newVars);
        this.initializeUI();
        this.updateToggleButton();
    }
}

// Export the class
window.KMapGrid = KMapGrid;
