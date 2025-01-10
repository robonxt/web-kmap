# Web K-Map Solver

A lightweight and robust Karnaugh map solver implemented in pure HTML5, CSS3, and minimal JavaScript. This tool helps simplify Boolean algebraic expressions using the K-map method.

## What is a Karnaugh Map?

A Karnaugh map (K-map) is a method to simplify Boolean algebra expressions. It provides a visual way to minimize Boolean functions to their simplest form, which is essential in digital logic design and circuit optimization. The map arranges Boolean variables in a grid where adjacent cells differ by only one bit (Gray code order).

## Features

- 4-variable K-map solver (16 cells)
- Auto-solving: Results update instantly as you modify the map
- Support for don't care conditions (X)
- Multiple solution display when available
- One-click copy solution to clipboard
- Synchronized Truth Table view
- Interactive info popup with K-map usage guide
- Modern, clean UI design
- One-click operations:
  - Set all cells to 1
  - Set all cells to 0
  - Clear the map

## How to Use

1. Click on cells to cycle through values:
   - 0 → 1 → X (don't care) → 0
2. The solution updates automatically in Sum of Products (SOP) format
3. Click the copy icon on the left of the solution box to copy the result
4. Use "All 1" or "All 0" buttons to quickly set all cells
5. Use "Clear" to reset the map
6. Switch between K-map and Truth Table views
7. Click the info icon for a quick guide on K-map usage

## Technical Details

- Built with vanilla HTML5, CSS3, and JavaScript
- No external dependencies
- Boolean algebra simplification using Quine-McCluskey algorithm
- Gray code implementation for optimal cell adjacency
- Real-time synchronization between K-map and Truth Table
- Responsive layout with CSS Grid and Flexbox

## Implementation Notes

The solver uses the following process:
1. Identifies prime implicants using the Quine-McCluskey algorithm
2. Finds essential prime implicants
3. Solves the covering problem for remaining implicants
4. Presents the simplified expression in SOP form
5. Synchronizes state between K-map and Truth Table views

## Credits

Coded by Claude Sonnet 3.5 using Windsurf.
Logic inspired by https://github.com/obsfx/kmap-solver-lib
