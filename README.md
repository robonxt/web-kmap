# Web K-Map Solver

A lightweight and robust Karnaugh map solver implemented in pure HTML5, CSS3, and minimal JavaScript. This tool helps simplify Boolean algebraic expressions using the K-map method, always providing results in Sum of Products (SOP) format.

## What is a Karnaugh Map?

A Karnaugh map (K-map) is a method to simplify Boolean algebra expressions. It provides a visual way to minimize Boolean functions to their simplest form, which is essential in digital logic design and circuit optimization. The map arranges Boolean variables in a grid where adjacent cells differ by only one bit (Gray code order).

## Features

- 4-variable K-map solver (16 cells)
- Auto-solving with Boolean algebra simplification
- Results always in minimal SOP (Sum of Products) format
- Support for don't care conditions (X)
- Multiple solution display when available
- One-click copy solution to clipboard
- Synchronized Truth Table view
- Enhanced info guide with usage examples
- Modern, clean UI with vector icons
- Works offline after first load
- Quick operations:
  - Set all cells to 1
  - Set all cells to 0
  - Clear the map
  - Copy solution

## How to Use

1. Click on cells to cycle through values:
   - 0 → 1 → X (don't care) → 0
2. The solution updates automatically in SOP format
3. Click the copy icon to copy the result
4. Use "All 1" or "All 0" buttons for quick setup
5. Use "Clear" to reset the map
6. Switch between K-map and Truth Table views
7. Click the info icon for the usage guide

## Technical Details

- Built with vanilla HTML5, CSS3, and JavaScript
- Advanced caching strategy:
  - Always fetches latest version when online
  - Seamless offline functionality with cached version
  - No version locking - always get the most recent version you've accessed
  - Works with or without HTTPS
- Progressive features with graceful fallbacks:
  - Clipboard operations work in all environments
  - Service worker caching works on HTTP and file:// protocol
  - Full offline support on all protocols
- No external dependencies
- Boolean algebra simplification using Quine-McCluskey algorithm
- Gray code implementation for optimal cell adjacency
- Real-time synchronization between K-map and Truth Table
- Vector-based UI elements for crisp display
- Responsive layout with CSS Grid and Flexbox

## Implementation Notes

The solver uses the following process:
1. Identifies prime implicants using the Quine-McCluskey algorithm
2. Finds essential prime implicants
3. Solves the covering problem for remaining implicants
4. Simplifies the expression using Boolean algebra
5. Presents the result in minimal SOP format

## Credits

Created by [robonxt](https://github.com/robonxt). 
Assisted by Claude Sonnet 3.5 using Windsurf.
Logic inspired by https://github.com/obsfx/kmap-solver-lib
