# Dynamic Wumpus Logic Agent (Web App)

A static, browser-only implementation of a knowledge-based Wumpus World agent. The agent builds a propositional logic knowledge base, converts rules to CNF, and uses resolution refutation to infer safe moves.

## Features
- Dynamic grid sizing and randomized hazards
- Propositional logic KB with CNF rules for percepts
- Resolution refutation before each move
- Visual grid with safe/unknown/danger states
- Real-time metrics for inference steps and percepts

## Run locally
Open index.html directly, or serve a local static server:

```bash
python -m http.server 8000
```

Then visit http://localhost:8000

## Vercel deployment
This is a static site. Deploy the repository as a static project (no build command).

Suggested Vercel settings:
- Framework: Other
- Build command: (empty)
- Output directory: (root)

## Logic summary
- Percepts are encoded as equivalences:
  - B_r,c <-> (P in adjacent cells)
  - S_r,c <-> (W in adjacent cells)
- Rules are expanded into CNF when a cell is visited.
- Queries are answered by resolution refutation: KB entails Q if KB + not Q derives the empty clause.

## Files
- index.html: UI layout
- style.css: visual design
- app.js: world simulation, KB, CNF rules, resolution engine
- report.md: project report content (convert to PDF for submission)

## Notes for submission
- Create a PDF from report.md and add your links on the first page.
- Zip the entire project using the required naming format.
