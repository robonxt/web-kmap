const mdToHtml = md => {
    if (!md) return '';

    // Normalize newlines
    let html = md.replace(/\r\n|\r/g, '\n');

    // Store code blocks temporarily
    const codeBlocks = [];
    html = html.replace(/^```(\w*)\n([\s\S]*?)^```$/gm, (match, lang, code) => {
        const placeholder = `\n<CODE_BLOCK_${codeBlocks.length}>\n`;
        codeBlocks.push({ lang, code: code.trimEnd() });
        return placeholder;
    });

    // Process regular markdown
    html = html
        .replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>')
        .replace(/^(#{1,3})\s*(.+)$/gm, (_, h, t) => `<h${h.length}>${t}</h${h.length}>`);

    const lines = html.split('\n');
    const out = [];
    const stack = [];
    let level = -1;

    const closeList = () => {
        while (stack.length) {
            const [t, l] = stack.pop();
            out.push('  '.repeat(l) + `</${t}>`);
        }
        level = -1;
    };

    for (let line of lines) {
        line = line.trimEnd();
        if (!line) { closeList(); continue; }
        if (line.startsWith('<')) { closeList(); out.push(line); continue; }

        const list = line.match(/^(\s*)(?:([-*])|(\d+)\.)[ \t]+(.+)$/);
        if (list) {
            const [_, space, bullet, num, text] = list;
            const depth = Math.floor(space.length / 2);
            const ordered = num !== undefined;

            while (level >= depth) {
                const [t, l] = stack.pop();
                out.push('  '.repeat(l) + `</${t}>`);
                level--;
            }

            if (level < depth) {
                const type = ordered ? 'ol' : 'ul';
                stack.push([type, depth]);
                out.push('  '.repeat(depth) + `<${type}>`);
                level = depth;
            }

            out.push('  '.repeat(depth + 1) +
                `<li${ordered?` value="${num}"`:''}>${inline(text.trim())}</li>`);
        } else {
            closeList();
            out.push(`<p>${inline(line)}</p>`);
        }
    }

    closeList();
    html = out.join('\n');

    // Restore code blocks
    html = html.replace(/<CODE_BLOCK_(\d+)>/g, (_, i) => {
        const { lang, code } = codeBlocks[i];
        return `<pre><code${lang?` class="language-${lang}"`:''}>${escapeHtml(code)}</code></pre>`;
    });

    return html;
};

const inline = text => {
    const codes = new Map();
    text = text.replace(/`([^`]+)`/g, (_, c) => {
        const k = `%%${codes.size}%%`;
        codes.set(k, `<code>${escapeHtml(c)}</code>`);
        return k;
    });

    text = text.replace(/!\[([^\]]*?)]\(([^)]+?)\)/g, '<img src="$2" alt="$1">')
        .replace(/\[([^\]]+)]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
        .replace(/(\*\*|__)([^*_]+?)\1/g, '<strong>$2</strong>')
        .replace(/([*_])([^*_]+?)\1/g, '<em>$2</em>')
        .replace(/~~([^~]+?)~~/g, '<s>$1</s>')
        .replace(/→/g, '&rarr;')
        .replace(/  $/gm, '<br />');

    codes.forEach((v, k) => text = text.replace(k, v));
    return text;
};

const escapeHtml = text => text
    .replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    })[c]);

module.exports = { mdToHtml };
