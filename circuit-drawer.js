// Circuit Drawer functionality
const LINE_WIDTH = 2;

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

    setupCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        
        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;
        
        this.ctx.lineWidth = LINE_WIDTH;
        // Use black stroke for visibility
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

    drawJunctionDot(x, y) {
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    // Returns input and output points for an AND gate
    drawANDGate(x, y, numOfInputs, size) {
        // Draw the rectangular body with curved right side
        this.ctx.beginPath();
        this.ctx.moveTo(x - size/2, y - size/2);
        this.ctx.lineTo(x - size/2, y + size/2);
        this.ctx.lineTo(x + size/4, y + size/2);
        this.ctx.arc(x + size/4, y, size/2, Math.PI/2, -Math.PI/2, true);
        this.ctx.lineTo(x - size/2, y - size/2);
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.fillStyle = '#fff';
        this.ctx.fill();

        // Calculate more widely spaced input points
        const totalHeight = size * 1.5;
        const inputSpacing = totalHeight / (numOfInputs + 1);
        const startY = y - totalHeight/2;
        
        // Draw input lines
        const inputPoints = Array.from({length: numOfInputs}, (_, i) => {
            const inputY = startY + inputSpacing * (i + 1);
            this.ctx.beginPath();
            this.ctx.moveTo(x - size, inputY);
            this.ctx.lineTo(x - size/2, inputY);
            this.ctx.stroke();
            return {x: x - size, y: inputY};
        });

        // Draw output line
        const outputX = x + size * 0.75;
        this.ctx.beginPath();
        this.ctx.moveTo(x + size * 0.75, y);
        this.ctx.lineTo(outputX, y);
        this.ctx.stroke();

        return {
            inputPoints,
            outputPoint: {x: outputX, y}
        };
    }

    // Returns input and output points for an OR gate
    drawORGate(x, y, numInputs, size) {
        // Draw OR gate with proper curved shape
        this.ctx.beginPath();
        
        // Left curve
        this.ctx.moveTo(x - size/2, y - size/2);
        this.ctx.quadraticCurveTo(
            x - size/4, y,
            x - size/2, y + size/2
        );
        
        // Right curves
        this.ctx.quadraticCurveTo(
            x - size/4, y + size/2,
            x, y + size/2
        );
        this.ctx.quadraticCurveTo(
            x + size/2, y + size/3,
            x + size/2, y
        );
        this.ctx.quadraticCurveTo(
            x + size/2, y - size/3,
            x, y - size/2
        );
        this.ctx.quadraticCurveTo(
            x - size/4, y - size/2,
            x - size/2, y - size/2
        );
        
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.fillStyle = '#fff';
        this.ctx.fill();

        // Calculate evenly spaced input points
        const inputSpacing = size / (numInputs + 1);
        const inputPoints = Array.from({length: numInputs}, (_, i) => {
            const inputY = y - size/2 + inputSpacing * (i + 1);
            return {x: x - size * 0.75, y: inputY};
        });

        // Draw input lines
        inputPoints.forEach(point => {
            this.ctx.beginPath();
            this.ctx.moveTo(point.x, point.y);
            this.ctx.lineTo(x - size/2, point.y);
            this.ctx.stroke();
        });

        // Draw output line
        const outputX = x + size * 0.75;
        this.ctx.beginPath();
        this.ctx.moveTo(x + size/2, y);
        this.ctx.lineTo(outputX, y);
        this.ctx.stroke();

        return {
            inputPoints,
            outputPoint: {x: outputX, y}
        };
    }

    // Returns input and output points for a NOT gate
    drawNOTGate(x, y, size) {
        // Triangle
        this.ctx.beginPath();
        this.ctx.moveTo(x - size/2, y - size/2);
        this.ctx.lineTo(x + size/2, y);
        this.ctx.lineTo(x - size/2, y + size/2);
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.fillStyle = '#fff';
        this.ctx.fill();
        
        // Circle
        const circleX = x + size/2 + size/4;
        this.ctx.beginPath();
        this.ctx.arc(circleX, y, size/4, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.fill();

        return {
            inputPoint: {x: x - size/2, y},
            outputPoint: {x: circleX + size/4, y}
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
        
        return {x, y};
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
            if (termVars.length > 1) gates.and++;
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

    drawCircuit(expression) {
        if (!expression) return;

        this.clear();
        this.currentExpression = expression;

        // Count gates first
        const basicGates = this.countBasicGates(expression);
        const nandGates = this.countNANDGates(expression);

        // Parse expression
        const cleanExpression = expression
            .replace(/<[^>]+>/g, '')
            .replace(/([A-Z])̅|([A-Z])̄/g, '$1$2\'')
            .trim();

        // Special case: constant 1 (all minterms are 1)
        if (expression === "1") {
            // Draw a single wire from left to right
            const gateSize = Math.min(this.canvas.width, this.canvas.height) / 12;
            const padding = gateSize * 2;
            const startX = padding;
            const endX = this.canvas.width - padding;
            const y = this.canvas.height / 2;

            // Draw horizontal wire
            this.ctx.beginPath();
            this.drawLine(startX, y, endX, y);
            this.ctx.stroke();

            // Draw output label
            this.ctx.textAlign = 'left';
            this.ctx.fillText('S', endX + 5, y - 8);

            // Draw gate counts
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';
            let infoY = 10;
            const gateInfo = [
                'Constant 1 Output',
                'No gates needed'
            ];

            gateInfo.forEach(info => {
                this.ctx.fillText(info, 10, infoY);
                infoY += 20;
            });

            return;
        }

        // Special case: constant 0 (all minterms are 0)
        if (expression === "0") {
            // Draw gate counts
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';
            let infoY = 10;
            const gateInfo = [
                'Constant 0 Output',
                'No gates needed'
            ];

            gateInfo.forEach(info => {
                this.ctx.fillText(info, 10, infoY);
                infoY += 20;
            });

            return;
        }

        const terms = cleanExpression.split('+').map(term => term.trim());
        
        // Canvas setup
        const dpr = window.devicePixelRatio || 1;
        const width = Math.max(300, this.canvas.width / dpr);
        const height = Math.max(300, this.canvas.height / dpr);
        
        // Calculate sizes and spacing
        const gateSize = Math.min(width, height) / 12;
        const padding = gateSize;
        const wireSpacing = gateSize * 1.5;
        
        // Calculate grid positions
        const startX = padding * 2;
        const startY = padding * 2;
        
        // Input positions - vertically aligned with horizontal offsets
        const inputs = Array.from(basicGates.inputs).sort();
        const inputPoints = {};
        const verticalSpacing = Math.min(wireSpacing * 2, (height - padding * 4) / (inputs.length + 1));
        
        // Draw inputs with stair-step pattern
        inputs.forEach((input, i) => {
            const x = startX;
            const y = startY + verticalSpacing * (i + 1);
            inputPoints[input] = this.drawInput(x, y, input, y);  // Only draw vertical line to input height
        });

        // Calculate horizontal positions for gates
        const horizontalOffset = gateSize * 1.5;  // Offset for each step
        const notGatesX = startX + horizontalOffset * (inputs.length + 1);
        const andGatesX = notGatesX + horizontalOffset;
        const orGateX = andGatesX + horizontalOffset * 2;

        // Analyze terms to determine optimal vertical positions
        const termAnalysis = terms.map(term => {
            const vars = term.match(/[A-Z]'?/g) || [];
            return {
                inputs: vars.map(v => ({
                    letter: v[0],
                    inverted: v.includes('\''),
                    originalIndex: inputs.indexOf(v[0])
                })).sort((a, b) => a.originalIndex - b.originalIndex)
            };
        });

        // Draw gates and connections
        const andGates = [];
        termAnalysis.forEach((term, termIndex) => {
            const baseY = startY + (height - padding * 4) * (termIndex + 1) / (terms.length + 1);
            
            // Draw AND gate
            const andGate = this.drawANDGate(andGatesX, baseY, term.inputs.length, gateSize);
            andGates.push(andGate);
            
            // Connect inputs to AND gate with stair-step pattern
            term.inputs.forEach((input, inputIndex) => {
                const fromPoint = inputPoints[input.letter];
                const toPoint = andGate.inputPoints[inputIndex];
                
                this.ctx.beginPath();
                if (input.inverted) {
                    // Calculate NOT gate position
                    const notX = notGatesX;
                    const notY = toPoint.y;
                    
                    // Draw NOT gate
                    const notGate = this.drawNOTGate(notX, notY, gateSize/2);
                    
                    // Draw stair-step wire to NOT gate with additional segments to avoid overlaps
                    const stepX = fromPoint.x + horizontalOffset * (input.originalIndex + 1);
                    const extraStepX = stepX + (termIndex * gateSize); // Extra horizontal offset based on term
                    
                    // Route with right angles, avoiding overlaps
                    this.drawLine(fromPoint.x, fromPoint.y, stepX, fromPoint.y);
                    this.drawLine(stepX, fromPoint.y, extraStepX, fromPoint.y);
                    this.drawLine(extraStepX, fromPoint.y, extraStepX, notY);
                    this.drawLine(extraStepX, notY, notGate.inputPoint.x, notY);
                    
                    // Connect NOT gate to AND gate
                    this.drawLine(notGate.outputPoint.x, notY, toPoint.x, toPoint.y);
                    
                    // Only add junction dots where wires actually split to different gates
                    const isSharedInput = termAnalysis.filter(t => 
                        t.inputs.some(i => i.letter === input.letter && i.inverted === input.inverted)
                    ).length > 1;
                    
                    if (isSharedInput) {
                        this.drawJunctionDot(fromPoint.x, fromPoint.y);
                        this.drawJunctionDot(stepX, fromPoint.y);
                    }
                } else {
                    // Draw stair-step wire directly to AND gate with additional segments to avoid overlaps
                    const stepX = fromPoint.x + horizontalOffset * (input.originalIndex + 1);
                    const extraStepX = stepX + (termIndex * gateSize); // Extra horizontal offset based on term
                    
                    // Route with right angles, avoiding overlaps
                    this.drawLine(fromPoint.x, fromPoint.y, stepX, fromPoint.y);
                    this.drawLine(stepX, fromPoint.y, extraStepX, fromPoint.y);
                    this.drawLine(extraStepX, fromPoint.y, extraStepX, toPoint.y);
                    this.drawLine(extraStepX, toPoint.y, toPoint.x, toPoint.y);
                    
                    // Only add junction dots where wires actually split to different gates
                    const isSharedInput = termAnalysis.filter(t => 
                        t.inputs.some(i => i.letter === input.letter && i.inverted === input.inverted)
                    ).length > 1;
                    
                    if (isSharedInput) {
                        this.drawJunctionDot(fromPoint.x, fromPoint.y);
                        this.drawJunctionDot(stepX, fromPoint.y);
                    }
                }
                this.ctx.stroke();
                
                // Add junction dots at input points
                this.drawJunctionDot(fromPoint.x, fromPoint.y);
            });
        });

        // Draw OR gate if needed
        if (andGates.length > 1) {
            const orGateY = (andGates[0].outputPoint.y + andGates[andGates.length - 1].outputPoint.y) / 2;
            const orGate = this.drawORGate(orGateX, orGateY, andGates.length, gateSize);
            
            // Connect AND gates to OR gate
            andGates.forEach((andGate, i) => {
                const toPoint = orGate.inputPoints[i];
                
                this.ctx.beginPath();
                this.drawLine(andGate.outputPoint.x, andGate.outputPoint.y, 
                            andGate.outputPoint.x + horizontalOffset, andGate.outputPoint.y);
                this.drawLine(andGate.outputPoint.x + horizontalOffset, andGate.outputPoint.y,
                            andGate.outputPoint.x + horizontalOffset, toPoint.y);
                this.drawLine(andGate.outputPoint.x + horizontalOffset, toPoint.y,
                            toPoint.x, toPoint.y);
                this.ctx.stroke();
            });
            
            // Draw output label
            this.ctx.textAlign = 'left';
            this.ctx.fillText('S', orGate.outputPoint.x + gateSize/2 + 5, orGate.outputPoint.y - 8);
        } else if (andGates.length === 1) {
            // Single AND gate output
            const andGate = andGates[0];
            this.ctx.textAlign = 'left';
            this.ctx.fillText('S', andGate.outputPoint.x + gateSize/2 + 5, andGate.outputPoint.y - 8);
        }

        // Draw gate counts on the top right
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'top';
        let y = 10;
        const gateInfo = [
            `Inputs: ${Array.from(basicGates.inputs).join(', ')}`,
            `AND Gates: ${basicGates.and}`,
            `OR Gates: ${basicGates.or}`,
            `NOT Gates: ${basicGates.not}`,
            `NAND Gates: ${nandGates}`
        ];

        gateInfo.forEach(info => {
            this.ctx.fillText(info, this.canvas.width - 10, y);
            y += 20;
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
