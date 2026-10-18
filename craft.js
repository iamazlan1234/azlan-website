// 🧪 INFINITE CRAFT: combine items to discover new ones. Hidden items are secret.
(function () {
  "use strict";

  const ELEMENTS = {
    // starting items
    Water: "💧", Fire: "🔥", Earth: "🌍", Air: "💨",
    // first discoveries
    Steam: "♨️", Mud: "🟤", Lava: "🌋", Dust: "🌫️", Energy: "⚡", Rain: "🌧️", Cloud: "☁️",
    Plant: "🌱", Tree: "🌳", Flower: "🌸", Wood: "🪵", Charcoal: "⚫", Stone: "🪨", Sand: "🏖️",
    Glass: "🪟", Storm: "⛈️", Lightning: "🌩️", Ocean: "🌊", Life: "🦠", Animal: "🐾", Bird: "🐦",
    Fish: "🐟", Dinosaur: "🦖", Human: "🧑", Metal: "⚙️", Robot: "🤖", Rocket: "🚀", House: "🏠",
    Village: "🏘️", City: "🏙️", Snow: "❄️", Ice: "🧊", Snowman: "⛄", Sky: "🌤️", Sun: "☀️",
    Moon: "🌙", Star: "⭐", Galaxy: "🌌", Game: "🎮", Party: "🎉", Cake: "🎂", Birthday: "🥳",
    Diamond: "💎", Gold: "🥇", Crown: "👑", Magic: "✨", Dragon: "🐉",
    // more items
    Computer: "💻", Internet: "🌐", Phone: "📱", Sound: "🔊", Music: "🎵", Paper: "📄", Book: "📚",
    School: "🏫", Teacher: "🧑‍🏫", Ball: "⚽", Soccer: "🥅", Trophy: "🏆", Rainbow: "🌈", Island: "🏝️",
    Beach: "🌅", Boat: "⛵", Ship: "🚢", Plane: "✈️", Tornado: "🌪️", Forest: "🌲", Garden: "🌷",
    Bee: "🐝", Honey: "🍯", Apple: "🍎", Bread: "🍞", Wheat: "🌾", Milk: "🥛", Cheese: "🧀",
    Pizza: "🍕", Sandwich: "🥪", Sugar: "🍬", Cookie: "🍪", Ice_Cream: "🍦", Pie: "🥧", Cacao: "🫘",
    Chocolate: "🍫", Candy: "🍭", Coffee: "☕", Tea: "🍵", Pancake: "🥞", Egg: "🥚", Chicken: "🐔",
    Grass: "🌿", Cow: "🐄", Farm: "🚜", Alien: "👽", Ghost: "👻", Mountain: "⛰️", Cave: "🕳️",
    Crystal: "🔮", Potion: "🧪", Wizard: "🧙", Castle: "🏰", Knight: "🛡️", Sword: "🗡️", Horse: "🐴",
    Unicorn: "🦄", Butterfly: "🦋", Heart: "❤️", Rose: "🌹", Snake: "🐍", Turtle: "🐢", Shark: "🦈",
    Whale: "🐳", Octopus: "🐙", Crab: "🦀", Penguin: "🐧", Owl: "🦉", Monkey: "🐒", Lion: "🦁",
    Cat: "🐱", Dog: "🐶", Guitar: "🎸", Piano: "🎹", Drum: "🥁", Movie: "🎬", Camera: "📷",
    Light: "💡", Photo: "🖼️", Money: "💰", Shop: "🛒", Bank: "🏦", Clock: "⏰", Planet: "🪐",
    Peanut: "🥜", Sport: "🏅", Cup: "🥤", Medal: "🥇",
    // 120 more items
    Brick: "🧱",
    Bridge: "🌉",
    Road: "🛣️",
    Tent: "⛺",
    Campfire: "🏕️",
    Smoke: "🌁",
    Ash: "⚪",
    Coal: "⬛",
    Oil: "🛢️",
    Gasoline: "⛽",
    Car: "🚗",
    Bus: "🚌",
    Train: "🚂",
    Bicycle: "🚲",
    Helicopter: "🚁",
    Cloth: "🧵",
    Parachute: "🪂",
    Kite: "🪁",
    Balloon: "🎈",
    Umbrella: "☂️",
    Shirt: "👕",
    Hat: "🎩",
    Shoe: "👟",
    Glasses: "👓",
    Mirror: "🪞",
    Lamp: "🪔",
    Wax: "🧴",
    Candle: "🕯️",
    Bell: "🔔",
    Radio: "📻",
    Television: "📺",
    Keyboard: "⌨️",
    Email: "📧",
    Message: "💬",
    Video: "📹",
    Map: "🗺️",
    Compass: "🧭",
    Treasure: "🪙",
    Pirate: "🏴",
    Anchor: "⚓",
    Lighthouse: "🗼",
    Earthquake: "🫨",
    Flood: "💦",
    Fog: "🌫️",
    Hail: "🌨️",
    Thunder: "🌦️",
    Wind: "🌬️",
    Comet: "☄️",
    Meteor: "🌠",
    Asteroid: "🌑",
    Satellite: "🛰️",
    Telescope: "🔭",
    Astronaut: "🧑‍🚀",
    Universe: "🌏",
    Fossil: "🦴",
    Bone: "🦴",
    Skeleton: "💀",
    Pumpkin: "🎃",
    Witch: "🧹",
    Scroll: "📜",
    Library: "🏛️",
    Newspaper: "🗞️",
    Pencil: "✏️",
    Pen: "🖊️",
    Ruler: "📏",
    Backpack: "🎒",
    Bag: "👜",
    Key: "🔑",
    Door: "🚪",
    Window: "🔲",
    Hospital: "🏥",
    Medicine: "💊",
    Doctor: "🧑‍⚕️",
    Bandage: "🩹",
    Coin: "🪙",
    Ring: "💍",
    Gem: "💠",
    Lock: "🔒",
    Wallet: "👛",
    Card: "💳",
    Ticket: "🎟️",
    Stadium: "🏟️",
    Rope: "🪢",
    Net: "🕸️",
    Basketball: "🏀",
    Stick: "🥢",
    Hockey: "🏒",
    Tennis: "🎾",
    Baseball: "⚾",
    Golf: "⛳",
    Swimming: "🏊",
    Champion: "🏆",
    Fireworks: "🎆",
    Confetti: "🎊",
    Box: "📦",
    Gift: "🎁",
    Ribbon: "🎀",
    Cupcake: "🧁",
    Donut: "🍩",
    Burger: "🍔",
    Potato: "🥔",
    Fries: "🍟",
    Taco: "🌮",
    Soup: "🥣",
    Salad: "🥗",
    Corn: "🌽",
    Carrot: "🥕",
    Mushroom: "🍄",
    Cactus: "🌵",
    Palm: "🌴",
    Hotdog: "🌭",
    Tomato: "🍅",
    Omelette: "🍳",
    Cereal: "🥣",
    Juice: "🧃",
    Milkshake: "🧋",
    Berry: "🍓",
    Jam: "🫙",
    Fruit: "🍉",
    Cheesecake: "🍰",
    // SECRET (not counted in the total, and only found by a special recipe)
    "azlan.me": "🔗"
  };

  const SECRET = { "azlan.me": true };

  // Each recipe: [first item, second item, result]
  const RECIPES = [
    ["Water", "Fire", "Steam"], ["Water", "Earth", "Mud"], ["Fire", "Earth", "Lava"],
    ["Earth", "Air", "Dust"], ["Fire", "Air", "Energy"], ["Water", "Air", "Rain"],
    ["Steam", "Air", "Cloud"], ["Rain", "Earth", "Plant"], ["Plant", "Energy", "Flower"],
    ["Plant", "Earth", "Tree"], ["Tree", "Fire", "Wood"], ["Wood", "Fire", "Charcoal"],
    ["Lava", "Water", "Stone"], ["Stone", "Water", "Sand"], ["Sand", "Fire", "Glass"],
    ["Cloud", "Energy", "Storm"], ["Storm", "Energy", "Lightning"], ["Water", "Rain", "Ocean"],
    ["Mud", "Energy", "Life"], ["Life", "Energy", "Animal"], ["Animal", "Air", "Bird"],
    ["Animal", "Water", "Fish"], ["Animal", "Earth", "Dinosaur"], ["Animal", "Life", "Human"],
    ["Stone", "Energy", "Metal"], ["Metal", "Human", "Robot"], ["Wood", "Stone", "House"],
    ["House", "Human", "Village"], ["Village", "Metal", "City"], ["Metal", "Fire", "Rocket"],
    ["Cloud", "Water", "Snow"], ["Snow", "Water", "Ice"], ["Snow", "Human", "Snowman"],
    ["Cloud", "Air", "Sky"], ["Fire", "Sky", "Sun"], ["Sky", "Stone", "Moon"],
    ["Sun", "Energy", "Star"], ["Star", "Star", "Galaxy"], ["Human", "Robot", "Game"],
    ["Human", "Fire", "Party"], ["Flower", "Fire", "Cake"], ["Cake", "Party", "Birthday"],
    ["Charcoal", "Lava", "Diamond"], ["Lava", "Metal", "Gold"], ["Gold", "Diamond", "Crown"],
    ["Energy", "Diamond", "Magic"], ["Dinosaur", "Fire", "Dragon"],
    // more items
    ["Metal", "Energy", "Computer"], ["Computer", "Cloud", "Internet"], ["Computer", "Human", "Phone"],
    ["Energy", "Air", "Sound"], ["Sound", "Human", "Music"], ["Wood", "Water", "Paper"],
    ["Paper", "Human", "Book"], ["House", "Book", "School"], ["School", "Human", "Teacher"],
    ["Plant", "Air", "Ball"], ["Ball", "Game", "Soccer"], ["Gold", "Glass", "Trophy"],
    ["Rain", "Sun", "Rainbow"], ["Ocean", "Sand", "Island"], ["Sand", "Sun", "Beach"],
    ["Wood", "Ocean", "Boat"], ["Metal", "Ocean", "Ship"], ["Metal", "Sky", "Plane"],
    ["Storm", "Air", "Tornado"], ["Tree", "Tree", "Forest"], ["Flower", "House", "Garden"],
    ["Flower", "Animal", "Bee"], ["Bee", "Flower", "Honey"], ["Tree", "Water", "Apple"],
    ["Apple", "Bread", "Pie"], ["Plant", "Storm", "Sugar"], ["Sugar", "Fire", "Candy"],
    ["Plant", "Steam", "Coffee"], ["Plant", "Water", "Tea"], ["Wheat", "Fire", "Bread"],
    ["Animal", "Cloud", "Milk"], ["Milk", "Fire", "Cheese"], ["Bread", "Cheese", "Sandwich"],
    ["Wheat", "Cheese", "Pizza"], ["Wheat", "Milk", "Pancake"], ["Milk", "Ice", "Ice_Cream"],
    ["Pie", "Sugar", "Cookie"], ["Tree", "Sun", "Cacao"], ["Sugar", "Cacao", "Chocolate"],
    ["Bird", "Earth", "Egg"], ["Egg", "Egg", "Chicken"], ["Plant", "Rain", "Grass"],
    ["Animal", "Grass", "Cow"], ["Cow", "House", "Farm"], ["Life", "Magic", "Alien"],
    ["Human", "Dust", "Ghost"], ["Stone", "Earth", "Mountain"], ["Mountain", "Dust", "Cave"],
    ["Stone", "Magic", "Crystal"], ["Crystal", "Water", "Potion"], ["Human", "Potion", "Wizard"],
    ["Stone", "Crown", "Castle"], ["Metal", "Stone", "Sword"], ["Human", "Sword", "Knight"],
    ["Animal", "Mountain", "Horse"], ["Horse", "Magic", "Unicorn"], ["Flower", "Air", "Butterfly"],
    ["Life", "Fire", "Heart"], ["Flower", "Heart", "Rose"], ["Animal", "Mud", "Snake"],
    ["Animal", "Stone", "Turtle"], ["Fish", "Lightning", "Shark"], ["Fish", "Ocean", "Whale"],
    ["Fish", "Storm", "Octopus"], ["Fish", "Sand", "Crab"], ["Bird", "Ice", "Penguin"],
    ["Bird", "Moon", "Owl"], ["Animal", "Tree", "Monkey"], ["Animal", "Sun", "Lion"],
    ["Animal", "House", "Cat"], ["Animal", "Human", "Dog"], ["Music", "Wood", "Guitar"],
    ["Music", "Metal", "Piano"], ["Music", "Animal", "Drum"], ["Computer", "Party", "Movie"],
    ["Glass", "Metal", "Camera"], ["Camera", "Light", "Photo"], ["Fire", "Glass", "Light"],
    ["Gold", "Paper", "Money"], ["House", "Money", "Shop"], ["Shop", "Gold", "Bank"],
    ["Metal", "Sun", "Clock"], ["Star", "Stone", "Planet"],     ["Peanut", "Bread", "Sandwich"], ["Plant", "Mud", "Peanut"], ["Gold", "Sport", "Medal"], ["Ball", "Human", "Sport"], ["Plant", "Sun", "Wheat"],
    ["Glass", "Water", "Cup"], ["Sun", "Cloud", "Sky"],
    // 120 more items
    ["Stone", "Fire", "Brick"],
    ["Brick", "Metal", "Bridge"],
    ["Brick", "Dust", "Road"],
    ["Wood", "Cloud", "Tent"],
    ["Wood", "Air", "Campfire"],
    ["Campfire", "Air", "Smoke"],
    ["Charcoal", "Fire", "Ash"],
    ["Charcoal", "Stone", "Coal"],
    ["Charcoal", "Water", "Oil"],
    ["Oil", "Fire", "Gasoline"],
    ["Gasoline", "Metal", "Car"],
    ["Car", "Village", "Bus"],
    ["Metal", "Mountain", "Train"],
    ["Metal", "Animal", "Bicycle"],
    ["Plane", "Storm", "Helicopter"],
    ["Plant", "Animal", "Cloth"],
    ["Cloth", "Sky", "Parachute"],
    ["Cloth", "Air", "Kite"],
    ["Cloth", "Cloud", "Balloon"],
    ["Cloth", "Rain", "Umbrella"],
    ["Cloth", "Human", "Shirt"],
    ["Cloth", "Party", "Hat"],
    ["Cloth", "Metal", "Shoe"],
    ["Glass", "Human", "Glasses"],
    ["Glass", "Light", "Mirror"],
    ["Light", "Wood", "Lamp"],
    ["Plant", "Milk", "Wax"],
    ["Wax", "Fire", "Candle"],
    ["Metal", "Sound", "Bell"],
    ["Sound", "Glass", "Radio"],
    ["Radio", "Light", "Television"],
    ["Computer", "Piano", "Keyboard"],
    ["Internet", "Paper", "Email"],
    ["Phone", "Sound", "Message"],
    ["Camera", "Movie", "Video"],
    ["Paper", "Earth", "Map"],
    ["Map", "Metal", "Compass"],
    ["Gold", "Cave", "Treasure"],
    ["Human", "Ship", "Pirate"],
    ["Metal", "Boat", "Anchor"],
    ["House", "Light", "Lighthouse"],
    ["Mountain", "Energy", "Earthquake"],
    ["Rain", "Ocean", "Flood"],
    ["Cloud", "Dust", "Fog"],
    ["Storm", "Ice", "Hail"],
    ["Storm", "Sound", "Thunder"],
    ["Air", "Sun", "Wind"],
    ["Star", "Ice", "Comet"],
    ["Comet", "Stone", "Meteor"],
    ["Meteor", "Moon", "Asteroid"],
    ["Rocket", "Moon", "Satellite"],
    ["Glass", "Sky", "Telescope"],
    ["Human", "Rocket", "Astronaut"],
    ["Galaxy", "Planet", "Universe"],
    ["Dinosaur", "Stone", "Fossil"],
    ["Animal", "Dust", "Bone"],
    ["Bone", "Human", "Skeleton"],
    ["Plant", "Fire", "Pumpkin"],
    ["Human", "Magic", "Witch"],
    ["Paper", "Magic", "Scroll"],
    ["Book", "Village", "Library"],
    ["Paper", "Phone", "Newspaper"],
    ["Wood", "Charcoal", "Pencil"],
    ["Metal", "Paper", "Pen"],
    ["Metal", "Wood", "Ruler"],
    ["Cloth", "Book", "Backpack"],
    ["Cloth", "Wood", "Bag"],
    ["Metal", "Light", "Key"],
    ["Wood", "Glass", "Door"],
    ["Glass", "House", "Window"],
    ["House", "Heart", "Hospital"],
    ["Potion", "Sugar", "Medicine"],
    ["Human", "Medicine", "Doctor"],
    ["Cloth", "Medicine", "Bandage"],
    ["Gold", "Metal", "Coin"],
    ["Gold", "Heart", "Ring"],
    ["Crystal", "Fire", "Gem"],
    ["Metal", "Door", "Lock"],
    ["Cloth", "Money", "Wallet"],
    ["Paper", "Glass", "Card"],
    ["Paper", "Party", "Ticket"],
    ["Village", "Soccer", "Stadium"],
    ["Grass", "Metal", "Rope"],
    ["Rope", "Soccer", "Net"],
    ["Ball", "Star", "Basketball"],
    ["Tree", "Metal", "Stick"],
    ["Stick", "Ice", "Hockey"],
    ["Ball", "Sun", "Tennis"],
    ["Ball", "Wood", "Baseball"],
    ["Ball", "Grass", "Golf"],
    ["Human", "Ocean", "Swimming"],
    ["Trophy", "Human", "Champion"],
    ["Party", "Lightning", "Fireworks"],
    ["Paper", "Fire", "Confetti"],
    ["Wood", "Paper", "Box"],
    ["Box", "Party", "Gift"],
    ["Cloth", "Rose", "Ribbon"],
    ["Cake", "Milk", "Cupcake"],
    ["Bread", "Sugar", "Donut"],
    ["Bread", "Cow", "Burger"],
    ["Earth", "Grass", "Potato"],
    ["Potato", "Fire", "Fries"],
    ["Bread", "Egg", "Taco"],
    ["Potato", "Water", "Soup"],
    ["Grass", "Potato", "Salad"],
    ["Plant", "Ice", "Corn"],
    ["Plant", "Dust", "Carrot"],
    ["Mud", "Dust", "Mushroom"],
    ["Plant", "Sand", "Cactus"],
    ["Tree", "Beach", "Palm"],
    ["Bread", "Animal", "Hotdog"],
    ["Plant", "Ocean", "Tomato"],
    ["Egg", "Fire", "Omelette"],
    ["Wheat", "Ice", "Cereal"],
    ["Apple", "Water", "Juice"],
    ["Milk", "Cacao", "Milkshake"],
    ["Plant", "Sugar", "Berry"],
    ["Berry", "Sugar", "Jam"],
    ["Tree", "Sugar", "Fruit"],
    ["Cake", "Cheese", "Cheesecake"],
    // SECRET
    ["Internet", "Birthday", "azlan.me"]
  ];

  const BASE = ["Water", "Fire", "Earth", "Air"];
  const KEY = "craftPantry";
  const recipeMap = {};
  RECIPES.forEach(function (r) { recipeMap[[r[0], r[1]].sort().join("|")] = r[2]; });

  // Lets a test script check the data without a browser
  if (typeof document === "undefined") {
    module.exports = { ELEMENTS: ELEMENTS, RECIPES: RECIPES, SECRET: SECRET, BASE: BASE };
    return;
  }

  const boardCount = document.querySelector("#craftCount");
  const totalEl = document.querySelector("#craftTotal");
  const slotA = document.querySelector("#craftA");
  const slotB = document.querySelector("#craftB");
  const msg = document.querySelector("#craftMsg");
  const pantryEl = document.querySelector("#craftPantry");
  const resetBtn = document.querySelector("#craftReset");

  const FB = (typeof FIREBASE_URL === "string" && FIREBASE_URL) ? FIREBASE_URL.replace(/\/$/, "") : "";
  const crForm = document.querySelector("#crForm");
  const crName = document.querySelector("#crName");
  const crCount = document.querySelector("#crCount");
  const crSubmit = document.querySelector("#crSubmit");
  const crStatus = document.querySelector("#crFormStatus");
  const crBoardStatus = document.querySelector("#crBoardStatus");
  const crBoard = document.querySelector("#crBoard");

  const PUBLIC_TOTAL = Object.keys(ELEMENTS).filter(function (n) { return !SECRET[n]; }).length;
  const MIN_TO_SUBMIT = 8;

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
      text.textContent = name.replace("_", " ");
      button.append(icon, text);
      button.setAttribute("aria-label", name);
      button.addEventListener("click", function () { pick(name); });
      pantryEl.append(button);
    });
    const found = pantry.filter(function (n) { return !SECRET[n]; }).length;
    boardCount.textContent = found;
    totalEl.textContent = PUBLIC_TOTAL;
    crCount.textContent = found;
    crForm.hidden = found < MIN_TO_SUBMIT;
  }

  function combine() {
    const result = recipeMap[[first, second].sort().join("|")];
    let newItem = null;
    if (result) {
      if (pantry.indexOf(result) === -1) {
        pantry.push(result);
        save();
        newItem = result;
        if (SECRET[result]) {
          msg.textContent = "🤫 You found a secret: " + label(result) + "!";
        } else {
          msg.textContent = "🎉 New discovery: " + label(result) + "!";
        }
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

  // ---------- leaderboard (items found) ----------
  function renderBoard(entries) {
    crBoard.textContent = "";
    if (entries.length === 0) {
      crBoardStatus.textContent = "No scores yet. Be the first!";
      return;
    }
    crBoardStatus.textContent = "";
    entries.forEach(function (entry) {
      const item = document.createElement("li");
      const name = document.createElement("span");
      const score = document.createElement("strong");
      name.textContent = entry.name;
      score.textContent = entry.score;
      item.append(name, score);
      crBoard.append(item);
    });
  }

  async function loadBoard() {
    if (!FB) {
      crBoardStatus.textContent = "The leaderboard isn't connected yet.";
      return;
    }
    try {
      const query = "?orderBy=" + encodeURIComponent('"score"') + "&limitToLast=10";
      const response = await fetch(FB + "/craftScores.json" + query);
      if (!response.ok) throw new Error("Request failed: " + response.status);
      const data = (await response.json()) || {};
      const entries = Object.values(data)
        .filter(function (e) { return e && typeof e.name === "string" && Number.isFinite(e.score); })
        .sort(function (a, b) { return b.score - a.score; })
        ;
      renderBoard(Board.bestOnly(entries));
    } catch (error) {
      crBoardStatus.textContent = "Couldn't load the leaderboard. Try again later.";
    }
  }

  crForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const name = Board.cleanName(crName.value);
    const found = pantry.filter(function (n) { return !SECRET[n]; }).length;
    if (!name) {
      crStatus.textContent = "Please enter your first name and last initial, like Bob S.";
      return;
    }
    if (!FB) {
      crStatus.textContent = "The leaderboard isn't connected yet. Please tell Azlan!";
      return;
    }
    crSubmit.disabled = true;
    crStatus.textContent = "Saving…";
    try {
      const result = await Board.submitBest(FB, "craftScores", name, Math.min(found, 200));
      if (!result.saved) {
        crStatus.textContent = "You already have a higher score saved (" + result.best + "), so this one wasn't kept.";
        crSubmit.disabled = false;
        return;
      }
      try { localStorage.setItem("crName", name); } catch (error) { /* ignore */ }
      crStatus.textContent = "✅ Saved to the leaderboard!";
      await loadBoard();
    } catch (error) {
      crStatus.textContent = "Couldn't save your score. Please try again.";
    } finally {
      crSubmit.disabled = false;
    }
  });

  try { crName.value = localStorage.getItem("crName") || ""; } catch (error) { /* ignore */ }

  load();
  save();
  renderSlots();
  renderPantry();
  loadBoard();
})();
