# epsilver (CLI)

Deterministic (non-LLM) profile generator for the Cultural Extremity Index™ archive.

## Install (dev)
From this folder:
- npm link

## Usage

### Dry-run preview (no writes)
epsilver add "Name Here"
epsilver add "Name Here" --pick 2

### Import into a site repo
epsilver import --query "Name Here" --site "C:\path\to\cei-site"
epsilver import --query "Name Here" --site "C:\path\to\cei-site" --pick 1 --yes

### Help
epsilver --help

## Notes
- Uses Wikipedia API (search + extracts + pageimages + imageinfo extmetadata).
- Uses deterministic heuristic scoring (keyword clusters).
- CEI is soft-normalized. Primary Lean always Progressive/Reactionary (no indeterminate).
