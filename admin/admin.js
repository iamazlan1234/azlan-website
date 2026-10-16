// 🔐 ADMIN: sign in as the owner, check RSVPs, and edit or delete feedback.
// The database rules are what really keep this private; this page only shows what the rules allow.
(function () {
  "use strict";

  const ADMIN_EMAIL = "azlan.a.siddiqui@gmail.com";
  const FB = FIREBASE_URL.replace(/\/$/, "");

  firebase.initializeApp(FIREBASE_WEB_CONFIG);
  const auth = firebase.auth();

  const $ = function (sel) { return document.querySelector(sel); };
  const loginBox = $("#loginBox");
  const verifyBox = $("#verifyBox");
  const dashBox = $("#dashBox");
  const dashStatus = $("#dashStatus");

  function show(box) {
    [loginBox, verifyBox, dashBox].forEach(function (b) { b.hidden = b !== box; });
  }

  async function token() {
    const user = auth.currentUser;
    if (!user) throw new Error("Not signed in");
    return user.getIdToken();
  }

  async function api(path, options) {
    const t = await token();
    const sep = path.indexOf("?") === -1 ? "?" : "&";
    const response = await fetch(FB + path + sep + "auth=" + encodeURIComponent(t), options || {});
    if (!response.ok) throw new Error("Request failed: " + response.status);
    return response.status === 204 ? null : response.json();
  }

  function el(tag, text, className) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // ---------- RSVPs ----------
  function renderRsvps(data) {
    const list = $("#rsvpList");
    list.textContent = "";
    const entries = Object.keys(data || {}).map(function (k) { return { id: k, ...data[k] }; });

    let yes = 0, guests = 0, no = 0, peanut = 0;
    entries.forEach(function (e) {
      if (e.attending === "yes") { yes++; guests += Number(e.guests) || 0; }
      if (e.attending === "no") no++;
      if (e.peanutAllergy) peanut++;
    });
    $("#rsvpYes").textContent = yes;
    $("#rsvpGuests").textContent = guests;
    $("#rsvpNo").textContent = no;
    $("#rsvpPeanut").textContent = peanut;

    if (entries.length === 0) {
      list.append(el("p", "No RSVPs yet.", "more-message"));
      return;
    }
    entries.forEach(function (e) {
      const item = el("div", "", "admin-item");
      item.append(el("strong", e.name || "(no name)"));
      const attendLabel = e.attending === "yes" ? "✅ Coming" : "❌ Not coming";
      item.append(el("p", attendLabel + (e.attending === "yes" ? " · " + (e.guests || 1) + " people" : ""), "meta " + (e.attending === "yes" ? "tag-yes" : "tag-no")));
      if (e.peanutAllergy) item.append(el("p", "🥜 Peanut allergy", "meta tag-peanut"));
      if (e.note) item.append(el("p", "“" + e.note + "”", "meta"));
      list.append(item);
    });
  }

  // ---------- Feedback ----------
  function renderFeedback(data) {
    const list = $("#fbAdminList");
    list.textContent = "";
    const keys = Object.keys(data || {}).sort().reverse();
    if (keys.length === 0) {
      list.append(el("p", "No feedback yet.", "more-message"));
      return;
    }
    keys.forEach(function (key) {
      const entry = data[key] || {};
      const item = el("div", "", "admin-item");

      const nameInput = el("input");
      nameInput.type = "text";
      nameInput.maxLength = 30;
      nameInput.value = entry.name || "";
      nameInput.setAttribute("aria-label", "Name");

      const msgInput = el("textarea");
      msgInput.maxLength = 300;
      msgInput.value = entry.message || "";
      msgInput.setAttribute("aria-label", "Message");

      const status = el("p", "", "meta");
      const row = el("div", "", "admin-row");
      const saveBtn = el("button", "Save", "small-btn");
      const delBtn = el("button", "Delete", "small-btn danger");
      row.append(saveBtn, delBtn);

      saveBtn.addEventListener("click", async function () {
        const name = nameInput.value.trim().slice(0, 30);
        const message = msgInput.value.trim().slice(0, 300);
        if (!name || !message) {
          status.textContent = "Name and message can't be empty.";
          return;
        }
        saveBtn.disabled = true;
        status.textContent = "Saving…";
        try {
          await api("/feedback/" + encodeURIComponent(key) + ".json", {
            method: "PATCH",
            body: JSON.stringify({ name: name, message: message })
          });
          status.textContent = "✅ Saved.";
        } catch (error) {
          status.textContent = "Couldn't save. Check you're signed in as the owner.";
        } finally {
          saveBtn.disabled = false;
        }
      });

      delBtn.addEventListener("click", async function () {
        if (!window.confirm("Delete this feedback post? This can't be undone.")) return;
        delBtn.disabled = true;
        try {
          await api("/feedback/" + encodeURIComponent(key) + ".json", { method: "DELETE" });
          item.remove();
        } catch (error) {
          status.textContent = "Couldn't delete. Try again.";
          delBtn.disabled = false;
        }
      });

      item.append(nameInput, msgInput, status, row);
      list.append(item);
    });
  }

  async function loadAll() {
    dashStatus.textContent = "Loading…";
    try {
      const [rsvps, feedback] = await Promise.all([api("/rsvps.json"), api("/feedback.json")]);
      renderRsvps(rsvps);
      renderFeedback(feedback);
      dashStatus.textContent = "Last updated " + new Date().toLocaleTimeString() + ".";
    } catch (error) {
      dashStatus.textContent = "Couldn't load the data. Make sure the database rules are published.";
    }
  }

  // ---------- Sign in and out ----------
  $("#loginForm").addEventListener("submit", async function (event) {
    event.preventDefault();
    const status = $("#loginStatus");
    status.textContent = "Signing in…";
    try {
      await auth.signInWithEmailAndPassword($("#loginEmail").value.trim(), $("#loginPassword").value);
      status.textContent = "";
    } catch (error) {
      status.textContent = "Wrong email or password.";
    }
  });

  $("#verifySend").addEventListener("click", async function () {
    try {
      await auth.currentUser.sendEmailVerification();
      $("#verifyStatus").textContent = "✅ Verification email sent.";
    } catch (error) {
      $("#verifyStatus").textContent = "Couldn't send it. Wait a minute and try again.";
    }
  });

  $("#verifyDone").addEventListener("click", async function () {
    await auth.currentUser.reload();
    await auth.currentUser.getIdToken(true);
    if (auth.currentUser.emailVerified) {
      show(dashBox);
      loadAll();
    } else {
      $("#verifyStatus").textContent = "Not verified yet. Click the link in the email first.";
    }
  });

  $("#verifyOut").addEventListener("click", function () { auth.signOut(); });
  $("#signOutBtn").addEventListener("click", function () { auth.signOut(); });
  $("#refreshBtn").addEventListener("click", loadAll);

  auth.onAuthStateChanged(async function (user) {
    if (!user) {
      show(loginBox);
      return;
    }
    if (user.email !== ADMIN_EMAIL) {
      await auth.signOut();
      $("#loginStatus").textContent = "That account isn't allowed here.";
      show(loginBox);
      return;
    }
    if (!user.emailVerified) {
      show(verifyBox);
      return;
    }
    show(dashBox);
    loadAll();
  });
})();
