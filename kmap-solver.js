const KMapGrayCodes = new Map([
    [2, { rows: ['0', '1'], cols: ['0', '1'] }],
    [3, { rows: ['0', '1'], cols: ['00', '01', '11', '10'] }],
    [4, { rows: ['00', '01', '11', '10'], cols: ['00', '01', '11', '10'] }]
]);

const KMapBinaryLayouts = new Map([
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
    // Find all prime implicants (not just essential ones)
    const primeImplicants = groups.filter(group =>
        !groups.some(other => group !== other &&
            group.cells.every(cell => other.cells.some(c => c.decimal === cell.decimal))
        )
    );

    // For each minterm, find all prime implicants that cover it
    const mintermCoverage = new Map();
    minterms.forEach(m => {
        mintermCoverage.set(m, primeImplicants.filter(g => g.coveredMinterms.has(m)));
    });

    const solutions = new Set();
    let bestSize = Infinity;

    // Helper function to check if two groups overlap in their minterms
    function hasOverlap(group1, group2) {
        return Array.from(group1.coveredMinterms).some(m => group2.coveredMinterms.has(m));
    }

    // Helper function to get all possible combinations of groups that cover remaining minterms
    function getCombinations(availableGroups, targetMinterms, maxSize) {
        const results = [];

        function backtrack(current, remaining, start) {
            if (current.length > maxSize) return;

            // Check if current combination covers all target minterms
            const covered = new Set();
            current.forEach(g => {
                Array.from(g.coveredMinterms).forEach(m => {
                    if (targetMinterms.has(m)) covered.add(m);
                });
            });

            if (covered.size === targetMinterms.size) {
                results.push([...current]);
                return;
            }

            // Try adding each remaining group
            for (let i = start; i < availableGroups.length; i++) {
                const group = availableGroups[i];
                current.push(group);
                backtrack(current, remaining, i + 1);
                current.pop();
            }
        }

        backtrack([], new Set(targetMinterms), 0);
        return results;
    }

    // Find all minimal combinations that cover all minterms
    const targetMinterms = new Set(minterms);
    for (let size = 1; size <= primeImplicants.length; size++) {
        const combinations = getCombinations(primeImplicants, targetMinterms, size);
        if (combinations.length > 0) {
            bestSize = size;
            combinations.forEach(groups => {
                const expr = groups.map(g =>
                    g.cells.map(c => c.decimal).sort().join(',')
                ).sort().join('|');
                solutions.add(expr);
            });
            break;
        }
    }

    return Array.from(solutions).map(expr =>
        expr.split('|').map(indices => {
            const decimals = new Set(indices.split(',').map(Number));
            return primeImplicants.find(g =>
                g.cells.length === decimals.size &&
                g.cells.every(c => decimals.has(c.decimal))
            );
        })
    );
}

function group(decimal, terms, KMap) {
    const { row, col } = findDecimalPos(decimal, KMap);
    const regions = generateRegions(KMap.length, KMap[0].length);
    const validGroups = [];

    // Find all valid groups that include this decimal
    for (const { w, h } of regions) {
        const cells = [];
        let valid = true;
        let includesRequiredTerm = false;

        for (let r = 0; r < Math.abs(h) && valid; r++) {
            for (let c = 0; c < Math.abs(w) && valid; c++) {
                const cellRow = (row + (h < 0 ? -r : r) + KMap.length) % KMap.length;
                const cellCol = (col + (w < 0 ? -c : c) + KMap[0].length) % KMap[0].length;
                const cell = KMap[cellRow][cellCol];

                if (!terms.includes(cell.decimal)) {
                    valid = false;
                    break;
                }
                if (cell.decimal === decimal) {
                    includesRequiredTerm = true;
                }
                cells.push(cell);
            }
        }

        if (valid && includesRequiredTerm) {
            // Add this group if it's not already included
            const groupKey = JSON.stringify(cells.map(c => c.decimal).sort());
            if (!validGroups.some(g =>
                JSON.stringify(g.map(c => c.decimal).sort()) === groupKey
            )) {
                validGroups.push(cells);
            }
        }
    }

    // Return all valid groups found
    return validGroups;
}

function extract(variables, group) {
    const bits = group.reduce((acc, cell) =>
        acc.map((bit, i) => bit === cell.binary[i] ? bit : 'x'),
        group[0].binary.split('')
    );
    const result = bits.every(bit => bit === 'x') ? '1' :
        bits.reduce((acc, bit, i) =>
            bit === 'x' ? acc : acc + (bit === '0' ? '!' : '') + variables[i],
        '');
    return result.replace(/!!/g, ''); // Remove any double negations
}

function solve(variables, minterms, dontcares = []) {
    if (minterms.length === 0 && dontcares.length === 0) return { solutions: ["0"], groups: [] };
    if (minterms.length === (1 << variables.length)) return { solutions: ["1"], groups: [] };

    // Special case for single minterm
    if (minterms.length === 1 && dontcares.length === 0) {
        const binary = minterms[0].toString(2).padStart(variables.length, '0');
        const term = binary.split('')
            .map((bit, i) => bit === '1' ? variables[i] : `!${variables[i]}`)
            .join('');
        return {
            solutions: [term],
            groups: [{
                cells: [{ decimal: minterms[0], binary }],
                coveredMinterms: new Set([minterms[0]])
            }]
        };
    }

    const terms = [...minterms, ...dontcares];
    const KMap = getKMap(variables);
    const allGroups = [];
    const usedGroups = new Set();

    // First pass: collect all possible prime implicant groups
    for (const decimal of minterms) {
        const groupsForDecimal = group(decimal, terms, KMap);
        for (const cells of groupsForDecimal) {
            const groupKey = JSON.stringify(cells.map(c => c.decimal).sort());
            if (!usedGroups.has(groupKey)) {
                usedGroups.add(groupKey);
                const coveredMinterms = cells.filter(c => minterms.includes(c.decimal)).map(c => c.decimal);
                if (coveredMinterms.length > 0) {
                    allGroups.push({ cells, coveredMinterms: new Set(coveredMinterms) });
                }
            }
        }
    }

    if (allGroups.length === 0) return { solutions: ["0"], groups: [] };

    // Find all possible minimal solutions
    const solutions = findPrimeImplicants(allGroups, minterms);

    // Convert solutions to expressions
    const expressions = solutions.map(groups =>
        groups.map(g => extract(variables, g.cells))
            .filter(term => term !== '1')
            .sort()
            .join(' + ') || '1'
    );

    // Remove duplicates and sort for consistent output
    return {
        solutions: [...new Set(expressions)].sort(),
        groups: allGroups
    };
}

if (typeof window !== 'undefined') {
    window.KMapSolver = { solve, KMapGrayCodes, getKMap, findDecimalPos, KMapBinaryLayouts };
} else {
    module.exports = { solve, KMapGrayCodes, getKMap, findDecimalPos, KMapBinaryLayouts };
}
