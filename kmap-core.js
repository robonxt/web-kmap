// K-Map Core Functionality
class KMapCore {
    constructor(numVars = 4) {
        // Cache frequently used DOM elements
        this.elements = {
            grid: document.getElementById('kmap-grid'),
            solution: document.getElementById('solution'),
            solutionSelect: document.getElementById('solution-select'),
            copyBtn: document.getElementById('copy-solution'),
            truthTableBody: document.getElementById('truth-table-body'),
            toggleLayoutBtn: document.getElementById('toggle-layout-btn'),
            sliderBg: document.getElementById('slider-bg'),
            hamburgerBtn: document.getElementById('hamburger-menu-btn'),
            tabsWrapper: document.getElementById('tabs-wrapper'),
            tabButtons: document.querySelectorAll('.tab-btn'),
            kmapTab: document.getElementById('kmap-tab-btn'),
            // Cache control buttons
            allOneBtn: document.getElementById('all-one-btn'),
            allZeroBtn: document.getElementById('all-zero-btn'),
            clearBtn: document.getElementById('clear-btn'),
            varSelect: document.getElementById('var-select')
        };

        // Predefined distinct colors for groups
        this.groupColors = [
            'hsla(0, 100%, 60%, 0.8)',    // Red
            'hsla(210, 100%, 60%, 0.8)',  // Blue
            'hsla(120, 100%, 60%, 0.8)',  // Green
            'hsla(45, 100%, 60%, 0.8)',   // Orange
            'hsla(280, 100%, 60%, 0.8)',  // Purple
            'hsla(180, 100%, 60%, 0.8)',  // Cyan
            'hsla(330, 100%, 60%, 0.8)',  // Pink
            'hsla(150, 100%, 60%, 0.8)'   // Teal
        ];

        // Initialize state
        this.variables = [...Array(numVars).keys()].map(i => String.fromCharCode(65 + i));
        this.numVars = numVars;
        this.size = 1 << numVars; // 2^numVars
        this.grid = Array(this.size).fill(0);
        this.isGrayCodeLayout = true;
        this.layouts = this.initializeLayouts();

        // Update variable count attribute
        document.body.setAttribute('data-vars', numVars);

        // Initialize components and setup handlers
        this.setupEventListeners();
        this.updateSliderPosition();
    }

    initializeLayouts() {
        // Use gray code layouts from KMapSolver and only maintain normal layouts here
        return {
            2: {
                gray: window.KMapSolver.KMapGrayCodes.get(2),
                normal: window.KMapSolver.KMapGrayCodes.get(2)
            },
            3: {
                gray: window.KMapSolver.KMapGrayCodes.get(3),
                normal: [[0, 2, 6, 4], [1, 3, 7, 5]]
            },
            4: {
                gray: window.KMapSolver.KMapGrayCodes.get(4),
                normal: [[0, 4, 12, 8], [1, 5, 13, 9], [3, 7, 15, 11], [2, 6, 14, 10]]
            }
        };
    }

    updateSliderPosition(activeTab = document.querySelector('.tab-btn.active')) {
        const sliderBg = this.elements.sliderBg;
        if (sliderBg && activeTab) {
            const tabWidth = activeTab.offsetWidth;
            const tabLeft = activeTab.offsetLeft;
            sliderBg.style.width = `${tabWidth}px`;
            sliderBg.style.transform = `translateX(${tabLeft}px)`;
        }
    }

    // Solution handling methods
    solve() {
        const { minterms, dontCares } = this.getMintermsAndDontCares();
        const result = window.KMapSolver.solve(this.numVars, minterms, dontCares);
        this.updateSolution(result);
    }

    updateSolution(result) {
        const { solution, solutionSelect } = this.elements;
        if (!solution || !solutionSelect) return;

        if (!result || !result.length) {
            solution.innerHTML = '0';
            solutionSelect.style.display = 'none';
            return;
        }

        if (result.length === 1) {
            solution.innerHTML = this.addOverline(result[0]);
            solutionSelect.style.display = 'none';
        } else {
            solutionSelect.innerHTML = result.map((sol, i) => 
                `<option value="${i}">Solution ${i + 1} (${sol.split('+').length} terms)</option>`
            ).join('');
            solution.innerHTML = this.addOverline(result[0]);
            solutionSelect.style.display = 'inline-block';
            solutionSelect.value = 0;

            solutionSelect.onchange = () => {
                const selectedSolution = result[solutionSelect.value];
                solution.innerHTML = this.addOverline(selectedSolution);
            };
        }
    }

    addOverline(solution) {
        if (solution === "0" || solution === "1") {
            return solution;
        }

        const terms = solution.split(' + ');
        return terms.map((term, i) => {
            const color = this.groupColors[i % this.groupColors.length];
            return `<span style="color: ${color}">${term.replace(/([A-D])'/g, '<span class="overline">$1</span>')}</span>`;
        }).join(' + ');
    }

    getMintermsAndDontCares() {
        const minterms = [];
        const dontCares = [];

        this.grid.forEach((state, i) => {
            if (state === '1') minterms.push(i);
            else if (state === 'x') dontCares.push(i);
        });

        return { minterms, dontCares };
    }

    // Clipboard handling
    showCopySuccess() {
        const copyBtn = this.elements.copyBtn;
        copyBtn.style.color = 'var(--primary-color)';
        setTimeout(() => {
            copyBtn.style.color = 'var(--text-color)';
        }, 1000);
    }

    getSolutionTextWithOverlines() {
        const solutionDiv = this.elements.solution;
        if (solutionDiv.children.length === 0) {
            return solutionDiv.textContent;
        }
        const terms = Array.from(solutionDiv.children).map(span => {
            const chars = Array.from(span.childNodes).map(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    return node.textContent;
                } else if (node.nodeType === Node.ELEMENT_NODE && node.style.textDecoration === 'overline') {
                    return node.textContent + '\u0305';
                }
                return '';
            }).join('');
            return chars;
        });
        return terms.join(' + ');
    }

    copyTextFallback(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';
        document.body.appendChild(textArea);

        try {
            textArea.select();
            document.execCommand('copy');
            this.showCopySuccess();
        } catch (err) {
            console.error('Failed to copy text: ', err);
        } finally {
            document.body.removeChild(textArea);
        }
    }

    setupClipboardHandlers() {
        this.elements.copyBtn.addEventListener('click', () => {
            const solutionText = this.getSolutionTextWithOverlines();

            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(solutionText)
                    .then(() => this.showCopySuccess())
                    .catch(() => this.copyTextFallback(solutionText));
            } else {
                this.copyTextFallback(solutionText);
            }
        });
    }

    // Event handlers setup
    setupEventListeners() {
        this.setupClipboardHandlers();
        this.setupTabHandlers();
        this.setupMenuHandlers();
        this.setupControlHandlers();
        this.setupVariableCycleHandler();
        this.setupLayoutHandlers();
    }

    setupTabHandlers() {
        const { tabButtons } = this.elements;
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });
    }

    setupMenuHandlers() {
        const { hamburgerBtn, tabsWrapper } = this.elements;
        if (hamburgerBtn && tabsWrapper) {
            hamburgerBtn.addEventListener('click', () => {
                tabsWrapper.classList.toggle('show');
            });
        }
    }

    setupControlHandlers() {
        const { allOneBtn, allZeroBtn, clearBtn } = this.elements;
        
        if (allOneBtn) {
            allOneBtn.addEventListener('click', () => this.setAllStates('1'));
        }
        if (allZeroBtn) {
            allZeroBtn.addEventListener('click', () => this.setAllStates('0'));
        }
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clear());
        }
    }

    setupVariableCycleHandler() {
        const { varSelect } = this.elements;
        if (varSelect) {
            varSelect.addEventListener('change', (e) => {
                const newVars = parseInt(e.target.value);
                if (newVars !== this.numVars) {
                    // Force Gray code layout for 2 variables
                    if (newVars === 2) {
                        this.isGrayCodeLayout = true;
                    }
                    this.onVariableChange(newVars);
                }
            });
        }
    }

    onVariableChange(newVars) {
        this.numVars = newVars;
        this.variables = [...Array(newVars).keys()].map(i => String.fromCharCode(65 + i));
        document.body.setAttribute('data-vars', newVars);
        this.layouts = this.initializeLayouts();
        this.size = 1 << newVars;
        this.grid = Array(this.size).fill(0);
        this.clear();
    }

    setupLayoutHandlers() {
        const { toggleLayoutBtn } = this.elements;
        if (toggleLayoutBtn) {
            toggleLayoutBtn.addEventListener('click', () => this.toggleLayout());
        }
    }

    // Tab and layout methods
    switchTab(tabName) {
        const { tabButtons } = this.elements;
        const tabs = document.querySelectorAll('.tab-content');
        
        tabs.forEach(tab => tab.classList.remove('active'));
        tabButtons.forEach(btn => btn.classList.remove('active'));
        
        document.getElementById(tabName).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        this.updateSliderPosition(document.querySelector(`[data-tab="${tabName}"]`));
        this.updateToggleButton();
    }

    toggleLayout() {
        this.isGrayCodeLayout = !this.isGrayCodeLayout;
        this.updateToggleButton();
    }

    updateToggleButton() {
        const { toggleLayoutBtn, kmapTab } = this.elements;
        const isKmapActive = kmapTab && kmapTab.classList.contains('active');
        
        if (toggleLayoutBtn) {
            // Update visibility based on active tab
            toggleLayoutBtn.style.display = isKmapActive ? 'flex' : 'none';
            
            // Disable for 2 variables
            toggleLayoutBtn.disabled = this.numVars === 2;
            toggleLayoutBtn.classList.toggle('disabled', this.numVars === 2);
            
            // Update layout text
            const layoutText = toggleLayoutBtn.querySelector('.layout-text');
            if (layoutText) {
                if (this.numVars === 2) {
                    layoutText.textContent = 'AB';
                } else if (this.numVars === 3) {
                    layoutText.textContent = this.isGrayCodeLayout ? 'C/AB' : 'AB/C';
                } else {
                    layoutText.textContent = this.isGrayCodeLayout ? 'CD/AB' : 'AB/CD';
                }
            }
            
            // Update SVG visibility
            const grayIcon = toggleLayoutBtn.querySelector('.gray-layout-icon');
            const binaryIcon = toggleLayoutBtn.querySelector('.binary-layout-icon');
            if (grayIcon && binaryIcon) {
                grayIcon.style.display = this.isGrayCodeLayout ? 'none' : 'block';
                binaryIcon.style.display = this.isGrayCodeLayout ? 'block' : 'none';
            }
        }
    }

    // State management methods
    clear() {
        this.grid.fill(0);
        this.elements.solution.innerHTML = '';
        this.elements.solutionSelect.style.display = 'none';
    }

    setAllStates(value) {
        this.grid = Array(this.size).fill(value);
        this.solve();
    }
}

// Export the class
window.KMapCore = KMapCore;
