// Gray Code Operations
const GrayCodeMap = new Map([
    [2, { rows: ['0', '1'], cols: ['0', '1'] }],
    [3, { rows: ['00', '01', '11', '10'], cols: ['0', '1'] }],
    [4, { rows: ['00', '01', '11', '10'], cols: ['00', '01', '11', '10'] }]
]);

export function getGrayCodeSequence(variables) {
    return GrayCodeMap.get(variables.length);
}

export function createKMap(variables) {
    const grayCodes = getGrayCodeSequence(variables);
    if (!grayCodes) return [];
    
    const { rows, cols } = grayCodes;
    return rows.map((row, r) => cols.map((col, c) => {
        const binary = `${row}${col}`;
        return { binary, decimal: parseInt(binary, 2), row: r, col: c };
    }));
}

export function findDecimalPosition(decimal, KMap) {
    for (let row = 0; row < KMap.length; row++) {
        for (let col = 0; col < KMap[0].length; col++) {
            if (decimal === KMap[row][col].decimal) return { row, col };
        }
    }
    return { row: 0, col: 0 };
}

export default {
    GrayCodeMap,
    getGrayCodeSequence,
    createKMap,
    findDecimalPosition
};
