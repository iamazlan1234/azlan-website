// 💬 FEEDBACK WALL: anyone can post, and everyone can read the posts.
(function () {
  "use strict";

  const FB = (typeof FIREBASE_URL === "string" && FIREBASE_URL) ? FIREBASE_URL.replace(/\/$/, "") : "";
  const form = document.querySelector("#fbForm");
  const nameIn = document.querySelector("#fbName");
  const msgIn = document.querySelector("#fbMessage");
  const submitBtn = document.querySelector("#fbSubmit");
  const status = document.querySelector("#fbStatus");
  const list = document.querySelector("#fbList");
  const empty = document.querySelector("#fbEmpty");

  try {
    nameIn.value = localStorage.getItem("fbName") || "";
  } catch (error) { /* storage blocked */ }

  function render(entries) {
    list.textContent = "";
    if (entries.length === 0) {
      empty.textContent = "No feedback yet. Be the first!";
      return;
    }
    empty.textContent = "";
    entries.forEach(function (entry) {
      const item = document.createElement("li");
      const who = document.createElement("strong");
      const text = document.createElement("p");
      // textContent keeps visitor text safe
      who.textContent = entry.name;
      text.textContent = entry.message;
      item.append(who, text);
      list.append(item);
    });
  }

  async function loadFeedback() {
    if (!FB) {
      empty.textContent = "Feedback isn't connected yet.";
      return;
    }
    try {
      const query = "?orderBy=" + encodeURIComponent('"$key"') + "&limitToLast=50";
      const response = await fetch(FB + "/feedback.json" + query);
      if (!response.ok) throw new Error("Request failed: " + response.status);
      const data = (await response.json()) || {};
      // Push IDs sort by time, so reversing the keys shows newest first
      const entries = Object.keys(data).sort().reverse().map(function (key) { return data[key]; })
        .filter(function (e) { return e && typeof e.name === "string" && typeof e.message === "string"; });
      render(entries);
    } catch (error) {
      empty.textContent = "Couldn't load feedback. Try again later.";
    }
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    status.textContent = "";

    const name = nameIn.value.trim().slice(0, 30);
    const message = msgIn.value.trim().slice(0, 300);
    if (!name || !message) {
      status.textContent = "Please add your name and some feedback.";
      return;
    }
    if (!FB) {
      status.textContent = "Feedback isn't connected yet. Please tell Azlan!";
      return;
    }

    submitBtn.disabled = true;
    status.textContent = "Posting…";
    try {
      const response = await fetch(FB + "/feedback.json", {
        method: "POST",
        body: JSON.stringify({ name: name, message: message, time: Date.now() })
      });
      if (!response.ok) throw new Error("Request failed: " + response.status);
      try { localStorage.setItem("fbName", name); } catch (error) { /* ignore */ }
      msgIn.value = "";
      status.textContent = "✅ Thanks! Your feedback is on the wall.";
      await loadFeedback();
    } catch (error) {
      status.textContent = "Couldn't post your feedback. Please try again.";
    } finally {
      submitBtn.disabled = false;
    }
  });

  loadFeedback();
})();
