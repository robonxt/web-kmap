// Import the solver if running in Node.js environment
try {
    if (typeof window === 'undefined') {
        global.KMapSolver = require('./kmap-solver.js');
    }
} catch (e) {
    // Running in browser, KMapSolver is already available
}

const KMapSolver = require('./kmap-solver');

// Constants
const VARS = ["A", "B", "C", "D"];
const COLORS = {
    PASS: '\x1b[32m',
    FAIL: '\x1b[31m',
    RESET: '\x1b[0m'
};

// Utility functions
const TestUtils = {
    normalizeExpression(expr) {
        if (Array.isArray(expr)) {
            return expr.map(TestUtils.normalizeExpression).sort();
        }
        return expr.split(' + ')
            .map(term => {
                const tokens = term.match(/!?[A-Z]/g) || [];
                return tokens.sort().join('');
            })
            .sort()
            .join(' + ');
    },

    testSolutionMatch(got, expected) {
        const expression = typeof got === 'object' && 'expression' in got ? got.expression : got;
        
        if (Array.isArray(expression)) {
            const normalizedGot = expression.map(TestUtils.normalizeExpression);
            const normalizedExpected = Array.isArray(expected) ? 
                expected.map(TestUtils.normalizeExpression) : 
                [TestUtils.normalizeExpression(expected)];
            
            return {
                match: normalizedGot.every(g => normalizedExpected.some(e => e === g)) &&
                       normalizedExpected.every(e => normalizedGot.some(g => g === e)),
                normalizedGot,
                normalizedExpected
            };
        }

        const normalizedExpr = TestUtils.normalizeExpression(expression);
        const normalizedExpected = Array.isArray(expected) ? 
            expected.map(TestUtils.normalizeExpression) : 
            [TestUtils.normalizeExpression(expected)];

        return {
            match: normalizedExpected.some(e => e === normalizedExpr),
            normalizedGot: [normalizedExpr],
            normalizedExpected
        };
    },

    runTestCase(testCase) {
        console.log(`\nTest: ${testCase.name}`);
        
        // Log inputs
        if (testCase.minterms !== undefined) {
            console.log(`Minterms: [${testCase.minterms.join(', ')}]`);
            console.log(`Don't Cares: [${testCase.dontCares?.join(', ') || ''}]`);
        } else {
            console.log(`Input: [${testCase.input.join(', ')}]`);
        }

        // Run solver
        const result = testCase.minterms !== undefined ?
            KMapSolver.solve(VARS, testCase.minterms, testCase.dontCares) :
            KMapSolver.solve(VARS, testCase.input);

        // Check result
        const {match, normalizedGot, normalizedExpected} = TestUtils.testSolutionMatch(result, testCase.expected);
        
        // Log results
        console.log(`Expected: ${JSON.stringify(normalizedExpected, null, 2)}`);
        console.log(`Got: ${JSON.stringify(normalizedGot, null, 2)}`);
        console.log(`Result: ${match ? 
            COLORS.PASS + 'PASS' + COLORS.RESET : 
            COLORS.FAIL + 'FAIL' + COLORS.RESET}`);

        return match;
    },

    runTestSuite(name, testCases) {
        console.log(`\n=== ${name} ===`);
        const results = testCases.map(testCase => TestUtils.runTestCase(testCase));
        const passed = results.filter(r => r).length;
        console.log(`\nSummary: ${passed}/${results.length} tests passed`);
        return results.every(r => r);
    }
};

// Test Cases
const TestCases = {
    basicKMaps: [
        {
            name: "Multiple Solutions Case",
            input: [0, 1, 2, 3, 6, 7, 12, 13, 14, 15],
            expected: ["!A!B + BC + AB", "!A!B + !AC + AB"]
        },
        {
            name: "Four Variable Case",
            input: [0, 1, 2, 3, 4, 7, 8, 11, 12, 13, 14, 15],
            expected: ["!A!B + !C!D + CD + AB"]
        },
        {
            name: "Complex Terms Case",
            input: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
            expected: ["!AB + A!B + A!C + A!D", "!AB + B!D + A!B + A!C", 
                      "!AB + B!C + A!B + A!D", "!AB + B!C + B!D + A!B"]
        }
    ],

    specialCases: [
        {
            name: "All Ones",
            input: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
            expected: ["1"]
        },
        {
            name: "Single One",
            input: [0],
            expected: ["!A!B!C!D"]
        },
        {
            name: "All Zeros",
            input: [],
            expected: ["0"]
        }
    ],

    dontCareCases: [
        {
            name: "Simple Don't Cares",
            minterms: [9, 11, 13, 15],
            dontCares: [8, 10, 12, 14],
            expected: ["A"]
        },
        {
            name: "All Don't Cares",
            minterms: [],
            dontCares: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
            expected: ["0"]
        },
        {
            name: "Mixed Don't Cares",
            minterms: [2, 3, 4, 8, 9, 11],
            dontCares: [12, 14, 15],
            expected: [
                "!A!BC + !B!CA + !BCD + !C!DB",
                "!A!BC + !B!CA + !BAD + !C!DB",
                "!A!BC + !B!CA + !C!DB + ACD",
                "!A!BC + !BAD + !C!DA + !C!DB"
            ]
        }
    ]
};

// Run all tests
function runAllTests() {
    console.log("=== K-Map Solver Test Suite ===");
    const results = [
        TestUtils.runTestSuite("Basic K-Map Tests", TestCases.basicKMaps),
        TestUtils.runTestSuite("Special Cases", TestCases.specialCases),
        TestUtils.runTestSuite("Don't Care Cases", TestCases.dontCareCases)
    ];
    
    const totalPassed = results.filter(r => r).length;
    console.log(`\nOverall: ${totalPassed}/${results.length} test suites passed`);
    return results.every(r => r);
}

runAllTests();
