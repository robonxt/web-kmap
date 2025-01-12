// Simple markdown parser
function mdToHtml(md) {
    if (!md) return '';
    
    // First process headers
    let html = md
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>');

    // Process lists and paragraphs
    const lines = html.split('\n');
    let processed = [];
    let listStack = [];
    let lastLevel = -1;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trimEnd();
        if (!line) {
            closeAllLists();
            continue;
        }

        // Skip already processed headers
        if (line.startsWith('<h')) {
            closeAllLists();
            processed.push(line);
            continue;
        }

        // Handle lists
        const listMatch = line.match(/^(\s*)(?:[-*]|\d+\.)\s+(.+)$/);
        if (listMatch) {
            const [_, indent, content] = listMatch;
            const level = Math.floor(indent.length / 2);
            const isOrdered = /^\s*\d+\./.test(line);

            // Close lists if we're going back up the hierarchy
            while (lastLevel >= level) {
                const [type, _] = listStack.pop();
                processed.push('  '.repeat(lastLevel) + `</${type}>`);
                lastLevel--;
            }

            // Start new list if needed
            if (lastLevel < level) {
                const type = isOrdered ? 'ol' : 'ul';
                listStack.push([type, level]);
                processed.push('  '.repeat(level) + `<${type}>`);
                lastLevel = level;
            }

            // Add list item
            processed.push('  '.repeat(level + 1) + `<li>${processInline(content)}</li>`);
        } else {
            closeAllLists();
            if (!line.startsWith('<')) {
                processed.push(`<p>${processInline(line)}</p>`);
            } else {
                processed.push(line);
            }
        }
    }

    closeAllLists();

    function closeAllLists() {
        while (listStack.length > 0) {
            const [type, level] = listStack.pop();
            processed.push('  '.repeat(level) + `</${type}>`);
        }
        lastLevel = -1;
    }

    return processed.join('\n');
}

// Process inline elements
function processInline(text) {
    return text
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
        .replace(/→/g, '&rarr;');
}
