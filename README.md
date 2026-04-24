# ECON 30 Project Capstone

This repository contains the capstone project work for ECON 30 (Spring 2026).

## Project Overview

The goal of this project is to analyze an economics-focused question using data, statistical methods, and clear interpretation of results.

## Repository Structure

- `data/` - Raw and cleaned datasets
- `notebooks/` - Exploratory analysis and model development
- `src/` - Reusable scripts and project code
- `reports/` - Final write-up, figures, and presentation-ready outputs

## Data

The `data/` folder is used to keep the project reproducible from input files to final results.

- `data/raw/` should contain original source data files exactly as collected.
- `data/processed/` should contain cleaned or transformed datasets used for analysis.
- Keep a short note for each dataset: source, date accessed, key variables, and units.
- Avoid editing raw files directly; create processing steps in code so changes are traceable.

Recommended data workflow:

1. Save original downloads in `data/raw/`.
2. Clean and transform data using scripts in `src/`.
3. Save outputs to `data/processed/`.
4. Use processed data in notebooks and final models.

## Code

The `src/` folder contains reusable code for cleaning, analysis, and visualization.

- Put one-time exploration in `notebooks/`.
- Move repeated logic (cleaning, feature creation, plotting, regression helpers) into `src/`.
- Keep functions small and well named so methods are easy to audit.

Suggested code layout:

- `src/data_cleaning.py` (or `.R`) - read, clean, and validate input data
- `src/analysis.py` (or `.R`) - econometric/statistical model logic
- `src/visualization.py` (or `.R`) - chart creation used in reports

This structure helps separate exploratory work from final reproducible code.

## Getting Started

1. Clone the repository:
   - `git clone https://github.com/Libby-Warren/ECON-30-Project-Capstone.git`
2. Move into the project directory:
   - `cd ECON-30-Project-Capstone`
3. Create project folders if needed:
   - `mkdir -p data/raw data/processed notebooks src reports`
4. Add your analysis files and project assets to the folders above.
5. Run your scripts from `src/` to generate cleaned data and outputs for `reports/`.

## Team

- Project owner: Libby Warren

## Status

Project setup in progress.
