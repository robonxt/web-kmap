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
        this.ctx.strokeStyle = '#fff';
        this.ctx.fillStyle = '#000';

        const fontSize = window.getComputedStyle(container).getPropertyValue('--font-md');
        const fontFamily = window.getComputedStyle(container).getPropertyValue('--font-family');
        this.ctx.font = `${fontSize} ${fontFamily}`;
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
        this.ctx.moveTo(x + size/4 + size/2, y);
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

        // Draw output line
        this.ctx.beginPath();
        this.ctx.moveTo(x + size/2, y);
        this.ctx.lineTo(x + size * 0.75, y);
        this.ctx.stroke();

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

        // Input line
        this.ctx.beginPath();
        this.ctx.moveTo(x - size, y);
        this.ctx.lineTo(x - size/2, y);
        this.ctx.stroke();

        // Output line
        this.ctx.beginPath();
        this.ctx.moveTo(circleX + size/4, y);
        this.ctx.lineTo(circleX + size/4 + size/2, y);
        this.ctx.stroke();

        return {
            inputPoint: {x: x - size, y},
            outputPoint: {x: circleX + size/4 + size/2, y}
        };
    }

    drawInput(x, y, label, maxY) {
        // Draw vertical input line
        this.ctx.beginPath();
        this.drawLine(x, y, x, maxY);
        this.ctx.stroke();
        
        // Draw label above line
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
        const basicGates = this.countBasicGates(expression);
        const nandGates = this.countNANDGates(expression);

        const ctx = this.ctx;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        let y = 10;
        const gateInfo = [
            `Inputs: ${Array.from(basicGates.inputs).join(', ')}`,
            `AND Gates: ${basicGates.and}`,
            `OR Gates: ${basicGates.or}`,
            `NOT Gates: ${basicGates.not}`,
            `NAND Gates: ${nandGates}`
        ];

        gateInfo.forEach(info => {
            ctx.fillText(info, 10, y);
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
