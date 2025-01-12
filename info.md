# K-Map Solver Guide

## What is a K-Map?
A Karnaugh map (K-map) is a method to simplify Boolean algebra expressions. It provides a visual way to minimize Boolean functions to their simplest form, which is essential in digital logic design.

## How to Use
1. **Input Values**: 
   - Click cells to toggle between:
     - 0 (False/OFF)
     - 1 (True/ON)
     - X (Don't care)
   - The solution automatically updates in Sum of Products (SOP) format
   - Adjacent cells in the map differ by only one variable

2. **Reading the Solution**:
   - The result is shown in SOP format (sum of products)
   - Terms are minimized using Boolean algebra
   - Variables are represented as:
     - A, B, C, D (normal)
     - A', B', C', D' (complemented/NOT)

3. **Quick Actions**:
   - Use "All 1" to set all cells to 1
   - Use "All 0" to set all cells to 0
   - Use "Clear" to reset the map
   - Click the copy icon to copy the solution

4. **Truth Table View**:
   - Switch to Truth Table tab for traditional format
   - Shows all 16 possible combinations
   - Changes sync automatically with K-map
   - Click output column to modify values

## Tips
- Look for rectangular patterns of 1's (1, 2, 4, or 8 cells)
- Larger groups mean simpler expressions
- Don't care (X) values can be used as either 0 or 1
- The solution is always in minimal SOP form
- Adjacent cells (including edges) can be grouped

## Example
For input: AB + A'B'
1. Set cells where AB = 1 (both A and B are 1)
2. Set cells where A'B' = 1 (both A and B are 0)
3. The solver will simplify the expression automatically

Need more details? Check out our [full documentation on GitHub](https://github.com/robonxt/web-kmap).
