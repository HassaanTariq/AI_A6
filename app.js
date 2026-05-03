const ui = {
  rows: document.getElementById("rows"),
  cols: document.getElementById("cols"),
  pitProb: document.getElementById("pit-prob"),
  btnNew: document.getElementById("btn-new"),
  btnStep: document.getElementById("btn-step"),
  btnAuto: document.getElementById("btn-auto"),
  btnReveal: document.getElementById("btn-reveal"),
  grid: document.getElementById("grid"),
  metricSteps: document.getElementById("metric-steps"),
  metricPercepts: document.getElementById("metric-percepts"),
  metricStatus: document.getElementById("metric-status"),
};

const state = {
  rows: 6,
  cols: 6,
  pitProb: 0.2,
  world: null,
  agent: null,
  kb: [],
  kbIndex: new Set(),
  kbRulesAdded: new Set(),
  inferenceSteps: 0,
  percepts: { breeze: false, stench: false },
  autoTimer: null,
  revealHazards: false,
};

function key(r, c) {
  return `${r},${c}`;
}

function pitSym(r, c) {
  return `P_${r}_${c}`;
}

function wumpSym(r, c) {
  return `W_${r}_${c}`;
}

function breezeSym(r, c) {
  return `B_${r}_${c}`;
}

function stenchSym(r, c) {
  return `S_${r}_${c}`;
}

function negateLiteral(lit) {
  return lit.startsWith("~") ? lit.slice(1) : `~${lit}`;
}

function clauseKey(clause) {
  return [...clause].sort().join("|");
}

function addClause(literals) {
  const clause = new Set(literals);
  const keyName = clauseKey(clause);
  if (state.kbIndex.has(keyName)) return;
  state.kbIndex.add(keyName);
  state.kb.push(clause);
}

function addFact(lit) {
  addClause([lit]);
}

function neighbors(r, c, rows, cols) {
  const deltas = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  return deltas
    .map(([dr, dc]) => [r + dr, c + dc])
    .filter(([nr, nc]) => nr >= 1 && nr <= rows && nc >= 1 && nc <= cols);
}

function buildWorld(rows, cols, pitProb) {
  const pits = new Set();
  for (let r = 1; r <= rows; r += 1) {
    for (let c = 1; c <= cols; c += 1) {
      if (r === 1 && c === 1) continue;
      if (Math.random() < pitProb) pits.add(key(r, c));
    }
  }
  const candidates = [];
  for (let r = 1; r <= rows; r += 1) {
    for (let c = 1; c <= cols; c += 1) {
      const k = key(r, c);
      if (k !== "1,1" && !pits.has(k)) candidates.push(k);
    }
  }
  if (candidates.length === 0) {
    const removed = pits.values().next().value;
    pits.delete(removed);
    candidates.push(removed);
  }
  const wumpus = candidates[Math.floor(Math.random() * candidates.length)];
  return { pits, wumpus };
}

function perceptAt(r, c) {
  const adj = neighbors(r, c, state.rows, state.cols);
  const breeze = adj.some(([nr, nc]) => state.world.pits.has(key(nr, nc)));
  const stench = adj.some(([nr, nc]) => state.world.wumpus === key(nr, nc));
  return { breeze, stench };
}

function tellPercept(r, c, breeze, stench) {
  const bSym = breezeSym(r, c);
  const sSym = stenchSym(r, c);

  addFact(breeze ? bSym : `~${bSym}`);
  addFact(stench ? sSym : `~${sSym}`);

  const ruleKey = key(r, c);
  if (!state.kbRulesAdded.has(ruleKey)) {
    state.kbRulesAdded.add(ruleKey);
    const adj = neighbors(r, c, state.rows, state.cols);

    const pitLits = adj.map(([nr, nc]) => pitSym(nr, nc));
    if (pitLits.length > 0) {
      addClause([`~${bSym}`, ...pitLits]);
      pitLits.forEach((lit) => addClause([bSym, negateLiteral(lit)]));
    } else {
      addFact(`~${bSym}`);
    }

    const wLits = adj.map(([nr, nc]) => wumpSym(nr, nc));
    if (wLits.length > 0) {
      addClause([`~${sSym}`, ...wLits]);
      wLits.forEach((lit) => addClause([sSym, negateLiteral(lit)]));
    } else {
      addFact(`~${sSym}`);
    }
  }
}

function resolvePair(c1, c2) {
  const resolvents = [];
  for (const lit of c1) {
    const neg = negateLiteral(lit);
    if (!c2.has(neg)) continue;

    const merged = new Set();
    c1.forEach((l) => {
      if (l !== lit) merged.add(l);
    });
    c2.forEach((l) => {
      if (l !== neg) merged.add(l);
    });

    let tautology = false;
    for (const l of merged) {
      if (merged.has(negateLiteral(l))) {
        tautology = true;
        break;
      }
    }
    if (!tautology) resolvents.push(merged);
  }
  return resolvents;
}

function resolutionRefutation(kbClauses, negatedQueryClauses) {
  const clauses = [...kbClauses, ...negatedQueryClauses];
  const clauseKeys = new Set(clauses.map(clauseKey));
  let added = true;

  while (added) {
    added = false;
    for (let i = 0; i < clauses.length; i += 1) {
      for (let j = i + 1; j < clauses.length; j += 1) {
        const resolvents = resolvePair(clauses[i], clauses[j]);
        state.inferenceSteps += resolvents.length;
        for (const res of resolvents) {
          if (res.size === 0) return true;
          const keyName = clauseKey(res);
          if (!clauseKeys.has(keyName)) {
            clauseKeys.add(keyName);
            clauses.push(res);
            added = true;
          }
        }
      }
    }
  }
  return false;
}

function entailsLiteral(lit) {
  const negated = negateLiteral(lit);
  return resolutionRefutation(state.kb, [new Set([negated])]);
}

function cellStatus(r, c) {
  const pit = pitSym(r, c);
  const wumpus = wumpSym(r, c);
  const safe = entailsLiteral(`~${pit}`) && entailsLiteral(`~${wumpus}`);
  const danger = entailsLiteral(pit) || entailsLiteral(wumpus);
  return { safe, danger };
}

function nextMove() {
  const { r, c } = state.agent;
  const adj = neighbors(r, c, state.rows, state.cols);
  const options = adj.filter(([nr, nc]) => !state.agent.visited.has(key(nr, nc)));
  for (const [nr, nc] of options) {
    const status = cellStatus(nr, nc);
    if (status.safe) return [nr, nc];
  }

  for (const [nr, nc] of options) {
    const status = cellStatus(nr, nc);
    if (!status.danger) return [nr, nc];
  }

  for (const [nr, nc] of adj) {
    const status = cellStatus(nr, nc);
    if (status.safe) return [nr, nc];
  }

  return [r, c];
}

function stepAgent() {
  if (!state.agent.alive) return;

  const { r, c } = state.agent;
  const percept = perceptAt(r, c);
  state.percepts = percept;
  tellPercept(r, c, percept.breeze, percept.stench);
  state.agent.visited.add(key(r, c));

  if (state.world.pits.has(key(r, c)) || state.world.wumpus === key(r, c)) {
    state.agent.alive = false;
    ui.metricStatus.textContent = "Fell into hazard";
    render();
    stopAuto();
    return;
  }

  const [nr, nc] = nextMove();
  state.agent.r = nr;
  state.agent.c = nc;
  ui.metricStatus.textContent = "Exploring";
  render();
}

function render() {
  ui.metricSteps.textContent = state.inferenceSteps.toString();
  ui.metricPercepts.textContent = `Breeze: ${state.percepts.breeze} | Stench: ${state.percepts.stench}`;

  ui.grid.style.gridTemplateColumns = `repeat(${state.cols}, minmax(60px, 1fr))`;
  ui.grid.innerHTML = "";

  for (let r = 1; r <= state.rows; r += 1) {
    for (let c = 1; c <= state.cols; c += 1) {
      const cell = document.createElement("div");
      cell.className = "cell";
      const status = cellStatus(r, c);

      if (status.safe) cell.classList.add("safe");
      if (status.danger) cell.classList.add("danger");
      if (state.agent.r === r && state.agent.c === c) cell.classList.add("agent");

      const coords = document.createElement("div");
      coords.className = "coords";
      coords.textContent = `${r},${c}`;

      const tags = document.createElement("div");
      tags.className = "tags";
      const visited = state.agent.visited.has(key(r, c)) ? "visited" : "";
      const actual = [];
      if (state.revealHazards && state.world.pits.has(key(r, c))) actual.push("pit");
      if (state.revealHazards && state.world.wumpus === key(r, c)) actual.push("wumpus");
      tags.textContent = [visited, ...actual].filter(Boolean).join(" | ") || " ";

      cell.append(coords, tags);
      ui.grid.appendChild(cell);
    }
  }
}

function resetEpisode() {
  stopAuto();
  state.rows = Number(ui.rows.value);
  state.cols = Number(ui.cols.value);
  state.pitProb = Number(ui.pitProb.value);
  state.world = buildWorld(state.rows, state.cols, state.pitProb);
  state.agent = { r: 1, c: 1, alive: true, visited: new Set() };
  state.kb = [];
  state.kbIndex = new Set();
  state.kbRulesAdded = new Set();
  state.inferenceSteps = 0;
  state.percepts = { breeze: false, stench: false };
  state.revealHazards = false;

  addFact(`~${pitSym(1, 1)}`);
  addFact(`~${wumpSym(1, 1)}`);

  ui.metricStatus.textContent = "Ready";
  render();
}

function startAuto() {
  if (state.autoTimer) return;
  state.autoTimer = setInterval(() => {
    stepAgent();
  }, 700);
  ui.btnAuto.textContent = "Stop";
}

function stopAuto() {
  if (!state.autoTimer) return;
  clearInterval(state.autoTimer);
  state.autoTimer = null;
  ui.btnAuto.textContent = "Auto";
}

ui.btnNew.addEventListener("click", resetEpisode);
ui.btnStep.addEventListener("click", stepAgent);
ui.btnAuto.addEventListener("click", () => {
  if (state.autoTimer) {
    stopAuto();
  } else {
    startAuto();
  }
});
ui.btnReveal.addEventListener("click", () => {
  state.revealHazards = !state.revealHazards;
  ui.btnReveal.textContent = state.revealHazards ? "Hide hazards" : "Reveal hazards";
  render();
});

resetEpisode();
