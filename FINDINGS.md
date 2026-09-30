# Codebase Findings & Architectural Audit

*Generated from deep multi-specialist investigation (UI Designer, UX Designer, Logic Designer, Electronics Engineer).*

---

## 1. Executive Summary

| Perspective | Verdict | Impact on Main Branch |
| :--- | :--- | :--- |
| **Logic Designer** | **Mathematical equivalence verified** | Core solver (`kmap-solver.js`) remains identical for 2–4 vars. Prime implicant grouping, minimal SOP covers, and tie resolution unchanged. |
| **UI Designer** | **Zero visual regression** | Grid layout, SVG contour clusters, typography, and theme tokens are 100% preserved. |
| **UX Designer** | **Interaction flow intact** | 3-state cycling (`0` &rarr; `1` &rarr; `X`), touch targets, modal dialogs, and 100ms debounce preserved. |
| **Electronics Engineer** | **Hardware alignment clear** | Solver SOP expressions map cleanly to physical gate fan-in and De Morgan NAND-NAND conversions. |

---

## 2. Roadmap Decisions & Architecture

### A. 8+ Variables Decision: Dropped
- **Theoretical Limit:** Karnaugh maps are pedagogical 2D visual tools designed specifically for 2–4 variables. For 5+ variables, hypercube adjacency cannot be represented on a flat 2D torus without breaking gray-code adjacency.
- **Bitwise 32-bit Shift Wrap:** JavaScript bitwise operations (`1 << n`) operate on 32-bit signed integers. At 6 variables ($2^6 = 64$ minterms), `1 << 32` wraps modulo 32 to `1 << 0` (minterm 32 collides with minterm 0).
- **DOM & Layout Death:** A 16-variable map generates 65,536 truth table rows and causes fatal layout thrashing in `getBoundingClientRect()`.
- **Engineering Reality:** Digital hardware engineers never use visual K-maps beyond 4–6 variables; they use algorithmic synthesis (Espresso / HDL). Scope is cleanly locked to **2–4 variables**.

### B. Logic Circuit Generation (For Dedicated Feature Branch)
*This feature will be developed in a separate feature branch, not in `main`.*
- **Output Format:** Pure vector SVG (scalable, accessible, responsive to CSS theme tokens).
- **Solver AST Contract:** `kmap-solver.js` will output a structured Abstract Syntax Tree alongside flat strings:
  ```json
  {
    "solutions": ["!A!B + CD"],
    "ast": [
      {
        "type": "OR",
        "inputs": [
          { "type": "AND", "inputs": [{ "var": "A", "negated": true }, { "var": "B", "negated": true }] },
          { "type": "AND", "inputs": [{ "var": "C", "negated": false }, { "var": "D", "negated": false }] }
        ]
      }
    ]
  }
  ```
- **NAND-Only Conversion:** Applying De Morgan's Law transforms 2-level SOP into 2-level NAND-NAND:
  $$\overline{\overline{T_1 + T_2}} = \overline{\overline{T_1} \cdot \overline{T_2}}$$
  Literals that are negated receive single-input NAND inverters.
- **Physical Constraints:** Maximum 4 inputs per gate (matches standard 74xx TTL logic family fan-in).

### C. Multi-Tab Feature Navigation
- **Extensible Tab Bar:** Rather than hardcoding 2 tabs (`K-Map` and `Truth Table`), the navigation system will support an arbitrary list of feature tabs (e.g. `K-Map`, `Truth Table`, `Logic Gates`, `NAND Circuit`).
- **Declarative Router:**
  ```javascript
  // Declarative tab switching in kmap-interface.js
  this.elements.tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
          const tabId = btn.dataset.tab;
          this.switchTab(tabId);
      });
  });
  ```
- **Lifecycle Hooks:** When switching to a circuit tab, trigger SVG viewBox recalculation and layout without re-solving unless inputs changed.

---

## 3. Main Branch Refactoring & Cleanup Scope

Only non-breaking cleanup and refactoring will be executed in `main`:

1. **Extract JS Colors to CSS Variables (`kmap-interface.js`):**
   - Move `this.groupColors` array into CSS semantic variables (`--group-color-1` through `--group-color-8`) to maintain pure separation of concerns and enable high-contrast accessibility themes.
2. **Generic Tab Switching:**
   - Decouple the hardcoded 2-tab DOM references into a clean, declarative loop supporting future tabs.
3. **Accessibility & Keyboard Navigation:**
   - Add `tabindex="0"`, `role="gridcell"`, and keyboard event handlers (`Enter` / `Space` to cycle states) on K-map grid cells.
4. **Dead / Redundant Code Pruning:**
   - Audit and prune unreferenced CSS classes and duplicate selectors.
   - Clean up event listener cleanup logic in modals and resize observers to eliminate any potential memory leaks.
