class KMapSolver {
    constructor() {
        this.variables = 4;
        this.size = 16; // 2^4 for 4 variables
        this.grid = Array(this.size).fill(0);
        this.initializeUI();
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

                // Create cell content with binary representation
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
        const value = valueDisplay.textContent === '0' ? '1' : '0';
        valueDisplay.textContent = value;
        cell.classList.toggle('selected', value === '1');
        this.grid[parseInt(cell.dataset.index)] = parseInt(value);
    }

    grayCodeToIndex(n) {
        return n ^ (n >> 1);
    }

    decimalToBinary(n) {
        return n.toString(2).padStart(4, '0').split('').map(Number);
    }

    differByOneBit(term1, term2) {
        const bin1 = this.decimalToBinary(term1);
        const bin2 = this.decimalToBinary(term2);
        let diffCount = 0;
        let diffPos = -1;

        for (let i = 0; i < 4; i++) {
            if (bin1[i] !== bin2[i]) {
                diffCount++;
                diffPos = i;
            }
        }

        return diffCount === 1 ? diffPos : -1;
    }

    getGroups(minterm, minterms) {
        const groups = [];
        const visited = new Set();
        
        for (let size = 0; size <= 3; size++) {
            const groupSize = 1 << size;
            const potentialGroup = new Set([minterm]);
            
            this.expandGroup(minterm, minterms, groupSize, potentialGroup, visited);
            
            if (potentialGroup.size === groupSize) {
                groups.push([...potentialGroup]);
            }
        }
        
        return groups;
    }

    expandGroup(start, minterms, targetSize, group, visited) {
        if (group.size === targetSize) return true;
        
        for (const m of minterms) {
            if (!group.has(m) && !visited.has(m)) {
                let isAdjacent = true;
                for (const term of group) {
                    if (this.differByOneBit(term, m) === -1) {
                        isAdjacent = false;
                        break;
                    }
                }
                
                if (isAdjacent) {
                    group.add(m);
                    visited.add(m);
                    if (this.expandGroup(start, minterms, targetSize, group, visited)) {
                        return true;
                    }
                    group.delete(m);
                    visited.delete(m);
                }
            }
        }
        
        return false;
    }

    groupToTerm(group) {
        if (group.length === 16) return '1';
        if (group.length === 0) return '0';

        const terms = group.map(m => this.decimalToBinary(m));
        const result = terms[0].slice();

        for (let i = 1; i < terms.length; i++) {
            for (let j = 0; j < 4; j++) {
                if (terms[i][j] !== result[j]) {
                    result[j] = -1;
                }
            }
        }

        const vars = ['A', 'B', 'C', 'D'];
        let term = '';
        
        for (let i = 0; i < 4; i++) {
            if (result[i] !== -1) {
                if (result[i] === 0) {
                    term += `<span class="overline">${vars[i]}</span>`;
                } else {
                    term += vars[i];
                }
            }
        }
        
        return term || '1';
    }

    solve(inputMinterms = null) {
        let minterms;
        if (inputMinterms === null) {
            minterms = [];
            const cells = document.querySelectorAll('.cell');
            cells.forEach(cell => {
                if (cell.querySelector('.value-display').textContent === '1') {
                    minterms.push(parseInt(cell.dataset.index));
                }
            });
        } else {
            minterms = inputMinterms;
        }

        if (minterms.length === 0) return '0';
        if (minterms.length === 16) return '1';

        const allGroups = new Set();
        for (const m of minterms) {
            const groups = this.getGroups(m, minterms);
            groups.forEach(group => allGroups.add(JSON.stringify(group)));
        }

        const groups = Array.from(allGroups)
            .map(g => JSON.parse(g))
            .sort((a, b) => b.length - a.length);

        const terms = groups
            .map(group => this.groupToTerm(group))
            .filter((term, index, self) => self.indexOf(term) === index)
            .filter(term => term !== '0');

        const solution = terms.join(' + ');
        
        if (inputMinterms === null) {
            document.getElementById('solution').innerHTML = solution;
        }
        return solution;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const solver = new KMapSolver();
    
    document.getElementById('solve-btn').addEventListener('click', () => {
        solver.solve();
    });
    
    document.getElementById('clear-btn').addEventListener('click', () => {
        solver.initializeUI();
    });
});
