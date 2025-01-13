// Canvas Utility Functions
export function setupCanvas(canvas, container) {
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    return ctx;
}

export function drawLine(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

export function drawJunctionDot(ctx, x, y, radius = 3) {
    const originalFillStyle = ctx.fillStyle;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = originalFillStyle;
}

export function setContextStyle(ctx, options = {}) {
    const {
        lineWidth = 2,
        strokeStyle = '#000',
        fillStyle = '#fff',
        font = '16px Arial'
    } = options;

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeStyle;
    ctx.fillStyle = fillStyle;
    ctx.font = font;
}

export function clearCanvas(ctx, canvas) {
    const originalFillStyle = ctx.fillStyle;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = originalFillStyle;
}

export default {
    setupCanvas,
    drawLine,
    drawJunctionDot,
    setContextStyle,
    clearCanvas
};
