# K-Map Solver Guide

A Karnaugh map (K-map) helps simplify Boolean expressions by arranging variables in a grid where adjacent cells differ by only one bit.

## Variables

Supports 2-4 variables arranged in Gray code order:
- **2 variables**: A, B (2×2 grid)
- **3 variables**: A, B, C (2×4 grid)
- **4 variables**: A, B, C, D (4×4 grid)

Variable notation in solutions:
- Regular letter (A): Variable is 1 (TRUE)
- Letter with prime (A'): Variable is 0 (FALSE)
- Example: A'BC'D means A=0, B=1, C=0, D=1

## How to Use

1. Select number of variables (2-4)
2. Click cells to cycle through values:
   - 0 → 1 → X (don't care) → 0
3. Solution updates automatically in SOP format
4. Use quick actions:
   - "All 1" or "All 0" buttons for quick setup
   - "Clear" to reset the map
   - Copy icon to copy the result
5. Switch views:
   - Toggle between K-map and Truth Table
   - Switch between Gray code and normal layouts (3-4 variables only)

Note: The app works offline! Once you've visited the page, you can use it anytime without internet connection. It will automatically update when you're back online.

## Features

- Variable selection (2-4 variables)
- Auto-solving in SOP format
- Support for don't care conditions (X)
- Two layout options:
  - Gray code (optimal adjacency)
  - Normal binary (3-4 variables)
- Synchronized Truth Table view
- Copy results to clipboard
- Offline support:
  - Works without internet after first visit
  - Fast loading from cache

## Source Code

Available on GitHub: [robonxt/web-kmap](https://github.com/robonxt/web-kmap)
