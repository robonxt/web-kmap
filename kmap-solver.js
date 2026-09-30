const KMapGrayCodes = new Map([
    [2, { rows: ['0', '1'], cols: ['0', '1'] }],
    [3, { rows: ['0', '1'], cols: ['00', '01', '11', '10'] }],
    [4, { rows: ['00', '01', '11', '10'], cols: ['00', '01', '11', '10'] }]
]);

const KMapTransposedLayouts = new Map([
    [2, [[0, 2], [1, 3]]],
    [3, [[0, 2, 6, 4], [1, 3, 7, 5]]],
    [4, [[0, 4, 12, 8], [1, 5, 13, 9], [3, 7, 15, 11], [2, 6, 14, 10]]]
]);

function getKMap(variables) {
    const grayCodes = KMapGrayCodes.get(variables.length);
    if (!grayCodes) return [];
    const { rows, cols } = grayCodes;
    return rows.map((row, r) => cols.map((col, c) => {
        const binary = `${row}${col}`;
        return { binary, decimal: parseInt(binary, 2), row: r, col: c };
    }));
}

function findDecimalPos(decimal, KMap) {
    for (let row = 0; row < KMap.length; row++) {
        for (let col = 0; col < KMap[0].length; col++) {
            if (decimal == KMap[row][col].decimal) return { row, col };
        }
    }
    return { row: 0, col: 0 };
}

function generateRegions(rowCount, colCount) {
    const regions = [];
    for (let w = 1; w <= colCount; w *= 2) {
        for (let h = 1; h <= rowCount; h *= 2) {
            regions.push({ w, h });
            if ((w == 1 && h == 1) || (w == colCount && h == rowCount)) continue;
            if (w == h) {
                regions.push({ w: -w, h }, { w: -w, h: -h }, { w, h: -h });
            } else if (w > h) {
                regions.push({ w: -w, h });
                if (h != 1) regions.push({ w, h: -h }, { w: -w, h: -h });
            } else {
                regions.push({ w, h: -h });
                if (w != 1) regions.push({ w: -w, h }, { w: -w, h: -h });
            }
        }
    }
    return regions;
}

function findPrimeImplicants(groups, minterms) {
    // A group is prime if it is not a strict subset of another group
    const primeImplicants = groups.filter(g =>
        !groups.some(other => other !== g && (g.mask & other.mask) === g.mask)
    );

    const targetMask = minterms.reduce((acc, m) => acc | (1 << m), 0);
    const validCombinations = [];
    let minSize = Infinity;

    function backtrack(current, currentMask, start) {
        if ((currentMask & targetMask) === targetMask) {
            if (current.length < minSize) {
                minSize = current.length;
                validCombinations.length = 0;
            }
            validCombinations.push([...current]);
            return;
        }

        if (current.length + 1 > minSize) return;

        for (let i = start; i < primeImplicants.length; i++) {
            const group = primeImplicants[i];
            // Only consider if this group covers any remaining uncovered minterms
            if ((group.coveredMask & ~currentMask) === 0) continue;

            current.push(group);
            backtrack(current, currentMask | group.coveredMask, i + 1);
            current.pop();
        }
    }

    backtrack([], 0, 0);

    // Deduplicate solutions using sorted group masks
    const seen = new Set();
    const uniqueSolutions = [];
    for (const combo of validCombinations) {
        const key = combo.map(g => g.mask).sort((a, b) => a - b).join('-');
        if (!seen.has(key)) {
            seen.add(key);
            uniqueSolutions.push(combo);
        }
    }

    return uniqueSolutions;
}

function group(decimal, termsSet, KMap) {
    const { row, col } = findDecimalPos(decimal, KMap);
    const regions = generateRegions(KMap.length, KMap[0].length);
    const validGroups = [];
    const seenMasks = new Set();

    for (const { w, h } of regions) {
        const cells = [];
        let valid = true;
        let includesRequiredTerm = false;
        let mask = 0;

        for (let r = 0; r < Math.abs(h) && valid; r++) {
            for (let c = 0; c < Math.abs(w) && valid; c++) {
                const cellRow = (row + (h < 0 ? -r : r) + KMap.length) % KMap.length;
                const cellCol = (col + (w < 0 ? -c : c) + KMap[0].length) % KMap[0].length;
                const cell = KMap[cellRow][cellCol];

                if (!termsSet.has(cell.decimal)) {
                    valid = false;
                    break;
                }
                if (cell.decimal === decimal) includesRequiredTerm = true;
                mask |= (1 << cell.decimal);
                cells.push(cell);
            }
        }

        if (valid && includesRequiredTerm && !seenMasks.has(mask)) {
            seenMasks.add(mask);
            validGroups.push({ cells, mask });
        }
    }

    return validGroups;
}

function extract(variables, cells) {
    const numVars = variables.length;
    let term = '';
    for (let i = 0; i < numVars; i++) {
        const firstBit = cells[0].binary[i];
        const isConstant = cells.every(c => c.binary[i] === firstBit);
        if (isConstant) {
            term += (firstBit === '0' ? '!' : '') + variables[i];
        }
    }
    return term || '1';
}

function solve(variables, minterms, dontcares = []) {
    if (minterms.length === 0 && dontcares.length === 0) return { solutions: ["0"], groups: [] };
    if (minterms.length === 0 && dontcares.length === (1 << variables.length)) return { solutions: ["X"], groups: [] };
    if (minterms.length === (1 << variables.length)) return { solutions: ["1"], groups: [] };

    const termsSet = new Set([...minterms, ...dontcares]);
    const mintermsSet = new Set(minterms);
    const KMap = getKMap(variables);
    const allGroups = [];
    const usedMasks = new Set();

    // First pass: collect all possible prime implicant groups
    for (const decimal of minterms) {
        const groupsForDecimal = group(decimal, termsSet, KMap);
        for (const { cells, mask } of groupsForDecimal) {
            if (!usedMasks.has(mask)) {
                usedMasks.add(mask);
                let coveredMask = 0;
                for (const c of cells) {
                    if (mintermsSet.has(c.decimal)) coveredMask |= (1 << c.decimal);
                }
                if (coveredMask > 0) {
                    allGroups.push({ cells, mask, coveredMask });
                }
            }
        }
    }

    if (allGroups.length === 0) return { solutions: ["0"], groups: [] };

    // Find all minimal solutions
    const solutions = findPrimeImplicants(allGroups, minterms);

    // Convert solutions to expressions
    const expressions = solutions.map(groups =>
        groups.map(g => extract(variables, g.cells))
            .filter(t => t !== '1')
            .sort()
            .join(' + ') || '1'
    );

    return {
        solutions: [...new Set(expressions)].sort(),
        groups: allGroups
    };
}

if (typeof window !== 'undefined') {
    window.KMapSolver = { solve, KMapGrayCodes, getKMap, findDecimalPos, KMapTransposedLayouts };
} else {
    module.exports = { solve, KMapGrayCodes, getKMap, findDecimalPos, KMapTransposedLayouts };
}
