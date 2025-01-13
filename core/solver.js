// K-Map Solver Core Logic
import { createKMap } from './gray-code.js';

function generateRegions(rowCount, colCount) {
    const regions = [];
    for (let w = 1; w <= colCount; w *= 2) {
        for (let h = 1; h <= rowCount; h *= 2) {
            regions.push({ w, h });
            if ((w === 1 && h === 1) || (w === colCount && h === rowCount)) continue;
            if (w === h) {
                regions.push({ w: -w, h }, { w: -w, h: -h }, { w, h: -h });
            } else if (w > h) {
                regions.push({ w: -w, h });
                if (h !== 1) regions.push({ w, h: -h }, { w: -w, h: -h });
            } else {
                regions.push({ w, h: -h });
                if (w !== 1) regions.push({ w: -w, h }, { w: -w, h: -h });
            }
        }
    }
    return regions;
}

function findPrimeImplicants(groups, minterms) {
    const primeImplicants = groups.filter(group => 
        !groups.some(other => group !== other && 
            group.cells.every(cell => other.cells.some(c => c.decimal === cell.decimal))
        )
    );

    const mintermCoverage = new Map();
    minterms.forEach(m => {
        mintermCoverage.set(m, primeImplicants.filter(g => g.coveredMinterms.has(m)));
    });

    const solutions = new Set();
    let bestSize = Infinity;

    function getCombinations(availableGroups, targetMinterms, maxSize) {
        const results = [];
        
        function backtrack(current, remaining, start) {
            if (current.length > maxSize) return;
            
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

    const targetMinterms = new Set(minterms);
    for (let size = 1; size <= primeImplicants.length && size <= bestSize; size++) {
        const combinations = getCombinations(primeImplicants, targetMinterms, size);
        combinations.forEach(combination => {
            const covered = new Set();
            combination.forEach(group => {
                Array.from(group.coveredMinterms).forEach(m => covered.add(m));
            });
            
            if (covered.size === targetMinterms.size) {
                if (size < bestSize) {
                    solutions.clear();
                    bestSize = size;
                }
                solutions.add(combination);
            }
        });
        if (solutions.size > 0) break;
    }

    return Array.from(solutions)[0] || [];
}

function group(decimal, terms, KMap) {
    const pos = findDecimalPosition(decimal, KMap);
    const regions = generateRegions(KMap.length, KMap[0].length);
    
    return regions.map(region => {
        const cells = [];
        const coveredMinterms = new Set();
        
        for (let r = 0; r < Math.abs(region.h); r++) {
            for (let c = 0; c < Math.abs(region.w); c++) {
                const row = (pos.row + (region.h > 0 ? r : -r) + KMap.length) % KMap.length;
                const col = (pos.col + (region.w > 0 ? c : -c) + KMap[0].length) % KMap[0].length;
                const cell = KMap[row][col];
                
                if (terms.includes(cell.decimal)) {
                    cells.push(cell);
                    coveredMinterms.add(cell.decimal);
                }
            }
        }
        
        return { cells, coveredMinterms };
    }).filter(g => g.cells.length > 0 && g.cells.length === Math.abs(region.w) * Math.abs(region.h));
}

function extract(variables, group) {
    const bits = Array(variables.length).fill(null);
    const first = group.cells[0].binary;
    
    group.cells.forEach(cell => {
        const binary = cell.binary;
        for (let i = 0; i < binary.length; i++) {
            if (bits[i] === null) {
                bits[i] = binary[i];
            } else if (bits[i] !== binary[i]) {
                bits[i] = '-';
            }
        }
    });
    
    return bits.map((bit, i) => bit === '1' ? variables[i] : bit === '0' ? `${variables[i]}'` : '').filter(Boolean);
}

export function solve(variables, minterms, dontcares = []) {
    if (!variables || !minterms || variables.length === 0 || minterms.length === 0) {
        return '';
    }

    const KMap = createKMap(variables);
    const terms = [...minterms, ...dontcares];
    
    const groups = terms.flatMap(m => group(m, terms, KMap));
    const primeImplicants = findPrimeImplicants(groups, minterms);
    
    if (primeImplicants.length === 0) {
        return '0';
    }
    
    return primeImplicants
        .map(group => extract(variables, group).join(''))
        .join(' + ');
}

export default { solve };
