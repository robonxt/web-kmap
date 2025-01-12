# K-Map Solver Guide

## What is a K-Map?
A Karnaugh map (K-map) simplifies Boolean expressions visually by arranging terms in a grid where adjacent cells differ by only one variable.

## Quick Guide
1. **Cell Values**
   - Click cells to toggle: 0 → 1 → X → 0
   - 0: False/OFF
   - 1: True/ON
   - X: Don't care (can be either 0 or 1)

2. **Using the Map**
   - Solution updates automatically in SOP format
   - Look for groups of 1's and X's
   - Adjacent cells (including edges) can be grouped
   - Larger groups = simpler expressions

3. **Truth Table View**
   - Shows all input combinations
   - Click output column to change values
   - Changes sync with K-map view

4. **Quick Actions**
   - "All 1": Fill with 1's
   - "All 0": Fill with 0's
   - "Clear": Reset map
   - "Copy": Copy solution

Need more details? Check our [full documentation on GitHub](https://github.com/robonxt/web-kmap).
