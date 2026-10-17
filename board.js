// 🏆 SHARED LEADERBOARD HELPERS
// Names are "First L." (for example "Bob S."). Each name keeps only its best score.
(function () {
  "use strict";

  // Accepts "bob s", "Bob S.", "bob s." and turns them into "Bob S."
  function cleanName(raw) {
    const text = String(raw || "").trim().replace(/\s+/g, " ");
    const match = text.match(/^([A-Za-z][A-Za-z'\-]{0,14})\s+([A-Za-z])\.?$/);
    if (!match) return null;
    const first = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
    return first + " " + match[2].toUpperCase() + ".";
  }

  // Saves a score only if it beats this name's existing best.
  // If it does, the older lower scores for the same name are deleted.
  // Returns { saved: true } or { saved: false, best: <the higher score already saved> }.
  async function submitBest(base, path, name, score) {
    const root = base.replace(/\/$/, "");
    const response = await fetch(root + "/" + path + ".json");
    if (!response.ok) throw new Error("Request failed: " + response.status);
    const data = (await response.json()) || {};

    const mine = Object.keys(data).filter(function (key) {
      return data[key] && data[key].name === name;
    });
    const best = mine.reduce(function (top, key) {
      return Math.max(top, Number(data[key].score) || 0);
    }, -Infinity);

    if (mine.length && best >= score) {
      return { saved: false, best: best };
    }

    await Promise.all(mine.map(function (key) {
      return fetch(root + "/" + path + "/" + key + ".json", { method: "DELETE" });
    }));

    const saved = await fetch(root + "/" + path + ".json", {
      method: "POST",
      body: JSON.stringify({ name: name, score: score, time: Date.now() })
    });
    if (!saved.ok) throw new Error("Request failed: " + saved.status);
    return { saved: true, best: score };
  }

  // Keeps only the best score per name, highest first, top 10
  function bestOnly(entries) {
    const byName = {};
    entries.forEach(function (entry) {
      if (!byName[entry.name] || entry.score > byName[entry.name].score) {
        byName[entry.name] = entry;
      }
    });
    return Object.values(byName)
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, 10);
  }

  window.Board = { cleanName: cleanName, submitBest: submitBest, bestOnly: bestOnly };
})();
