// Input Validation Utilities
export function validateExpression(expression) {
    if (!expression || typeof expression !== 'string') {
        return false;
    }
    
    // Remove whitespace and check for valid characters
    const cleanExpr = expression.replace(/\s+/g, '');
    return /^[A-D'+()]+$/.test(cleanExpr);
}

export function validateVariables(variables) {
    if (!Array.isArray(variables) || variables.length === 0) {
        return false;
    }
    
    return variables.every(v => typeof v === 'string' && /^[A-D]$/.test(v));
}

export function validateMinterms(minterms, maxValue) {
    if (!Array.isArray(minterms)) {
        return false;
    }
    
    return minterms.every(m => 
        typeof m === 'number' && 
        Number.isInteger(m) && 
        m >= 0 && 
        m < maxValue
    );
}

export function validateDontCares(dontCares, minterms, maxValue) {
    if (!Array.isArray(dontCares)) {
        return false;
    }
    
    return dontCares.every(d => 
        typeof d === 'number' && 
        Number.isInteger(d) && 
        d >= 0 && 
        d < maxValue && 
        !minterms.includes(d)
    );
}

export default {
    validateExpression,
    validateVariables,
    validateMinterms,
    validateDontCares
};
