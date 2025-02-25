# K-Map Solver Guide

A K-map helps simplify Boolean expressions by grouping similar terms. This tool provides an interactive way to build and solve K-maps, automatically finding the simplest solution.

## Quick Start

1. **Choose Variables** (2-4)
   - Select from dropdown
   - Grid adjusts automatically

2. **Set Values**
   - Click cells to toggle: 0 → 1 → X
   - X = "don't care" condition
   - Quick buttons: Set All 1/0, Clear

3. **View Solution**
   - Updates in real-time
   - Copy button for easy sharing
   - Multiple solutions when available

## Reading Solutions

- A = variable is 1 (true)
- A̅ = variable is 0 (false)
- Example: A̅BC̅ means A=0, B=1, C=0

## Features

- Switch between K-map and Truth Table views
- Toggle Gray/Binary layouts (3-4 vars)
- Light/Dark theme support
- Color-coded grouping
- Mobile-friendly design

[View Source on GitHub](https://github.com/robonxt/web-kmap)
