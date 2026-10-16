// 🧪 INFINITE CRAFT: combine items to discover new ones.
(function () {
  "use strict";

  const ELEMENTS = {
    Water: "💧", Fire: "🔥", Earth: "🌍", Air: "💨", Steam: "♨️", Mud: "🟤", Lava: "🌋",
    Dust: "🌫️", Energy: "⚡", Rain: "🌧️", Cloud: "☁️", Plant: "🌱", Tree: "🌳", Flower: "🌸",
    Wood: "🪵", Charcoal: "⚫", Stone: "🪨", Sand: "🏖️", Glass: "🪟", Storm: "⛈️", Lightning: "🌩️",
    Ocean: "🌊", Life: "🦠", Animal: "🐾", Bird: "🐦", Fish: "🐟", Dinosaur: "🦖", Human: "🧑",
    Metal: "⚙️", Robot: "🤖", Rocket: "🚀", House: "🏠", Village: "🏘️", City: "🏙️", Snow: "❄️",
    Ice: "🧊", Snowman: "⛄", Sky: "🌤️", Sun: "☀️", Moon: "🌙", Star: "⭐", Galaxy: "🌌", Game: "🎮",
    Party: "🎉", Cake: "🎂", Birthday: "🥳", Diamond: "💎", Gold: "🥇", Crown: "👑", Magic: "✨", Dragon: "🐉"
  };

  // Each recipe: [first item, second item, result]
  const RECIPES = [
    ["Water", "Fire", "Steam"], ["Water", "Earth", "Mud"], ["Fire", "Earth", "Lava"],
    ["Earth", "Air", "Dust"], ["Fire", "Air", "Energy"], ["Water", "Air", "Rain"],
    ["Steam", "Air", "Cloud"], ["Rain", "Earth", "Plant"], ["Plant", "Energy", "Flower"],
    ["Plant", "Earth", "Tree"], ["Tree", "Fire", "Wood"], ["Wood", "Fire", "Charcoal"],
    ["Lava", "Water", "Stone"], ["Stone", "Water", "Sand"], ["Sand", "Fire", "Glass"],
    ["Cloud", "Energy", "Storm"], ["Storm", "Energy", "Lightning"], ["Water", "Rain", "Ocean"],
    ["Mud", "Energy", "Life"], ["Life", "Energy", "Animal"], ["Animal", "Air", "Bird"],
    ["Animal", "Water", "Fish"], ["Animal", "Earth", "Dinosaur"], ["Animal", "Animal", "Human"],
    ["Stone", "Energy", "Metal"], ["Metal", "Human", "Robot"], ["Wood", "Stone", "House"],
    ["House", "Human", "Village"], ["Village", "Metal", "City"], ["Metal", "Fire", "Rocket"],
    ["Cloud", "Water", "Snow"], ["Snow", "Water", "Ice"], ["Snow", "Human", "Snowman"],
    ["Cloud", "Air", "Sky"], ["Fire", "Sky", "Sun"], ["Sky", "Stone", "Moon"],
    ["Sun", "Energy", "Star"], ["Star", "Star", "Galaxy"], ["Human", "Robot", "Game"],
    ["Human", "Fire", "Party"], ["Flower", "Fire", "Cake"], ["Cake", "Party", "Birthday"],
    ["Charcoal", "Lava", "Diamond"], ["Lava", "Metal", "Gold"], ["Gold", "Diamond", "Crown"],
    ["Energy", "Diamond", "Magic"], ["Dinosaur", "Fire", "Dragon"]
  ];

  const BASE = ["Water", "Fire", "Earth", "Air"];
  const KEY = "craftPantry";
  const recipeMap = {};
  RECIPES.forEach(function (r) { recipeMap[[r[0], r[1]].sort().join("|")] = r[2]; });

  const boardCount = document.querySelector("#craftCount");
  const totalEl = document.querySelector("#craftTotal");
  const slotA = document.querySelector("#craftA");
  const slotB = document.querySelector("#craftB");
  const msg = document.querySelector("#craftMsg");
  const pantryEl = document.querySelector("#craftPantry");
  const resetBtn = document.querySelector("#craftReset");

  let pantry = [];
  let first = null;
  let second = null;

  function load() {
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem(KEY)) || []; } catch (error) { saved = []; }
    pantry = BASE.slice();
    saved.forEach(function (name) {
      if (ELEMENTS[name] && pantry.indexOf(name) === -1) pantry.push(name);
    });
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(pantry)); } catch (error) { /* storage blocked */ }
  }

  function label(name) {
    return ELEMENTS[name] + " " + name;
  }

  function renderSlots() {
    slotA.textContent = first ? label(first) : "Pick one";
    slotB.textContent = second ? label(second) : "Pick two";
  }

  function renderPantry(newItem) {
    pantryEl.textContent = "";
    pantry.forEach(function (name) {
      const button = document.createElement("button");
      const icon = document.createElement("span");
      const text = document.createElement("span");
      button.type = "button";
      button.className = "pantry-item";
      if (name === first || name === second) button.classList.add("selected");
      if (name === newItem) button.classList.add("new");
      icon.className = "pantry-icon";
      icon.textContent = ELEMENTS[name];
      text.className = "pantry-name";
      text.textContent = name;
      button.append(icon, text);
      button.setAttribute("aria-label", name);
      button.addEventListener("click", function () { pick(name); });
      pantryEl.append(button);
    });
    boardCount.textContent = pantry.length;
    totalEl.textContent = Object.keys(ELEMENTS).length;
  }

  function combine() {
    const result = recipeMap[[first, second].sort().join("|")];
    let newItem = null;
    if (result) {
      if (pantry.indexOf(result) === -1) {
        pantry.push(result);
        save();
        newItem = result;
        msg.textContent = "🎉 New discovery: " + label(result) + "!";
      } else {
        msg.textContent = "You already have " + label(result) + ".";
      }
    } else {
      msg.textContent = "Nothing happens. Try another pair!";
    }
    first = null;
    second = null;
    renderSlots();
    renderPantry(newItem);
  }

  function pick(name) {
    if (!first) {
      first = name;
    } else if (name === first && !second) {
      first = null;
    } else if (!second) {
      second = name;
      renderSlots();
      renderPantry();
      combine();
      return;
    } else {
      first = name;
      second = null;
    }
    msg.textContent = first && !second ? "Now pick a second item." : "Pick two items to combine!";
    renderSlots();
    renderPantry();
  }

  slotA.addEventListener("click", function () {
    first = null;
    msg.textContent = "Pick any two items!";
    renderSlots();
    renderPantry();
  });

  slotB.addEventListener("click", function () {
    second = null;
    renderSlots();
    renderPantry();
  });

  resetBtn.addEventListener("click", function () {
    pantry = BASE.slice();
    first = null;
    second = null;
    save();
    msg.textContent = "Your items were reset.";
    renderSlots();
    renderPantry();
  });

  load();
  save();
  renderSlots();
  renderPantry();
})();
