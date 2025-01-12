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
        this.ctx.strokeStyle = '#000';
        this.ctx.fillStyle = '#fff';
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawLine(x1, y1, x2, y2) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }

    drawJunctionDot(x, y) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
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

        // Calculate evenly spaced input points
        const inputSpacing = size / (numOfInputs + 1);
        return {
            inputPoints: Array.from({length: numOfInputs}, (_, i) => ({
                x: x - size/2,
                y: y - size/2 + inputSpacing * (i + 1)
            })),
            outputPoint: {x: x + size * 0.75, y}
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
        
        this.ctx.stroke();

        // Calculate evenly spaced input points
        const inputSpacing = size / (numInputs + 1);
        const inputPoints = Array.from({length: numInputs}, (_, i) => ({
            x: x - size * 0.75, // Shorter input lines
            y: y - size/2 + inputSpacing * (i + 1)
        }));

        // Draw short input lines
        inputPoints.forEach(point => {
            this.ctx.beginPath();
            this.ctx.moveTo(point.x + size * 0.35, point.y);
            this.ctx.lineTo(point.x, point.y);
            this.ctx.stroke();
        });

        return {
            inputPoints,
            outputPoint: {x: x + size/2, y}
        };
    }

    // Returns input and output points for a NOT gate (there is only one input and one output)
    drawNOTGate(x, y, size) {
        // Triangle
        this.ctx.beginPath();
        this.ctx.moveTo(x - size/2, y - size/2);
        this.ctx.lineTo(x + size/2, y);
        this.ctx.lineTo(x - size/2, y + size/2);
        this.ctx.closePath();
        this.ctx.stroke();
        
        // Circle
        const circleX = x + size/2 + size/4;
        this.ctx.beginPath();
        this.ctx.arc(circleX, y, size/4, 0, Math.PI * 2);
        this.ctx.stroke();

        return {
            inputPoint: {x: x - size/2, y},
            outputPoint: {x: circleX + size/4, y}
        };
    }

    drawWireWithNOT(from, to, isInverted, gateStartX, gateSize) {
        if (isInverted) {
            const notX = from.x + gateStartX;
            // Draw NOT gate
            const notGate = this.drawNOTGate(notX, from.y, gateSize/2);
            
            // Draw wires
            this.ctx.beginPath();
            this.drawLine(from.x, from.y, notGate.inputPoint.x, from.y);
            this.drawLine(notGate.outputPoint.x, from.y, to.x, from.y);
            if (from.y !== to.y) {
                this.drawLine(to.x, from.y, to.x, to.y);
            }
            this.ctx.stroke();
        } else {
            this.ctx.beginPath();
            this.drawLine(from.x, from.y, to.x, from.y);
            if (from.y !== to.y) {
                this.drawLine(to.x, from.y, to.x, to.y);
            }
            this.ctx.stroke();
        }
        // Add junction dots where needed
        this.drawJunctionDot(from.x, from.y);
        if (from.y !== to.y) {
            this.drawJunctionDot(to.x, from.y);
        }
    }

    drawInput(x, y, label, maxY) {
        // Draw vertical input line
        this.ctx.beginPath();
        this.drawLine(x, y, x, maxY);
        this.ctx.stroke();
        
        // Draw label above line
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#000';
        this.ctx.fillText(label, x, y - 10);
        
        return {x, y};
    }

    drawCircuit(expression) {
        if (!expression) return;
        
        this.clear();
        this.currentExpression = expression;
        
        const cleanExpression = expression
            .replace(/<[^>]+>/g, '')
            .replace(/([A-D])̅/g, '$1\'')
            .replace(/([A-D])̄/g, '$1\'')
            .trim();
        
        const terms = cleanExpression.split('+').map(term => term.trim());
        
        const dpr = window.devicePixelRatio || 1;
        const width = this.canvas.width / dpr;
        const height = this.canvas.height / dpr;
        
        // Adjust sizes and spacing to fit canvas
        const gateSize = Math.min(width, height) / 10; // Slightly larger gates
        const padding = gateSize;  // Less padding to move closer to edges
        const wireSpacing = gateSize * 1.2;   // More space between wires
        const columnSpacing = gateSize * 1.75; // Space between input columns
        
        const startX = padding;
        const startY = padding * 0.75;  // Move closer to top
        
        // Calculate column positions with more spacing for gates
        const inputsX = startX;
        const notGatesX = inputsX + columnSpacing;  // Much more space after inputs
        const andGatesX = notGatesX + columnSpacing * 5; // More space between NOT and AND
        const orGateX = andGatesX + columnSpacing;  // More space before OR gate
        
        // Calculate vertical positions with more spacing
        const termSpacing = gateSize * 2;  // More vertical space between terms
        const termPositions = terms.map((_, i) => startY + termSpacing * (i + 1));
        
        // Initialize inputs
        const inputs = ['A', 'B', 'C', 'D'];
        const inputPoints = {};
        
        // Calculate maximum Y position with more spacing
        const maxY = Math.max(
            startY + termSpacing * (terms.length + 1),
            startY + inputs.length * wireSpacing * 1.5  // More vertical space for input lines
        );
        
        // Draw input lines
        inputs.forEach((input, i) => {
            const x = inputsX + i * columnSpacing;
            inputPoints[input] = this.drawInput(x, startY, input, maxY);
        });

        // Draw gates and connections
        const andGates = [];
        terms.forEach((term, i) => {
            const termVars = term.match(/[A-D]'?/g) || [];
            const baseY = termPositions[i];
            
            // Draw AND gate
            const andGate = this.drawANDGate(andGatesX, baseY, termVars.length, gateSize);
            andGates.push(andGate);
            
            // Draw connections
            termVars.forEach((v, j) => {
                const input = v[0];
                const isInverted = v.includes('\'');
                const wireY = baseY - gateSize/2 + gateSize/(termVars.length + 1) * (j + 1);
                
                const from = {
                    x: inputPoints[input].x,
                    y: wireY
                };
                const to = {
                    x: andGate.inputPoints[j].x,
                    y: andGate.inputPoints[j].y
                };
                
                this.drawWireWithNOT(from, to, isInverted, notGatesX, gateSize);
            });
        });
        
        if (andGates.length > 1) {
            // Calculate OR gate position
            const orGateY = (andGates[0].outputPoint.y + andGates[andGates.length - 1].outputPoint.y) / 2;
            
            // Draw OR gate
            const orGate = this.drawORGate(orGateX, orGateY, andGates.length, gateSize);
            
            // Connect AND gates to OR gate
            andGates.forEach((andGate, i) => {
                const inputPoint = orGate.inputPoints[i];
                
                this.ctx.beginPath();
                this.drawLine(andGate.outputPoint.x, andGate.outputPoint.y, 
                            inputPoint.x, andGate.outputPoint.y);
                if (andGate.outputPoint.y !== inputPoint.y) {
                    this.drawLine(inputPoint.x, andGate.outputPoint.y, 
                                inputPoint.x, inputPoint.y);
                }
                this.ctx.stroke();
                
                // Add junction dots
                this.drawJunctionDot(inputPoint.x, andGate.outputPoint.y);
                if (andGate.outputPoint.y !== inputPoint.y) {
                    this.drawJunctionDot(inputPoint.x, inputPoint.y);
                }
            });
            
            // Draw output wire and label
            this.ctx.beginPath();
            this.drawLine(orGate.outputPoint.x, orGate.outputPoint.y, 
                         orGate.outputPoint.x + gateSize/2, orGate.outputPoint.y);
            this.ctx.stroke();
            
            // Draw 'S' label
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillStyle = '#000';
            this.ctx.fillText('S', orGate.outputPoint.x + gateSize/2 + 5, orGate.outputPoint.y + 5);
        } else if (andGates.length === 1) {
            // Single AND gate output
            const andGate = andGates[0];
            this.ctx.beginPath();
            this.drawLine(andGate.outputPoint.x, andGate.outputPoint.y, 
                         andGate.outputPoint.x + gateSize/2, andGate.outputPoint.y);
            this.ctx.stroke();
            
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillStyle = '#000';
            this.ctx.fillText('S', andGate.outputPoint.x + gateSize/2 + 5, andGate.outputPoint.y + 5);
        }
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
