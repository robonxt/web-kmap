# K-Map Solver Guide

A Karnaugh map (K-map) helps simplify Boolean expressions by arranging variables in a grid where adjacent cells differ by only one bit.

## Variables

Uses four variables (A, B, C, D) in Gray code order:
- Regular letter (A): Variable is 1 (TRUE)
- Letter with prime (A'): Variable is 0 (FALSE)
- Example: A'BC'D means A=0, B=1, C=0, D=1

## How to Use

1. Click cells to cycle through values:
   - 0 → 1 → X (don't care) → 0
2. Solution updates automatically in SOP format
3. Use quick actions:
   - "All 1" or "All 0" buttons for quick setup
   - "Clear" to reset the map
   - Copy icon to copy the result
4. Switch views:
   - Toggle between K-map and Truth Table
   - Switch between Gray code and normal layouts

## Features

- Interactive 4-variable K-Map
- Auto-solving in SOP format
- Support for don't care conditions (X)
- Two layout options:
  - Gray code (optimal adjacency)
  - Normal binary
- Synchronized Truth Table view
- Copy results to clipboard

## Source Code

Available on GitHub: [robonxt/web-kmap](https://github.com/robonxt/web-kmap)
