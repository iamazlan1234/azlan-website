const rsvpForm = document.querySelector("#rsvpForm");
const rsvpName = document.querySelector("#rsvpName");
const rsvpGuests = document.querySelector("#rsvpGuests");
const guestsRow = document.querySelector("#guestsRow");
const rsvpNote = document.querySelector("#rsvpNote");
const rsvpPeanut = document.querySelector("#rsvpPeanut");
const rsvpWebsite = document.querySelector("#rsvpWebsite");
const rsvpSubmit = document.querySelector("#rsvpSubmit");
const rsvpStatus = document.querySelector("#rsvpStatus");
const attendingInputs = document.querySelectorAll('input[name="attending"]');

function selectedAttending() {
  const checked = document.querySelector('input[name="attending"]:checked');
  return checked ? checked.value : "";
}

// Only ask "how many people" when they're coming
attendingInputs.forEach(function (input) {
  input.addEventListener("change", function () {
    guestsRow.hidden = selectedAttending() !== "yes";
  });
});

rsvpForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  rsvpStatus.className = "form-status";

  const name = rsvpName.value.trim().slice(0, 40);
  const attending = selectedAttending();

  if (!name) {
    rsvpStatus.textContent = "Please type your name.";
    rsvpName.focus();
    return;
  }
  if (!attending) {
    rsvpStatus.textContent = "Please choose if you can make it.";
    return;
  }

  // Spam bots fill in the hidden field: pretend it worked and do nothing
  if (rsvpWebsite.value) {
    rsvpForm.hidden = true;
    return;
  }

  if (!FIREBASE_URL) {
    rsvpStatus.textContent = "RSVP isn't connected yet. Please tell Azlan!";
    rsvpStatus.classList.add("error");
    return;
  }

  const reply = {
    name: name,
    attending: attending,
    guests: attending === "yes" ? Number(rsvpGuests.value) : 0
  };
  if (attending === "yes" && rsvpPeanut.checked) reply.peanutAllergy = true;
  const note = rsvpNote.value.trim().slice(0, 200);
  if (note) reply.note = note;

  rsvpSubmit.disabled = true;
  rsvpStatus.textContent = "Sending...";

  try {
    const response = await fetch(FIREBASE_URL.replace(/\/$/, "") + "/rsvps.json", {
      method: "POST",
      body: JSON.stringify(reply)
    });
    if (!response.ok) throw new Error("Request failed: " + response.status);

    // Replace the form with a thank-you (textContent keeps names safe)
    const thanks = document.createElement("p");
    thanks.className = "thanks";
    thanks.textContent = attending === "yes"
      ? "🎉 Thanks, " + name + "! See you on the field! ⚽"
      : "Thanks for letting us know, " + name + ". We'll miss you! 💚";
    rsvpForm.replaceWith(thanks);
  } catch (error) {
    rsvpStatus.textContent = "Couldn't send your RSVP. Please try again.";
    rsvpStatus.classList.add("error");
    rsvpSubmit.disabled = false;
  }
});

// 📍 ADDRESS QUIZ
// The address is stored encrypted. The key is made from the correct answer,
// so the address can't be read by looking at the page's source code.
const ENCRYPTED_ADDRESS = {
  salt: "hq+BhJPtL88hsBDpv2vxnQ==",
  iv: "Wanw99l3Y5Aq3Lo7",
  data: "foBWW1Lst70yE4o0vamPA0Hytuqw5B/itVqTaw46Jka5Zbf5n/XH3ZIlum5vJIDRYi8="
};

const addressBtn = document.querySelector("#addressBtn");
const addressForm = document.querySelector("#addressForm");
const addressAnswer = document.querySelector("#addressAnswer");
const addressStatus = document.querySelector("#addressStatus");
const addressReveal = document.querySelector("#addressReveal");

// "Ms Aisha", "ms. aisha", "AISHA" and " aisha " all become "aisha"
function normalizeAnswer(text) {
  let answer = text.toLowerCase().replace(/\./g, "").trim().replace(/\s+/g, " ");
  if (answer.startsWith("ms ")) answer = answer.slice(3).trim();
  return answer;
}

function fromBase64(text) {
  return Uint8Array.from(atob(text), function (char) { return char.charCodeAt(0); });
}

async function decryptAddress(answer) {
  const baseKey = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(answer), "PBKDF2", false, ["deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: fromBase64(ENCRYPTED_ADDRESS.salt), iterations: 200000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(ENCRYPTED_ADDRESS.iv) },
    key,
    fromBase64(ENCRYPTED_ADDRESS.data)
  );
  return new TextDecoder().decode(plain);
}

addressBtn.addEventListener("click", function () {
  addressBtn.hidden = true;
  addressForm.hidden = false;
  addressAnswer.focus();
});

addressForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  addressStatus.className = "form-status";

  const answer = normalizeAnswer(addressAnswer.value);
  if (!answer) {
    addressStatus.textContent = "Type your answer first.";
    return;
  }

  if (!(window.crypto && crypto.subtle)) {
    addressStatus.textContent = "This browser can't check the answer. Try another one.";
    addressStatus.classList.add("error");
    return;
  }

  try {
    const address = await decryptAddress(answer);
    addressForm.hidden = true;
    addressReveal.textContent = "Yay! You passed the test! My address is: " + address;
    addressReveal.hidden = false;
  } catch (error) {
    // A wrong answer makes the decryption fail
    addressStatus.textContent = "Hmm, that's not right. Try again!";
    addressStatus.classList.add("error");
    addressAnswer.select();
  }
});
