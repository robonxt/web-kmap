// Circuit Drawer functionality
const LINE_WIDTH = 1;

class CircuitDrawer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.currentExpression = null;
        this.setupCanvas();
        this.setupTabListener();
        this.gates = {
            AND: this.drawANDGate.bind(this),
            OR: this.drawORGate.bind(this),
            NOT: this.drawNOTGate.bind(this)
        };
    }

    setupTabListener() {
        // Listen for circuit tab activation
        document.querySelector('[data-tab="circuit"]').addEventListener('click', () => {
            setTimeout(() => {
                this.setupCanvas();
                if (this.currentExpression) {
                    this.drawCircuit(this.currentExpression);
                } else {
                    // Try to get current solution
                    const solutionDiv = document.getElementById('solution');
                    if (solutionDiv && solutionDiv.textContent) {
                        this.drawCircuit(solutionDiv.textContent);
                    }
                }
            }, 0);
        });
    }

    countBasicGates(expression) {
        if (!expression) return { and: 0, or: 0, not: 0, inputs: new Set() };

        const cleanExpression = expression
            .replace(/<[^>]+>/g, '')
            .replace(/([A-Z])̅|([A-Z])̄/g, '$1$2\'')
            .trim();

        const terms = cleanExpression.split('+').map(term => term.trim());

        const gates = {
            and: 0,
            or: terms.length > 1 ? 1 : 0,
            not: 0,
            inputs: new Set()
        };

        terms.forEach(term => {
            const termVars = term.match(/[A-Z]'?/g) || [];
            const nonInvertedVars = termVars.filter(v => !v.includes('\'')).length;
            const invertedVars = termVars.filter(v => v.includes('\'')).length;
            
            // Only count AND gate if we have at least 2 variables AND at least one is non-inverted
            if (termVars.length > 1 && nonInvertedVars > 0) {
                gates.and++;
            }
            
            termVars.forEach(v => {
                gates.inputs.add(v[0]);
                if (v.includes('\'')) gates.not++;
            });
        });

        return gates;
    }

    countNANDGates(expression) {
        if (!expression) return 0;

        const cleanExpression = expression
            .replace(/<[^>]+>/g, '')
            .replace(/([A-D])̅|([A-D])̄/g, '$1$2\'')
            .trim();

        const terms = cleanExpression.split('+').map(term => term.trim());

        let nandCount = 0;
        terms.forEach(term => {
            const inputs = term.match(/[A-D]'?/g)?.length || 0;
            nandCount += Math.ceil(inputs / 8);
        });

        return nandCount + (terms.length > 1 ? Math.ceil(terms.length / 8) : 0);
    }

    setupCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();

        const dpr = window.devicePixelRatio || 1;

        // Calculate logical dimensions based on the container's size
        this.logicalWidth = Math.max(300, rect.width);
        this.logicalHeight = Math.max(300, rect.height);

        // Set the canvas size in pixels
        this.canvas.width = this.logicalWidth * dpr;
        this.canvas.height = this.logicalHeight * dpr;

        // Set the canvas style dimensions
        this.canvas.style.width = `${this.logicalWidth}px`;
        this.canvas.style.height = `${this.logicalHeight}px`;

        // Set the context properties
        this.ctx.scale(dpr, dpr);
        this.ctx.lineWidth = LINE_WIDTH;
        this.ctx.strokeStyle = '#000';
        this.ctx.fillStyle = '#fff';

        const fontSize = window.getComputedStyle(container).getPropertyValue('--font-md') || '24px';
        const fontFamily = window.getComputedStyle(container).getPropertyValue('--font-family') || 'Console, monospace';
        this.ctx.font = `${fontSize} ${fontFamily}`;
    }

    clear() {
        // Clear with white background
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#000'; // Reset fill style for text
    }

    drawLine(x1, y1, x2, y2) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }

    drawWire(points, addJunction = false) {
        for (let i = 0; i < points.length - 1; i++) {
            this.drawLine(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
        }
        if (addJunction) {
            this.drawJunctionDot(points[0].x, points[0].y);
            if (points.length > 2) {
                this.drawJunctionDot(points[1].x, points[1].y);
            }
        }
    }

    drawJunctionDot(x, y) {
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawANDGate(x, y, numOfInputs, size) {
        // Draw the rectangular body with curved right side
        this.ctx.beginPath();
        this.ctx.moveTo(x - size / 2, y - size / 2);
        this.ctx.lineTo(x - size / 2, y + size / 2);
        this.ctx.lineTo(x + size / 4, y + size / 2);
        this.ctx.arc(x + size / 4, y, size / 2, Math.PI / 2, -Math.PI / 2, true);
        this.ctx.lineTo(x - size / 2, y - size / 2);
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.fillStyle = '#fff';
        this.ctx.fill();

        // Calculate more widely spaced input points
        const totalHeight = size * 1.5;
        const inputSpacing = totalHeight / (numOfInputs + 1);
        const startY = y - totalHeight / 2;

        // Draw input lines
        const inputPoints = Array.from({ length: numOfInputs }, (_, i) => {
            const inputY = startY + inputSpacing * (i + 1);
            this.ctx.beginPath();
            this.ctx.moveTo(x - size, inputY);
            this.ctx.lineTo(x - size / 2, inputY);
            this.ctx.stroke();
            return { x: x - size, y: inputY };
        });

        // Draw output line
        const outputX = x + size * 0.75;
        this.ctx.beginPath();
        this.ctx.moveTo(x + size * 0.75, y);
        this.ctx.lineTo(outputX, y);
        this.ctx.stroke();

        return {
            inputPoints,
            outputPoint: { x: outputX, y }
        };
    }

    drawORGate(x, y, numInputs, size) {
        // Draw OR gate with proper curved shape
        this.ctx.beginPath();

        // Left curve
        this.ctx.moveTo(x - size / 2, y - size / 2);
        this.ctx.quadraticCurveTo(
            x - size / 4, y,
            x - size / 2, y + size / 2
        );

        // Right curves
        this.ctx.quadraticCurveTo(
            x - size / 4, y + size / 2,
            x, y + size / 2
        );
        this.ctx.quadraticCurveTo(
            x + size / 2, y + size / 3,
            x + size / 2, y
        );
        this.ctx.quadraticCurveTo(
            x + size / 2, y - size / 3,
            x, y - size / 2
        );
        this.ctx.quadraticCurveTo(
            x - size / 4, y - size / 2,
            x - size / 2, y - size / 2
        );

        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.fillStyle = '#fff';
        this.ctx.fill();

        // Calculate evenly spaced input points
        const inputSpacing = size / (numInputs + 1);
        const inputPoints = Array.from({ length: numInputs }, (_, i) => {
            const inputY = y - size / 2 + inputSpacing * (i + 1);
            return { x: x - size / 2, y: inputY };
        });

        // Draw input lines
        inputPoints.forEach(point => {
            this.ctx.beginPath();
            this.ctx.moveTo(point.x, point.y);
            this.ctx.lineTo(x - size / 2, point.y);
            this.ctx.stroke();
        });

        // Draw output line
        const outputX = x + size * 0.75;
        this.ctx.beginPath();
        this.ctx.moveTo(x + size / 2, y);
        this.ctx.lineTo(outputX, y);
        this.ctx.stroke();

        return {
            inputPoints,
            outputPoint: { x: outputX, y }
        };
    }

    drawNOTGate(x, y, size) {
        // Triangle
        this.ctx.beginPath();
        this.ctx.moveTo(x - size / 2, y - size / 2);
        this.ctx.lineTo(x + size / 2, y);
        this.ctx.lineTo(x - size / 2, y + size / 2);
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.fillStyle = '#fff';
        this.ctx.fill();

        // Circle
        const circleX = x + size / 2 + size / 4;
        this.ctx.beginPath();
        this.ctx.arc(circleX, y, size / 4, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.fill();

        return {
            inputPoint: { x: x - size / 2, y },
            outputPoint: { x: circleX + size / 4, y }
        };
    }

    drawInput(x, y, label, maxY) {
        // Draw vertical input line
        this.ctx.beginPath();
        this.drawLine(x, y, x, maxY);
        this.ctx.stroke();

        // Draw label above line
        this.ctx.fillStyle = '#000';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(label, x, y - 10);

        return { x, y };
    }

    drawCircuit(expression) {
        if (!expression) return;

        this.clear();
        this.currentExpression = expression;

        // Special case: constant 1 or 0
        if (expression === "1" || expression === "0") {
            this.drawConstantOutputLabel(expression);
            return;
        }

        // Parse and setup
        const basicGates = this.countBasicGates(expression);
        const nandGates = this.countNANDGates(expression);
        const cleanExpression = this.cleanExpression(expression);
        const terms = cleanExpression.split('+').map(term => term.trim());

        // Calculate layout dimensions
        const { gateSize, padding, wireSpacing, startX, startY } = this.calculateLayout();
        const horizontalOffset = gateSize * 1;

        // Draw inputs and calculate gate positions
        const inputs = Array.from(basicGates.inputs).sort();
        const inputPoints = this.drawInputs(inputs, startX, startY, wireSpacing);
        const { notGatesX, andGatesX, orGateX } = this.calculateGatePositions(startX, horizontalOffset, inputs.length);

        // Analyze and draw terms
        const termAnalysis = this.analyzeTerms(terms, inputs);
        const andGates = this.drawTerms(termAnalysis, andGatesX, startY, gateSize, notGatesX, horizontalOffset, inputPoints);

        // Draw final OR gate if needed
        this.drawFinalGate(andGates, orGateX, gateSize);

        // Draw gate counts
        this.drawGateInfoLabel(basicGates, nandGates, inputs);
    }

    cleanExpression(expression) {
        return expression
            .replace(/<[^>]+>/g, '')
            .replace(/([A-Z])̅|([A-Z])̄/g, '$1$2\'')
            .trim();
    }

    calculateLayout() {
        const gateSize = Math.min(this.logicalWidth, this.logicalHeight) / 16;
        return {
            gateSize,
            padding: gateSize * 1.2,
            wireSpacing: gateSize * 1.2,
            startX: gateSize * 2,
            startY: gateSize * 2
        };
    }

    calculateGatePositions(startX, horizontalOffset, inputCount) {
        const notGatesX = startX + horizontalOffset * (inputCount + 1);
        return {
            notGatesX,
            andGatesX: notGatesX + horizontalOffset,
            orGateX: notGatesX + horizontalOffset * 3
        };
    }


    drawInputs(inputs, startX, startY, verticalSpacing) {
        const inputPoints = {};
        const spacing = Math.min(verticalSpacing * 2, (this.logicalHeight - startY * 2) / (inputs.length + 1));

        inputs.forEach((input, i) => {
            const y = startY + spacing * (i + 1);
            inputPoints[input] = this.drawInput(startX, y, input, y);
        });

        return inputPoints;
    }

    analyzeTerms(terms, inputs) {
        return terms.map(term => ({
            inputs: (term.match(/[A-Z]'?/g) || []).map(v => ({
                letter: v[0],
                inverted: v.includes('\''),
                originalIndex: inputs.indexOf(v[0])
            })).sort((a, b) => a.originalIndex - b.originalIndex)
        }));
    }

    drawTerms(termAnalysis, andGatesX, startY, gateSize, notGatesX, horizontalOffset, inputPoints) {
        const andGates = [];
        const basicGates = this.countBasicGates(this.currentExpression);
        let andGateCount = 0;

        termAnalysis.forEach((term, termIndex) => {
            const baseY = startY + (this.logicalHeight - startY * 2) * (termIndex + 1) / (termAnalysis.length + 1);
            
            // Check if this term needs an AND gate
            const nonInvertedVars = term.inputs.filter(input => !input.inverted).length;
            const needsAndGate = term.inputs.length > 1 && nonInvertedVars > 0 && andGateCount < basicGates.and;
            
            let termOutput;
            if (needsAndGate) {
                const andGate = this.drawANDGate(andGatesX, baseY, term.inputs.length, gateSize);
                andGates.push(andGate);
                termOutput = andGate;
                andGateCount++;
            }

            term.inputs.forEach((input, inputIndex) => {
                const toPoint = needsAndGate ? 
                    termOutput.inputPoints[inputIndex] : 
                    { x: andGatesX + gateSize * 0.75, y: baseY };

                this.drawTermConnection(input, inputPoints, toPoint, notGatesX,
                    horizontalOffset, termIndex, gateSize, termAnalysis);
                
                // If no AND gate needed and this is the last input, store the output point
                if (!needsAndGate && inputIndex === term.inputs.length - 1) {
                    andGates.push({
                        outputPoint: { x: toPoint.x, y: toPoint.y }
                    });
                }
            });
        });

        return andGates;
    }

    drawTermConnection(input, inputPoints, toPoint, notGatesX, horizontalOffset, termIndex, gateSize, termAnalysis) {
        const fromPoint = inputPoints[input.letter];
        const stepX = fromPoint.x + horizontalOffset * (input.originalIndex + 1);
        const extraStepX = Math.max(stepX + (termIndex * gateSize), fromPoint.x);

        // Ensure points only move left to right
        const wirePoints = [fromPoint];

        // Only add horizontal segments if they move right
        if (stepX > fromPoint.x) {
            wirePoints.push({ x: stepX, y: fromPoint.y });
        }
        if (extraStepX > stepX) {
            wirePoints.push({ x: extraStepX, y: fromPoint.y });
        }

        // Add vertical segment if needed
        if (toPoint.y !== fromPoint.y) {
            wirePoints.push({ x: extraStepX, y: toPoint.y });
        }

        if (input.inverted) {
            const notGate = this.drawNOTGate(notGatesX, toPoint.y, gateSize / 2);

            // Connect to NOT gate input
            wirePoints.push({ x: notGate.inputPoint.x, y: toPoint.y });
            this.drawWire(wirePoints, this.isSharedInput(input, termAnalysis));

            // Connect NOT gate output to AND gate
            this.drawLine(notGate.outputPoint.x, toPoint.y, toPoint.x, toPoint.y);
        } else {
            // Connect directly to AND gate
            wirePoints.push(toPoint);
            this.drawWire(wirePoints, this.isSharedInput(input, termAnalysis));
        }
    }

    isSharedInput(input, termAnalysis) {
        return termAnalysis.filter(t =>
            t.inputs.some(i => i.letter === input.letter && i.inverted === input.inverted)
        ).length > 1;
    }

    drawFinalGate(andGates, orGateX, gateSize) {
        if (andGates.length > 1) {
            const orGateY = (andGates[0].outputPoint.y + andGates[andGates.length - 1].outputPoint.y) / 2;
            const orGate = this.drawORGate(orGateX, orGateY, andGates.length, gateSize);

            andGates.forEach((andGate, i) => {
                const toPoint = orGate.inputPoints[i];
                const midX = Math.max(andGate.outputPoint.x + gateSize * 1.5, toPoint.x - gateSize);

                // Ensure points only move left to right
                const wirePoints = [andGate.outputPoint];

                // Only add horizontal segment if it moves right
                if (midX > andGate.outputPoint.x) {
                    wirePoints.push({ x: midX, y: andGate.outputPoint.y });
                }

                // Add vertical segment if needed
                if (toPoint.y !== andGate.outputPoint.y) {
                    wirePoints.push({ x: midX, y: toPoint.y });
                }

                // Connect to OR gate
                wirePoints.push(toPoint);
                this.drawWire(wirePoints);
            });

            this.drawOutputLabel(orGate.outputPoint, gateSize);
        } else if (andGates.length === 1) {
            this.drawOutputLabel(andGates[0].outputPoint, gateSize);
        }
    }

    drawOutputLabel(point, gateSize) {
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = '#000';
        this.ctx.fillText('S', point.x + gateSize / 2 - 8, point.y);
    }

    drawConstantOutputLabel(value) {
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'top';
        this.ctx.fillStyle = '#000';
        this.ctx.fillText(`Constant ${value} Output`, this.logicalWidth * 0.95, 10);
        this.ctx.fillText('No gates needed', this.logicalWidth * 0.95, 30);
    }

    drawGateInfoLabel(basicGates, nandGates, inputs) {
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'top';
        this.ctx.fillStyle = '#000';

        const gateInfo = [
            `Inputs: ${inputs.join(', ')}`,
            `AND Gates: ${basicGates.and}`,
            `OR Gates: ${basicGates.or}`,
            `NOT Gates: ${basicGates.not}`,
            `NAND Gates: ${nandGates}`
        ];

        gateInfo.forEach((info, i) => {
            this.ctx.fillText(info, this.logicalWidth * 0.95, 10 + i * 20);
        });
    }

    redraw() {
        // Implement redraw logic based on current expression
        if (this.currentExpression) {
            this.drawCircuit(this.currentExpression);
        }
    }
}

// Initialize circuit drawer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const circuitDrawer = new CircuitDrawer('circuit-canvas');

    // Listen for solution select changes
    const solutionSelect = document.querySelector('.solution-select');
    if (solutionSelect) {
        solutionSelect.addEventListener('change', (event) => {
            const solution = event.target.value;
            if (solution) {
                circuitDrawer.drawCircuit(solution);
            }
        });
    }

    // Listen for solution changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.id === 'solution' && mutation.target.textContent) {
                circuitDrawer.drawCircuit(mutation.target.textContent);
            }
        });
    });

    const solutionDiv = document.getElementById('solution');
    if (solutionDiv) {
        observer.observe(solutionDiv, {
            characterData: true,
            childList: true,
            subtree: true
        });

        // Initial draw if solution exists
        if (solutionDiv.textContent) {
            circuitDrawer.drawCircuit(solutionDiv.textContent);
        }
    }
});
