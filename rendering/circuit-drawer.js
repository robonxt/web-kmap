// Circuit Drawing Module
import { setupCanvas, drawLine, drawJunctionDot, setContextStyle, clearCanvas } from './canvas-utils.js';

const LINE_WIDTH = 2;
const GATE_SIZE = 60;

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

    setupCanvas() {
        const container = this.canvas.parentElement;
        this.ctx = setupCanvas(this.canvas, container);
        setContextStyle(this.ctx, {
            lineWidth: LINE_WIDTH,
            font: window.getComputedStyle(container).getPropertyValue('--font-md') || '16px ' +
                  window.getComputedStyle(container).getPropertyValue('--font-family') || 'Arial'
        });
    }

    setupTabListener() {
        document.querySelector('[data-tab="circuit"]').addEventListener('click', () => {
            setTimeout(() => {
                this.setupCanvas();
                if (this.currentExpression) {
                    this.drawCircuit(this.currentExpression);
                } else {
                    const solutionDiv = document.getElementById('solution');
                    if (solutionDiv && solutionDiv.textContent) {
                        this.drawCircuit(solutionDiv.textContent);
                    }
                }
            }, 0);
        });
    }

    clear() {
        clearCanvas(this.ctx, this.canvas);
    }

    drawANDGate(x, y, numOfInputs, size = GATE_SIZE) {
        this.ctx.beginPath();
        this.ctx.moveTo(x - size/2, y - size/2);
        this.ctx.lineTo(x - size/2, y + size/2);
        this.ctx.lineTo(x + size/4, y + size/2);
        this.ctx.arc(x + size/4, y, size/2, Math.PI/2, -Math.PI/2, true);
        this.ctx.lineTo(x - size/2, y - size/2);
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.fill();

        const totalHeight = size * 1.5;
        const inputSpacing = totalHeight / (numOfInputs + 1);
        const startY = y - totalHeight/2;
        
        const inputPoints = Array.from({length: numOfInputs}, (_, i) => {
            const inputY = startY + inputSpacing * (i + 1);
            drawLine(this.ctx, x - size/2 - size/4, inputY, x - size/2, inputY);
            return { x: x - size/2 - size/4, y: inputY };
        });

        drawLine(this.ctx, x + size/4 + size/2, y, x + size, y);
        
        return {
            inputs: inputPoints,
            output: { x: x + size, y }
        };
    }

    drawORGate(x, y, numOfInputs, size = GATE_SIZE) {
        const curveX = size * 0.1;
        const curveY = size * 0.3;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x - size/2, y - size/2);
        this.ctx.quadraticCurveTo(x - size/4, y - size/2, x, y - curveY);
        this.ctx.quadraticCurveTo(x + size/4, y, x, y + curveY);
        this.ctx.quadraticCurveTo(x - size/4, y + size/2, x - size/2, y + size/2);
        this.ctx.quadraticCurveTo(x - size/2 + curveX, y, x - size/2, y - size/2);
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.fill();

        const totalHeight = size * 1.5;
        const inputSpacing = totalHeight / (numOfInputs + 1);
        const startY = y - totalHeight/2;
        
        const inputPoints = Array.from({length: numOfInputs}, (_, i) => {
            const inputY = startY + inputSpacing * (i + 1);
            drawLine(this.ctx, x - size/2 - size/4, inputY, x - size/2, inputY);
            return { x: x - size/2 - size/4, y: inputY };
        });

        drawLine(this.ctx, x + size/4, y, x + size/2, y);
        
        return {
            inputs: inputPoints,
            output: { x: x + size/2, y }
        };
    }

    drawNOTGate(x, y, size = GATE_SIZE * 0.6) {
        this.ctx.beginPath();
        this.ctx.moveTo(x - size/2, y - size/2);
        this.ctx.lineTo(x + size/2, y);
        this.ctx.lineTo(x - size/2, y + size/2);
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(x + size/2 + 5, y, 5, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.fill();

        drawLine(this.ctx, x - size/2 - size/4, y, x - size/2, y);
        drawLine(this.ctx, x + size/2 + 10, y, x + size, y);
        
        return {
            inputs: [{ x: x - size/2 - size/4, y }],
            output: { x: x + size, y }
        };
    }

    drawCircuit(expression) {
        this.currentExpression = expression;
        this.clear();
        
        // Parse expression and draw circuit...
        // (Circuit drawing logic implementation)
    }
}

export default CircuitDrawer;
