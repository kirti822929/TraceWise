/**
 * SlideAnimator — Handles all visual animations for video slides
 * Provides typewriter, fade-in, code highlighting, syntax coloring, and dry run visualizations
 */
class SlideAnimator {

    /**
     * Typewriter effect — reveals text character by character
     * @param {HTMLElement} element - Target element
     * @param {string} text - Text to type out
     * @param {number} speed - Milliseconds per character
     */
    static async typewriter(element, text, speed = 25) {
        element.textContent = '';
        element.style.visibility = 'visible';
        for (let i = 0; i < text.length; i++) {
            element.textContent += text[i];
            await this.delay(speed);
        }
    }

    /**
     * Fade in with upward slide
     * @param {HTMLElement} element - Element to animate
     * @param {number} duration - Animation duration in ms
     */
    static fadeIn(element, duration = 500) {
        return new Promise((resolve) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(15px)';
            element.style.transition = `opacity ${duration}ms cubic-bezier(0.4, 0, 0.2, 1), transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;

            // Double rAF ensures styles are applied before animating
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                });
            });

            setTimeout(resolve, duration);
        });
    }

    /**
     * Staggered fade-in for multiple elements
     * @param {HTMLElement[]} elements - Array of elements
     * @param {number} stagger - Delay between each element in ms
     */
    static async fadeInStaggered(elements, stagger = 150) {
        const promises = [];
        elements.forEach((el, i) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(15px)';
            promises.push(new Promise(resolve => {
                setTimeout(() => {
                    this.fadeIn(el, 400).then(resolve);
                }, i * stagger);
            }));
        });
        await Promise.all(promises);
    }

    /**
     * Scale-in effect (pop effect)
     * @param {HTMLElement} element
     * @param {number} duration
     */
    static scaleIn(element, duration = 400) {
        return new Promise(resolve => {
            element.style.opacity = '0';
            element.style.transform = 'scale(0.8)';
            element.style.transition = `opacity ${duration}ms cubic-bezier(0.4, 0, 0.2, 1), transform ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    element.style.opacity = '1';
                    element.style.transform = 'scale(1)';
                });
            });

            setTimeout(resolve, duration);
        });
    }

    /**
     * Create a styled code block with line numbers and syntax highlighting
     * @param {string} code - Source code
     * @param {string} language - Language identifier (cpp, python, java)
     * @returns {HTMLElement}
     */
    static createCodeBlock(code, language) {
        const container = document.createElement('div');
        container.className = 'code-block';

        // Header with dots and language label
        const header = document.createElement('div');
        header.className = 'code-header';
        header.innerHTML = `
            <div class="code-dots">
                <span class="dot red"></span>
                <span class="dot yellow"></span>
                <span class="dot green"></span>
            </div>
            <span class="code-lang">${this._langDisplayName(language)}</span>
        `;
        container.appendChild(header);

        // Code body with numbered lines
        const body = document.createElement('div');
        body.className = 'code-body';

        const lines = code.split('\n');
        lines.forEach((line, i) => {
            const lineEl = document.createElement('div');
            lineEl.className = 'code-line';
            lineEl.dataset.lineIndex = i;
            lineEl.innerHTML = `
                <span class="line-number">${i + 1}</span>
                <span class="line-content">${this.highlightSyntax(line, language)}</span>
            `;
            body.appendChild(lineEl);
        });

        container.appendChild(body);
        return container;
    }

    /**
     * Highlight a specific code line
     * @param {HTMLElement} codeBlock - The code block element
     * @param {number} lineIndex - 0-based line index
     */
    static highlightLine(codeBlock, lineIndex) {
        const lines = codeBlock.querySelectorAll('.code-line');
        lines.forEach(l => l.classList.remove('active'));
        if (lines[lineIndex]) {
            lines[lineIndex].classList.add('active');
            lines[lineIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    /**
     * Clear all line highlights
     */
    static clearHighlights(codeBlock) {
        codeBlock.querySelectorAll('.code-line').forEach(l => l.classList.remove('active'));
    }

    /**
     * Basic syntax highlighting — applies color spans to code
     * @param {string} line - Single line of code
     * @param {string} language - Language identifier
     * @returns {string} HTML with color spans
     */
    static highlightSyntax(line, language) {
        // Escape HTML entities
        let html = line
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Comments (process first to prevent highlighting inside comments)
        html = html.replace(/(\/\/.*)$/g, '<span class="syn-comment">$1</span>');
        // Python comments (but not #include)
        if (language === 'python') {
            html = html.replace(/(#.*)$/g, '<span class="syn-comment">$1</span>');
        }

        // Strings (double and single quotes)
        html = html.replace(/(\"(?:[^\"\\]|\\.)*\")/g, '<span class="syn-string">$1</span>');
        html = html.replace(/(\'(?:[^\'\\]|\\.)*\')/g, '<span class="syn-string">$1</span>');

        // Numbers
        html = html.replace(/\b(\d+\.?\d*)\b/g, '<span class="syn-number">$1</span>');

        // Language keywords
        const keywords = this._getKeywords(language);
        keywords.forEach(kw => {
            const regex = new RegExp(`\\b(${kw})\\b`, 'g');
            html = html.replace(regex, '<span class="syn-keyword">$1</span>');
        });

        // Built-in functions and types
        const builtins = this._getBuiltins(language);
        builtins.forEach(b => {
            const regex = new RegExp(`\\b(${b})\\b`, 'g');
            html = html.replace(regex, '<span class="syn-function">$1</span>');
        });

        return html;
    }

    /** @private */
    static _getKeywords(language) {
        const map = {
            cpp: ['int', 'void', 'return', 'if', 'else', 'for', 'while', 'do', 'class', 'struct', 'bool', 'true', 'false', 'nullptr', 'auto', 'const', 'static', 'virtual', 'override', 'public', 'private', 'protected', 'new', 'delete', 'break', 'continue', 'switch', 'case', 'default', 'typedef', 'typename', 'template', 'namespace', 'using', 'try', 'catch', 'throw', 'long', 'double', 'float', 'char', 'unsigned', 'sizeof', 'enum', '#include'],
            python: ['def', 'return', 'if', 'else', 'elif', 'for', 'while', 'class', 'import', 'from', 'in', 'not', 'and', 'or', 'True', 'False', 'None', 'self', 'with', 'as', 'try', 'except', 'finally', 'raise', 'pass', 'break', 'continue', 'lambda', 'yield', 'global', 'nonlocal', 'assert', 'del', 'is', 'async', 'await'],
            java: ['int', 'void', 'return', 'if', 'else', 'for', 'while', 'do', 'class', 'interface', 'abstract', 'public', 'private', 'protected', 'static', 'final', 'new', 'boolean', 'true', 'false', 'null', 'this', 'super', 'extends', 'implements', 'import', 'package', 'try', 'catch', 'finally', 'throw', 'throws', 'break', 'continue', 'switch', 'case', 'default', 'synchronized', 'volatile', 'enum', 'long', 'double', 'float', 'char', 'byte', 'short']
        };
        return map[language] || map.cpp;
    }

    /** @private */
    static _getBuiltins(language) {
        const map = {
            cpp: ['vector', 'string', 'map', 'unordered_map', 'set', 'unordered_set', 'pair', 'queue', 'stack', 'priority_queue', 'sort', 'push_back', 'size', 'begin', 'end', 'cout', 'cin', 'endl', 'min', 'max', 'swap', 'find', 'insert', 'erase', 'empty', 'front', 'back', 'pop', 'push', 'top', 'make_pair', 'to_string', 'stoi', 'abs', 'pow', 'sqrt', 'INT_MAX', 'INT_MIN'],
            python: ['len', 'range', 'print', 'int', 'str', 'list', 'dict', 'set', 'tuple', 'sorted', 'enumerate', 'zip', 'map', 'filter', 'min', 'max', 'sum', 'abs', 'append', 'pop', 'remove', 'insert', 'extend', 'reverse', 'sort', 'keys', 'values', 'items', 'get', 'update', 'add', 'join', 'split', 'strip', 'replace', 'find', 'index', 'count', 'collections', 'defaultdict', 'Counter', 'deque', 'heapq', 'heappush', 'heappop', 'bisect', 'inf', 'float'],
            java: ['String', 'Integer', 'Long', 'Double', 'Boolean', 'Math', 'System', 'Arrays', 'Collections', 'ArrayList', 'LinkedList', 'HashMap', 'HashSet', 'TreeMap', 'TreeSet', 'PriorityQueue', 'Stack', 'Queue', 'Deque', 'ArrayDeque', 'List', 'Map', 'Set', 'StringBuilder', 'Comparator', 'Iterator', 'Stream', 'println', 'length', 'charAt', 'substring', 'indexOf', 'contains', 'add', 'remove', 'get', 'put', 'size', 'isEmpty', 'sort', 'reverse', 'min', 'max', 'abs', 'valueOf', 'parseInt', 'toString']
        };
        return map[language] || map.cpp;
    }

    /** @private */
    static _langDisplayName(lang) {
        return { cpp: 'C++', python: 'Python', java: 'Java' }[lang] || lang;
    }

    /**
     * Animate a variable update in dry run visualization
     * @param {HTMLElement} container - Variables container
     * @param {string} varName - Variable name
     * @param {*} value - Current value
     * @param {boolean} highlight - Whether to pulse-animate
     */
    static async animateVariable(container, varName, value, highlight = true) {
        let varEl = container.querySelector(`[data-var="${varName}"]`);

        if (!varEl) {
            varEl = document.createElement('div');
            varEl.className = 'var-box';
            varEl.dataset.var = varName;
            container.appendChild(varEl);
            await this.fadeIn(varEl, 300);
        }

        if (highlight) {
            varEl.classList.add('updated');
        }

        varEl.innerHTML = `
            <span class="var-name">${varName}</span>
            <span class="var-value">${value}</span>
        `;

        if (highlight) {
            setTimeout(() => varEl.classList.remove('updated'), 1200);
        }
    }

    /**
     * Delay helper
     * @param {number} ms - Milliseconds to wait
     */
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
