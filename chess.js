// ♟️ CHESS: play against the computer (you are White)
// Part 1 is the chess engine (rules + computer player).
// Part 2, at the bottom, builds the board on the page.
(function () {
  "use strict";

  const FILES = "abcdefgh";
  const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const VALUES = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 0 };
  const MATE = 100000;

  const KNIGHT_STEPS = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
  const KING_STEPS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  const ROOK_DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const BISHOP_DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

  // Position bonuses (written from White's side, rank 8 at the top)
  const PST = {
    P: [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10,
      5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5,
      5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
    N: [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30,
      -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30,
      -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
    B: [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10,
      -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10,
      -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20],
    K: [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30,
      -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30,
      -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10,
      20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20],
    KE: [-50, -40, -30, -20, -20, -30, -40, -50, -30, -20, -10, 0, 0, -10, -20, -30,
      -30, -10, 20, 30, 30, 20, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30,
      -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 20, 30, 30, 20, -10, -30,
      -30, -30, 0, 0, 0, 0, -30, -30, -50, -30, -30, -30, -30, -30, -30, -50]
  };

  // ---------- Setting up positions ----------
  function parseFEN(fen) {
    const parts = fen.split(" ");
    const board = new Array(64).fill(null);
    parts[0].split("/").forEach(function (row, r) {
      let c = 0;
      for (const ch of row) {
        if (ch >= "1" && ch <= "8") {
          c += Number(ch);
        } else {
          board[r * 8 + c] = (ch === ch.toUpperCase() ? "w" : "b") + ch.toUpperCase();
          c++;
        }
      }
    });
    const rights = parts[2] || "-";
    let ep = null;
    if (parts[3] && parts[3] !== "-") {
      ep = (8 - Number(parts[3][1])) * 8 + FILES.indexOf(parts[3][0]);
    }
    return {
      board: board,
      turn: parts[1] || "w",
      castling: {
        wK: rights.includes("K"), wQ: rights.includes("Q"),
        bK: rights.includes("k"), bQ: rights.includes("q")
      },
      ep: ep,
      half: Number(parts[4]) || 0,
      full: Number(parts[5]) || 1
    };
  }

  // ---------- Rules ----------
  function attacked(b, sq, by) {
    const r = sq >> 3;
    const c = sq & 7;

    const pr = by === "w" ? r + 1 : r - 1;
    if (pr >= 0 && pr < 8) {
      if (c > 0 && b[pr * 8 + c - 1] === by + "P") return true;
      if (c < 7 && b[pr * 8 + c + 1] === by + "P") return true;
    }
    for (const [dr, dc] of KNIGHT_STEPS) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && b[nr * 8 + nc] === by + "N") return true;
    }
    for (const [dr, dc] of KING_STEPS) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && b[nr * 8 + nc] === by + "K") return true;
    }
    for (const [dr, dc] of ROOK_DIRS) {
      let nr = r + dr, nc = c + dc;
      while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const q = b[nr * 8 + nc];
        if (q) {
          if (q[0] === by && (q[1] === "R" || q[1] === "Q")) return true;
          break;
        }
        nr += dr; nc += dc;
      }
    }
    for (const [dr, dc] of BISHOP_DIRS) {
      let nr = r + dr, nc = c + dc;
      while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const q = b[nr * 8 + nc];
        if (q) {
          if (q[0] === by && (q[1] === "B" || q[1] === "Q")) return true;
          break;
        }
        nr += dr; nc += dc;
      }
    }
    return false;
  }

  function inCheck(b, color) {
    const king = b.indexOf(color + "K");
    return king >= 0 && attacked(b, king, color === "w" ? "b" : "w");
  }

  // All moves that follow the piece movement rules (may leave own king in check)
  function pseudoMoves(s, capsOnly) {
    const b = s.board;
    const us = s.turn;
    const them = us === "w" ? "b" : "w";
    const moves = [];

    function addPawn(from, to, promo, extra) {
      if (promo) {
        ["Q", "R", "B", "N"].forEach(function (p) { moves.push({ from: from, to: to, promo: p }); });
      } else {
        const m = { from: from, to: to };
        if (extra) Object.assign(m, extra);
        moves.push(m);
      }
    }

    for (let sq = 0; sq < 64; sq++) {
      const p = b[sq];
      if (!p || p[0] !== us) continue;
      const t = p[1];
      const r = sq >> 3;
      const c = sq & 7;

      if (t === "P") {
        const dir = us === "w" ? -1 : 1;
        const startRow = us === "w" ? 6 : 1;
        const promoRow = us === "w" ? 0 : 7;
        const nr = r + dir;
        if (nr < 0 || nr > 7) continue;
        const promo = nr === promoRow;
        const one = nr * 8 + c;
        if (!b[one]) {
          if (!capsOnly || promo) addPawn(sq, one, promo);
          if (!capsOnly && r === startRow && !b[one + dir * 8]) {
            moves.push({ from: sq, to: one + dir * 8, dbl: true });
          }
        }
        for (const dc of [-1, 1]) {
          const nc = c + dc;
          if (nc < 0 || nc > 7) continue;
          const to = nr * 8 + nc;
          const q = b[to];
          if (q && q[0] === them) addPawn(sq, to, promo);
          else if (!q && to === s.ep) moves.push({ from: sq, to: to, ep: true });
        }
      } else if (t === "N" || t === "K") {
        const steps = t === "N" ? KNIGHT_STEPS : KING_STEPS;
        for (const [dr, dc] of steps) {
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;
          const to = nr * 8 + nc;
          const q = b[to];
          if (!q) {
            if (!capsOnly) moves.push({ from: sq, to: to });
          } else if (q[0] === them) {
            moves.push({ from: sq, to: to });
          }
        }
        if (t === "K" && !capsOnly) {
          const home = us === "w" ? 60 : 4;
          if (sq === home && !attacked(b, home, them)) {
            const kRook = us === "w" ? 63 : 7;
            const qRook = us === "w" ? 56 : 0;
            if (s.castling[us + "K"] && b[kRook] === us + "R" && !b[home + 1] && !b[home + 2] &&
              !attacked(b, home + 1, them) && !attacked(b, home + 2, them)) {
              moves.push({ from: home, to: home + 2, castle: "K" });
            }
            if (s.castling[us + "Q"] && b[qRook] === us + "R" && !b[home - 1] && !b[home - 2] && !b[home - 3] &&
              !attacked(b, home - 1, them) && !attacked(b, home - 2, them)) {
              moves.push({ from: home, to: home - 2, castle: "Q" });
            }
          }
        }
      } else {
        const dirs = t === "R" ? ROOK_DIRS : t === "B" ? BISHOP_DIRS : ROOK_DIRS.concat(BISHOP_DIRS);
        for (const [dr, dc] of dirs) {
          let nr = r + dr, nc = c + dc;
          while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const to = nr * 8 + nc;
            const q = b[to];
            if (!q) {
              if (!capsOnly) moves.push({ from: sq, to: to });
            } else {
              if (q[0] === them) moves.push({ from: sq, to: to });
              break;
            }
            nr += dr; nc += dc;
          }
        }
      }
    }
    return moves;
  }

  function applyMove(s, m) {
    const b = s.board.slice();
    const us = s.turn;
    const piece = b[m.from];
    const captured = b[m.to];

    b[m.from] = null;
    b[m.to] = piece;
    if (m.ep) b[m.to + (us === "w" ? 8 : -8)] = null;
    if (m.promo) b[m.to] = us + m.promo;
    if (m.castle === "K") {
      b[m.to - 1] = b[m.to + 1];
      b[m.to + 1] = null;
    } else if (m.castle === "Q") {
      b[m.to + 1] = b[m.to - 2];
      b[m.to - 2] = null;
    }

    const rights = { wK: s.castling.wK, wQ: s.castling.wQ, bK: s.castling.bK, bQ: s.castling.bQ };
    if (m.from === 60) { rights.wK = false; rights.wQ = false; }
    if (m.from === 4) { rights.bK = false; rights.bQ = false; }
    if (m.from === 63 || m.to === 63) rights.wK = false;
    if (m.from === 56 || m.to === 56) rights.wQ = false;
    if (m.from === 7 || m.to === 7) rights.bK = false;
    if (m.from === 0 || m.to === 0) rights.bQ = false;

    return {
      board: b,
      turn: us === "w" ? "b" : "w",
      castling: rights,
      ep: m.dbl ? (m.from + m.to) / 2 : null,
      half: piece[1] === "P" || captured || m.ep ? 0 : s.half + 1,
      full: s.full + (us === "b" ? 1 : 0)
    };
  }

  function legalMoves(s, capsOnly) {
    return pseudoMoves(s, capsOnly).filter(function (m) {
      return !inCheck(applyMove(s, m).board, s.turn);
    });
  }

  // ---------- Computer player ----------
  function evaluate(s) {
    let score = 0;
    let queens = 0;
    const b = s.board;
    for (let sq = 0; sq < 64; sq++) {
      const p = b[sq];
      if (p && p[1] === "Q") queens++;
    }
    for (let sq = 0; sq < 64; sq++) {
      const p = b[sq];
      if (!p) continue;
      const t = p[1];
      const white = p[0] === "w";
      const idx = white ? sq : sq ^ 56;
      let v = VALUES[t];
      const table = t === "K" ? (queens === 0 ? PST.KE : PST.K) : PST[t];
      if (table) v += table[idx];
      score += white ? v : -v;
    }
    return s.turn === "w" ? score : -score;
  }

  function orderMoves(s, moves) {
    moves.forEach(function (m) {
      const victim = s.board[m.to];
      let sc = 0;
      if (victim) sc += 10 * VALUES[victim[1]] - VALUES[s.board[m.from][1]] + 1000;
      if (m.ep) sc += 1000;
      if (m.promo) sc += VALUES[m.promo];
      m.sc = sc;
    });
    return moves.sort(function (a, c) { return c.sc - a.sc; });
  }

  // Looks at captures only, so the computer doesn't stop in the middle of a trade
  function quiesce(s, alpha, beta, depth) {
    const stand = evaluate(s);
    if (stand >= beta) return beta;
    if (depth >= 4) return stand;
    if (stand > alpha) alpha = stand;
    const moves = orderMoves(s, legalMoves(s, true));
    for (const m of moves) {
      const score = -quiesce(applyMove(s, m), -beta, -alpha, depth + 1);
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  }

  function negamax(s, depth, alpha, beta, ply) {
    if (depth <= 0) return quiesce(s, alpha, beta, 0);
    const moves = legalMoves(s, false);
    if (moves.length === 0) return inCheck(s.board, s.turn) ? -MATE + ply : 0;
    orderMoves(s, moves);
    for (const m of moves) {
      const score = -negamax(applyMove(s, m), depth - 1, -beta, -alpha, ply + 1);
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  }

  function chooseMove(s, depth, noise) {
    const moves = orderMoves(s, legalMoves(s, false));
    let best = null;
    let bestScore = -Infinity;
    let alpha = -Infinity;
    for (const m of moves) {
      const next = applyMove(s, m);
      let score = -negamax(next, depth - 1, -Infinity, -alpha, 1);
      if (noise) score += Math.random() * noise;
      if (score > bestScore) {
        bestScore = score;
        best = m;
      }
      if (score > alpha) alpha = score;
    }
    return best;
  }

  // ---------- Game result ----------
  function positionKey(s) {
    return s.board.map(function (p) { return p || "-"; }).join("") + s.turn +
      (s.castling.wK ? "K" : "") + (s.castling.wQ ? "Q" : "") +
      (s.castling.bK ? "k" : "") + (s.castling.bQ ? "q" : "") + (s.ep === null ? "" : s.ep);
  }

  function notEnoughPieces(b) {
    const others = b.filter(function (p) { return p && p[1] !== "K"; });
    if (others.length === 0) return true;
    return others.length === 1 && (others[0][1] === "N" || others[0][1] === "B");
  }

  // keys = list of earlier position keys, used to spot repeated positions
  function gameResult(s, keys) {
    if (legalMoves(s, false).length === 0) {
      if (inCheck(s.board, s.turn)) {
        return { over: true, text: s.turn === "b" ? "Checkmate! You win! 🎉" : "Checkmate. The computer wins." };
      }
      return { over: true, text: "Stalemate. It's a draw." };
    }
    if (notEnoughPieces(s.board)) return { over: true, text: "Draw: not enough pieces left to win." };
    if (s.half >= 100) return { over: true, text: "Draw by the 50-move rule." };
    const key = positionKey(s);
    const seen = keys.filter(function (k) { return k === key; }).length;
    if (seen >= 3) return { over: true, text: "Draw by repetition." };
    return { over: false };
  }

  // Lets the tests (and nothing else) reach the engine
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { parseFEN, legalMoves, applyMove, chooseMove, gameResult, positionKey, inCheck, START_FEN };
  }

  // ---------- Part 2: the board on the page ----------
  if (typeof document === "undefined" || !document.querySelector("#chessBoard")) return;

  const boardEl = document.querySelector("#chessBoard");
  const statusEl = document.querySelector("#chessStatus");
  const levelEl = document.querySelector("#chessLevel");
  const newBtn = document.querySelector("#chessNew");
  const undoBtn = document.querySelector("#chessUndo");
  const autoBtn = document.querySelector("#chessAuto");

  const GLYPHS = { K: "♚", Q: "♛", R: "♜", B: "♝", N: "♞", P: "♟" };
  const NAMES = { K: "king", Q: "queen", R: "rook", B: "bishop", N: "knight", P: "pawn" };

  let state, keys, undoStack, selected, targets, last, over, thinking;
  const squares = [];

  for (let i = 0; i < 64; i++) {
    const sq = document.createElement("button");
    sq.type = "button";
    sq.className = "sq " + (((i >> 3) + (i & 7)) % 2 === 0 ? "light" : "dark");
    sq.addEventListener("click", function () { clickSquare(i); });
    boardEl.append(sq);
    squares.push(sq);
  }

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function render() {
    const checkSq = inCheck(state.board, state.turn) ? state.board.indexOf(state.turn + "K") : -1;
    for (let i = 0; i < 64; i++) {
      const sq = squares[i];
      const p = state.board[i];
      const isTarget = targets.some(function (m) { return m.to === i; });

      sq.className = "sq " + (((i >> 3) + (i & 7)) % 2 === 0 ? "light" : "dark") +
        (i === selected ? " selected" : "") +
        (isTarget ? " target" : "") +
        (isTarget && p ? " capture" : "") +
        (last && (i === last.from || i === last.to) ? " last" : "") +
        (i === checkSq ? " check" : "");

      sq.textContent = "";
      if (p) {
        const piece = document.createElement("span");
        piece.className = "piece " + p[0];
        piece.textContent = GLYPHS[p[1]] + "\uFE0E";
        sq.append(piece);
      }
      sq.setAttribute("aria-label",
        FILES[i & 7] + (8 - (i >> 3)) + (p ? ", " + (p[0] === "w" ? "white " : "black ") + NAMES[p[1]] : ", empty"));
    }
    undoBtn.disabled = thinking || undoStack.length === 0;
    autoBtn.disabled = thinking || over || state.turn !== "w";
  }

  function newGame() {
    state = parseFEN(START_FEN);
    keys = [positionKey(state)];
    undoStack = [];
    selected = null;
    targets = [];
    last = null;
    over = false;
    thinking = false;
    render();
    setStatus("Your move. You are White ♙");
  }

  function playMove(m, isPlayer) {
    if (isPlayer) undoStack.push({ state: state, keysLength: keys.length, last: last });
    state = applyMove(state, m);
    keys.push(positionKey(state));
    last = { from: m.from, to: m.to };
    selected = null;
    targets = [];

    const result = gameResult(state, keys);
    render();
    if (result.over) {
      over = true;
      setStatus(result.text);
      render();
      return;
    }
    if (state.turn === "b") {
      computerTurn();
    } else {
      setStatus(inCheck(state.board, "w") ? "Check! Your move." : "Your move.");
    }
  }

  function computerTurn() {
    thinking = true;
    setStatus("Computer is thinking…");
    render();
    setTimeout(function () {
      const level = Number(levelEl.value);
      const m = chooseMove(state, level, level === 1 ? 80 : 0);
      thinking = false;
      playMove(m, false);
    }, 60);
  }

  function clickSquare(i) {
    if (over || thinking || state.turn !== "w") return;

    const move = targets.find(function (m) { return m.to === i && (!m.promo || m.promo === "Q"); });
    if (selected !== null && move) {
      playMove(move, true); // pawns that reach the end become queens
      return;
    }

    const p = state.board[i];
    if (p && p[0] === "w" && i !== selected) {
      selected = i;
      targets = legalMoves(state, false).filter(function (m) { return m.from === i; });
    } else {
      selected = null;
      targets = [];
    }
    render();
  }

  newBtn.addEventListener("click", newGame);

  undoBtn.addEventListener("click", function () {
    if (thinking || undoStack.length === 0) return;
    const snap = undoStack.pop();
    state = snap.state;
    keys = keys.slice(0, snap.keysLength);
    last = snap.last;
    selected = null;
    targets = [];
    over = false;
    render();
    setStatus("Your move.");
  });

  // "Play a move for me": the computer picks a good move for White
  autoBtn.addEventListener("click", function () {
    if (over || thinking || state.turn !== "w") return;
    thinking = true;
    setStatus("Finding a move for you…");
    render();
    setTimeout(function () {
      const m = chooseMove(state, Math.max(3, Number(levelEl.value)), 0);
      thinking = false;
      playMove(m, true);
    }, 60);
  });

  newGame();
})();
