# Dynamic Wumpus Logic Agent - Project Report

## Student information
- Name: Hassaan Tariq       
- Roll number: 23F-0749
- Section: BCS-6D

## Live links (paste on first page)
- GitHub: 
- Live URL (Vercel): 
- LinkedIn post: 

## 1. Objective
Build a web-based knowledge-based agent that navigates a Wumpus World grid using propositional logic, CNF conversion, and resolution refutation to infer safe cells.

## 2. Environment specifications
- Dynamic grid size: user-configurable rows and columns.
- Hazards: pits and a wumpus randomly placed each episode.
- Percepts: breeze if adjacent to a pit, stench if adjacent to the wumpus.

## 3. Knowledge base and CNF rules
Symbols:
- P_r,c: pit in cell (r,c)
- W_r,c: wumpus in cell (r,c)
- B_r,c: breeze in cell (r,c)
- S_r,c: stench in cell (r,c)

Percept rules are encoded as equivalences and expanded into CNF:

B_r,c <-> (P_n1 OR P_n2 OR ...)
S_r,c <-> (W_n1 OR W_n2 OR ...)

CNF expansion example for breeze:
- (not B_r,c OR P_n1 OR P_n2 OR ...)
- (B_r,c OR not P_n1)
- (B_r,c OR not P_n2)
- ...

When the agent senses a cell, it adds:
- The percept fact (B_r,c or not B_r,c, same for stench)
- The CNF rules for that cell

## 4. Resolution refutation
To answer a query Q, the system checks if KB entails Q by attempting to derive a contradiction:

1) Add not Q to KB
2) Resolve clauses until either:
   - the empty clause is derived (entails Q), or
   - no new clauses can be derived (does not entail Q)

The total number of generated resolvents is tracked as inference steps.

## 5. Agent behavior
- Start at (1,1) with facts: not P_1,1 and not W_1,1
- On each step: sense, update KB, and attempt to move to a safe adjacent cell
- If no safe cell is provable, it selects an unknown adjacent cell

## 6. Visualization and metrics
- Grid colors: safe (green), unknown (gray), confirmed hazard (red)
- Agent position outlined in blue
- Metrics: inference steps, current percepts, and agent status

## 7. Deployment and usage
- The app is a static site and can be deployed on Vercel
- Provide the live URL, GitHub repo, and LinkedIn post link on the first page

## 8. Challenges and reflections
- Handling CNF expansions for equivalences without a full parser
- Managing the resolution loop without exploding clause counts
- Balancing inference strength with performance for real-time use

## 9. Conclusion
The project demonstrates a knowledge-based agent using propositional logic and resolution refutation, with a dynamic visual interface and real-time inference metrics.
