const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// --- FIX 1: CONNECTION SETTINGS ---
const io = new Server(server, {
  cors: { origin: "*" },
  // "pingTimeout": How long without a pong packet before we consider the connection closed?
  // Increased to 60s (from 20s) to handle bad mobile data.
  pingTimeout: 60000,
  // "pingInterval": How often to check?
  pingInterval: 25000,
});

app.use(express.static("public"));

// --- CONSTANTS & STATE ---
// --- CONSTANTS & STATE ---
const WORDS = [
  // --- EASY (Simple Objects) ---
  "Apple",
  "Ball",
  "Banana",
  "Bed",
  "Bird",
  "Book",
  "Box",
  "Bread",
  "Bus",
  "Cake",
  "Car",
  "Cat",
  "Chair",
  "Circle",
  "Cloud",
  "Coin",
  "Comb",
  "Cow",
  "Cup",
  "Dog",
  "Door",
  "Dot",
  "Drum",
  "Duck",
  "Ear",
  "Egg",
  "Eye",
  "Face",
  "Fish",
  "Fly",
  "Fork",
  "Ghost",
  "Goat",
  "Grape",
  "Grass",
  "Hair",
  "Hand",
  "Hat",
  "Heart",
  "Hippo",
  "Home",
  "Horse",
  "House",
  "Ice",
  "Jar",
  "Key",
  "Kite",
  "Kiwi",
  "Lamp",
  "Leaf",
  "Leg",
  "Lemon",
  "Line",
  "Lion",
  "Lips",
  "Lock",
  "Log",
  "Map",
  "Milk",
  "Moon",
  "Mouse",
  "Mouth",
  "Nail",
  "Neck",
  "Nose",
  "Owl",
  "Pen",
  "Pig",
  "Pie",
  "Pizza",
  "Pond",
  "Pool",
  "Pot",
  "Rain",
  "Ring",
  "Road",
  "Rock",
  "Roof",
  "Room",
  "Rope",
  "Rose",
  "Rug",
  "Sad",
  "Salt",
  "Sand",
  "Sea",
  "Ship",
  "Shirt",
  "Shoe",
  "Shop",
  "Sink",
  "Sky",
  "Smile",
  "Snow",
  "Sock",
  "Sofa",
  "Soup",
  "Spoon",
  "Star",
  "Sun",
  "Swan",
  "Tail",
  "Tank",
  "Tape",
  "Taxi",
  "Tea",
  "Tent",
  "Tie",
  "Toast",
  "Toe",
  "Tree",
  "Truck",
  "Van",
  "Wall",
  "Water",
  "Wave",
  "Web",
  "Well",
  "Wind",
  "Wolf",
  "Worm",
  "Yard",
  "Zoo",

  // --- MEDIUM (Actions, Jobs, Compounds) ---
  "Airplane",
  "Alien",
  "Ambulance",
  "Anchor",
  "Angel",
  "Ant",
  "Archer",
  "Arm",
  "Artist",
  "Axe",
  "Baby",
  "Backpack",
  "Balloon",
  "Bamboo",
  "Bank",
  "Basket",
  "Bat",
  "Beach",
  "Bear",
  "Beard",
  "Bee",
  "Belt",
  "Bench",
  "Bible",
  "Bicycle",
  "Bikini",
  "Biscuit",
  "Blanket",
  "Bomb",
  "Bone",
  "Bottle",
  "Bow",
  "Bowl",
  "Brain",
  "Bridge",
  "Broom",
  "Brush",
  "Bubble",
  "Bucket",
  "Bug",
  "Bulb",
  "Bunny",
  "Burger",
  "Button",
  "Cactus",
  "Camera",
  "Camp",
  "Candle",
  "Cannon",
  "Cape",
  "Card",
  "Carrot",
  "Castle",
  "Cave",
  "Chain",
  "Chalk",
  "Cheese",
  "Cherry",
  "Chess",
  "Chest",
  "Chicken",
  "Chimney",
  "Church",
  "Cigar",
  "Circle",
  "Clock",
  "Clown",
  "Coffee",
  "Comet",
  "Compass",
  "Computer",
  "Cookie",
  "Corn",
  "Crab",
  "Cross",
  "Crow",
  "Crown",
  "Crystal",
  "Curtain",
  "Cycle",
  "Dance",
  "Dart",
  "Deer",
  "Desk",
  "Diamond",
  "Dice",
  "Dino",
  "Dirt",
  "Disco",
  "Doctor",
  "Doll",
  "Dollar",
  "Dolphin",
  "Donut",
  "Dress",
  "Drill",
  "Drink",
  "Drive",
  "Drone",
  "Drop",
  "Dust",
  "Eagle",
  "Earth",
  "Eel",
  "Elephant",
  "Engine",
  "Eraser",
  "Eye",
  "Factory",
  "Fan",
  "Farm",
  "Feather",
  "Fence",
  "Field",
  "Fire",
  "Fish",
  "Flag",
  "Flame",
  "Flash",
  "Flood",
  "Flower",
  "Flute",
  "Foot",
  "Football",
  "Forest",
  "Fossil",
  "Fountain",
  "Fox",
  "Fridge",
  "Frog",
  "Fruit",
  "Fuel",
  "Fungus",
  "Game",
  "Garden",
  "Gas",
  "Gate",
  "Gem",
  "Ghost",
  "Gift",
  "Giraffe",
  "Girl",
  "Glass",
  "Glove",
  "Glue",
  "Gnome",
  "Gold",
  "Golf",
  "Goose",
  "Gorilla",
  "Grain",
  "Grape",
  "Graph",
  "Grass",
  "Grave",
  "Guitar",
  "Gun",
  "Gym",
  "Hair",
  "Hammer",
  "Hand",
  "Harbor",
  "Harp",
  "Hat",
  "Hawk",
  "Head",
  "Heart",
  "Heater",
  "Helmet",
  "Hen",
  "Hero",
  "Hill",
  "Hippo",
  "Hockey",
  "Hole",
  "Honey",
  "Hood",
  "Hook",
  "Horn",
  "Horse",
  "Hose",
  "Hotel",
  "House",
  "Human",
  "Hunt",
  "Ice",
  "Igloo",
  "Inch",
  "Ink",
  "Iron",
  "Island",
  "Jack",
  "Jacket",
  "Jail",
  "Jam",
  "Jar",
  "Jaw",
  "Jeans",
  "Jeep",
  "Jelly",
  "Jet",
  "Jewel",
  "Joker",
  "Judge",
  "Juice",
  "Jump",
  "Jungle",
  "Kangaroo",
  "Keyboard",
  "Kitchen",

  // --- HARD (Abstract, Specific, Places) ---
  "Accordion",
  "Alligator",
  "Alphabet",
  "Anaconda",
  "Antarctica",
  "Apartment",
  "Aquarium",
  "Architect",
  "Arithmetic",
  "Asteroid",
  "Astronaut",
  "Atmosphere",
  "Autograph",
  "Avalanche",
  "Backbone",
  "Backyard",
  "Badminton",
  "Bagpipes",
  "Baguette",
  "Ballerina",
  "Bandage",
  "Bandana",
  "Banjo",
  "Barbecue",
  "Barber",
  "Barcode",
  "Battery",
  "Battle",
  "Battleship",
  "Bazooka",
  "Beaver",
  "Beehive",
  "Beetle",
  "Billboard",
  "Binoculars",
  "Biology",
  "Biscuit",
  "Blacksmith",
  "Blizzard",
  "Blueberry",
  "Bodyguard",
  "Bookstore",
  "Boomerang",
  "Bouquet",
  "Boxing",
  "Bracelet",
  "Brainstorm",
  "Breakfast",
  "Bricklayer",
  "Briefcase",
  "Broccoli",
  "Buffalo",
  "Bulldozer",
  "Bunkbed",
  "Butterfly",
  "Button",
  "Calculator",
  "Calendar",
  "Campsite",
  "Canary",
  "Cappuccino",
  "Captain",
  "Caravan",
  "Cardboard",
  "Carnival",
  "Carpenter",
  "Carpet",
  "Carriage",
  "Cartoon",
  "Cathedral",
  "Cauliflower",
  "Ceiling",
  "Cement",
  "Cemetery",
  "Centaur",
  "Centipede",
  "Certificate",
  "Chainsaw",
  "Chameleon",
  "Champagne",
  "Chandelier",
  "Charger",
  "Cheetah",
  "Chemistry",
  "Chestnut",
  "Chihuahua",
  "Chimpanzee",
  "Chocolate",
  "Chopsticks",
  "Christmas",
  "Cigarette",
  "Cinema",
  "Cinnamon",
  "Clarinet",
  "Classroom",
  "Cliff",
  "Cloak",
  "Clockwork",
  "Cockroach",
  "Cocktail",
  "Coconut",
  "Coffin",
  "Collar",
  "College",
  "Collision",
  "Comedy",
  "Commander",
  "Commercial",
  "Communist",
  "Community",
  "Compass",
  "Computer",
  "Concert",
  "Concrete",
  "Confetti",
  "Continent",
  "Contract",
  "Corner",
  "Corridor",
  "Costume",
  "Cotton",
  "Country",
  "Coupon",
  "Cowboy",
  "Coyote",
  "Crab",
  "Cracker",
  "Crayon",
  "Cream",
  "Cricket",
  "Criminal",
  "Crocodile",
  "Crossbow",
  "Crowbar",
  "Cruise",
  "Crust",
  "Crystal",
  "Cuckoo",
  "Cucumber",
  "Cupboard",
];

const rooms = {};

// --- HELPERS ---
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
function getRandomWords(count) {
  return WORDS.sort(() => 0.5 - Math.random()).slice(0, count);
}

// --- HINT HELPERS ---

function initRevealed(word) {
  return word.split("").map((c) => (c === " " ? " " : null));
}

function getEffectiveMaxHints(word, hostMax) {
  const letters = word.replace(/[^a-zA-Z]/g, "").length;
  if (letters <= 3) return Math.min(1, hostMax);
  if (letters <= 5) return Math.min(2, hostMax);
  return hostMax;
}

function buildHintSchedule(drawTime, maxHints) {
  if (maxHints === 0) return [];

  const schedule = [];
  const start = Math.floor(drawTime * 0.6);
  const gap = Math.floor((drawTime - start) / maxHints);

  for (let i = 0; i < maxHints; i++) {
    schedule.push(drawTime - (start + i * gap));
  }
  return schedule;
}

function revealNextLetter(room) {
  const { word, revealed } = room.gameState;

  const hidden = revealed
    .map((v, i) => (v === null && word[i] !== " " ? i : null))
    .filter((i) => i !== null);

  if (hidden.length === 0) return;

  const index = hidden[Math.floor(Math.random() * hidden.length)];
  revealed[index] = word[index];
}

// --- GAME LOGIC ---
function nextTurn(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;

  const playerIds = Object.keys(room.users);
  if (playerIds.length === 0) return;

  let available = playerIds.filter(
    (id) => !room.gameState.drawersThisRound.includes(id)
  );

  if (available.length === 0) {
    room.gameState.currentRound++;
    room.gameState.drawersThisRound = [];
    available = playerIds;

    if (room.gameState.currentRound > room.settings.rounds) {
      return endGame(roomCode);
    }
  }

  const nextDrawerId = available[Math.floor(Math.random() * available.length)];

  // ✅ SAFETY CHECK (correct place)
  if (!room.users[nextDrawerId]) {
    return nextTurn(roomCode);
  }

  room.gameState.drawer = nextDrawerId;
  room.gameState.drawersThisRound.push(nextDrawerId);

  room.gameState.status = "selecting";
  room.gameState.guessed = [];
  room.gameState.word = null;
  room.drawHistory = [];

  io.to(roomCode).emit("game-update", {
    status: "selecting",
    drawer: room.users[nextDrawerId].name,
    drawerId: nextDrawerId,
    round: room.gameState.currentRound,
    maxRounds: room.settings.rounds,
  });

  const choices = getRandomWords(3);
  room.gameState.wordChoices = choices;
  io.to(nextDrawerId).emit("choose-word", choices);
}

function startRound(roomCode, word) {
  const room = rooms[roomCode];
  if (!room) return;

  delete room.gameState.wordChoices;

  room.gameState.word = word;
  room.gameState.status = "drawing";
  room.gameState.roundTime = room.settings.drawTime;

  // 💡 HINT SETUP
  const effectiveMaxHints = getEffectiveMaxHints(word, room.settings.maxHints);

  room.gameState.revealed = initRevealed(word);
  room.gameState.hintSchedule = buildHintSchedule(
    room.settings.drawTime,
    effectiveMaxHints
  );
  room.gameState.nextHintIndex = 0;
  io.to(roomCode).emit("hint-update", {
    revealed: room.gameState.revealed,
  });

  // Update Everyone
  io.to(roomCode).emit("game-update", {
    status: "drawing",
    drawer: room.users[room.gameState.drawer].name,
    drawerId: room.gameState.drawer,
    time: room.gameState.roundTime,
    round: room.gameState.currentRound,
    maxRounds: room.settings.rounds,
  });

  // Private update for Drawer
  io.to(room.gameState.drawer).emit("game-update", {
    status: "drawing",
    drawer: room.users[room.gameState.drawer].name,
    drawerId: room.gameState.drawer,
    word: word,
    round: room.gameState.currentRound,
    maxRounds: room.settings.rounds,
  });

  clearInterval(room.timer);
  room.timer = setInterval(() => {
    if (!rooms[roomCode]) return clearInterval(room.timer);

    const gs = room.gameState;
    gs.roundTime--;

    io.to(roomCode).emit("timer", gs.roundTime);

    // 💡 HANDLE HINTS
    if (
      gs.status === "drawing" &&
      gs.nextHintIndex < gs.hintSchedule.length &&
      gs.roundTime === gs.hintSchedule[gs.nextHintIndex]
    ) {
      revealNextLetter(room);
      gs.nextHintIndex++;

      io.to(roomCode).emit("hint-update", {
        revealed: gs.revealed,
      });
    }

    if (gs.roundTime <= 0) endRound(roomCode);
  }, 1000);
}

function endRound(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;
  delete room.gameState.revealed;
  delete room.gameState.hintSchedule;
  delete room.gameState.nextHintIndex;
  clearInterval(room.timer);
  room.gameState.status = "result";
  io.to(roomCode).emit("game-update", {
    status: "result",
    word: room.gameState.word,
    scores: Object.values(room.users),
    round: room.gameState.currentRound,
    maxRounds: room.settings.rounds,
  });
  setTimeout(() => nextTurn(roomCode), 5000);
}

function endGame(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;
  clearInterval(room.timer);
  room.gameState.status = "game-over";
  io.to(roomCode).emit("game-update", {
    status: "game-over",
    scores: Object.values(room.users).sort((a, b) => b.score - a.score),
    round: room.gameState.currentRound,
    maxRounds: room.settings.rounds,
  });
  setTimeout(() => {
    if (rooms[roomCode]) {
      room.gameState.status = "lobby";
      room.gameState.currentRound = 1;
      room.gameState.drawersThisRound = [];
      Object.values(room.users).forEach((u) => (u.score = 0));
      io.to(roomCode).emit("game-update", {
        status: "lobby",
        settings: room.settings,
      });
      io.to(roomCode).emit("player-update", {
        users: Object.values(room.users),
        host: room.host,
      });
    }
  }, 8000);
}

// --- SOCKET HANDLERS ---
io.on("connection", (socket) => {
  // NEW: Manual Sync Request (Fixes the "Background Tab" issue)
  socket.on("request-state", () => {
    const code = socket.roomCode;
    if (!code || !rooms[code]) return;

    const room = rooms[code];

    socket.emit("player-update", {
      users: Object.values(room.users),
      host: room.host,
    });

    // ✅ LOBBY SHOULD NOT RESTORE GAME VIEW
    if (room.gameState.status === "lobby") {
      socket.emit("game-update", {
        status: "lobby",
        settings: room.settings,
      });
      return;
    }

    // Guard invalid drawer
    if (!room.users[room.gameState.drawer]) {
      socket.emit("game-update", { status: "waiting" });
      return;
    }
    if (
      room.gameState.status === "drawing" &&
      room.gameState.revealed &&
      socket.id !== room.gameState.drawer
    ) {
      socket.emit("hint-update", {
        revealed: room.gameState.revealed,
      });
    }
    socket.emit("game-update", {
      status: room.gameState.status,
      drawer: room.users[room.gameState.drawer]?.name,
      drawerId: room.gameState.drawer,
      round: room.gameState.currentRound,
      maxRounds: room.settings.rounds,
      time: room.gameState.roundTime,
    });

    if (
      room.gameState.status === "selecting" &&
      room.gameState.drawer === socket.id &&
      room.gameState.wordChoices
    ) {
      socket.emit("choose-word", room.gameState.wordChoices);
    }

    if (
      room.gameState.status === "drawing" &&
      room.gameState.drawer === socket.id
    ) {
      socket.emit("game-update", {
        status: "drawing",
        drawerId: socket.id,
        word: room.gameState.word,
        round: room.gameState.currentRound,
        maxRounds: room.settings.rounds,
      });
    }

    if (room.drawHistory.length > 0) {
      socket.emit("history", room.drawHistory);
    }
  });

  socket.on("create-room", ({ name }) => {
    const code = generateCode();
    rooms[code] = {
      host: socket.id,
      users: {},
      drawHistory: [],
      timer: null,
      settings: { rounds: 3, drawTime: 60, maxHints: 3 },
      gameState: {
        status: "lobby",
        currentRound: 1,
        drawersThisRound: [],
        guessed: [],
      },
    };
    joinRoom(socket, code, name);
  });

  socket.on("join-room", ({ code, name }) => {
    if (rooms[code]) joinRoom(socket, code, name);
    else socket.emit("error", "Room not found");
  });

  function joinRoom(socket, code, name) {
    socket.join(code);
    socket.roomCode = code;
    const room = rooms[code];
    room.users[socket.id] = {
      id: socket.id,
      name: name || `Player ${socket.id.substr(0, 4)}`,
      score: 0,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${socket.id}`,
    };
    // Explicitly tell everyone a new player list exists
    io.to(code).emit("player-update", {
      users: Object.values(room.users),
      host: room.host,
    });

    socket.emit("room-joined", {
      code,
      isHost: socket.id === room.host,
      settings: room.settings,
    });

    if (room.gameState.status !== "lobby") {
      socket.emit("game-update", {
        status: room.gameState.status,
        drawer: room.users[room.gameState.drawer]?.name,
        drawerId: room.gameState.drawer,
        time: room.gameState.roundTime,
        round: room.gameState.currentRound,
        maxRounds: room.settings.rounds,
      });
      socket.emit("history", room.drawHistory);
    }
  }

  socket.on("update-settings", ({ code, settings }) => {
    if (rooms[code] && socket.id === rooms[code].host) {
      rooms[code].settings = settings;
      io.to(code).emit("settings-update", settings);
    }
  });

  socket.on("start-game", ({ code }) => {
    if (rooms[code] && socket.id === rooms[code].host) nextTurn(code);
  });

  socket.on("draw", (data) => {
    const code = socket.roomCode;
    if (!code || !rooms[code]) return;

    data.type = "draw";
    rooms[code].drawHistory.push(data);

    socket.to(code).emit("draw", data);
  });

  socket.on("fill", (data) => {
    const code = socket.roomCode;
    if (!code || !rooms[code]) return;

    rooms[code].drawHistory.push({
      type: "fill",
      strokeId: data.strokeId,
      x: data.x,
      y: data.y,
      color: data.color,
      snapshot: data.snapshot, // 👈 critical
    });

    socket.to(code).emit("fill", data);
  });
  socket.on("clear", () => {
    const code = socket.roomCode;
    if (!code || !rooms[code]) return;
    const room = rooms[code];
    if (room.gameState.drawer !== socket.id) return;
    room.drawHistory = [];
    io.to(code).emit("clear");
  });

  socket.on("undo", () => {
    const code = socket.roomCode;
    if (!code || !rooms[code]) return;

    const room = rooms[code];
    if (room.gameState.drawer !== socket.id) return;
    if (room.drawHistory.length === 0) return;
    if (room.gameState.status !== "drawing") return;

    const last = room.drawHistory[room.drawHistory.length - 1];

    // If last was fill → restore snapshot
    if (last.type === "fill" && last.snapshot) {
      room.drawHistory.pop();

      io.to(code).emit("restore-snapshot", last.snapshot);
      return;
    }

    // Stroke undo
    const strokeId = last.strokeId;
    room.drawHistory = room.drawHistory.filter((x) => x.strokeId !== strokeId);

    io.to(code).emit("clear");
    io.to(code).emit("history", room.drawHistory);
  });

  socket.on("word-selected", (w) => {
    const code = socket.roomCode;
    if (!code || !rooms[code]) return;

    const room = rooms[code];

    if (
      room.gameState.status !== "selecting" ||
      room.gameState.drawer !== socket.id ||
      !room.gameState.wordChoices?.includes(w)
    ) {
      return;
    }

    startRound(code, w);
  });

  socket.on("chat", (msg) => {
    const code = socket.roomCode;
    const room = rooms[code];
    if (!room) return;
    const user = room.users[socket.id];

    if (
      room.gameState.status === "drawing" &&
      socket.id !== room.gameState.drawer &&
      !room.gameState.guessed.includes(socket.id)
    ) {
      if (msg.trim().toLowerCase() === room.gameState.word.toLowerCase()) {
        const points = Math.ceil(
          (room.gameState.roundTime / room.settings.drawTime) * 500
        );
        user.score += points;
        room.users[room.gameState.drawer].score += 50;
        room.gameState.guessed.push(socket.id);
        io.to(code).emit("chat", {
          player: user.name,
          msg: "Guessed the word!",
          type: "success",
        });
        io.to(code).emit("player-update", {
          users: Object.values(room.users),
          host: room.host,
        });
        if (room.gameState.guessed.length >= Object.keys(room.users).length - 1)
          endRound(code);
        return;
      }
    }
    io.to(code).emit("chat", { player: user.name, msg: msg, type: "text" });
  });

  // --- FIX 2: ROBUST DISCONNECT HANDLING ---
  socket.on("disconnect", () => {
    const code = socket.roomCode;
    if (!code || !rooms[code]) return;

    const room = rooms[code];
    const wasDrawer = room.gameState.drawer === socket.id;

    // Remove user
    delete room.users[socket.id];
    room.gameState.drawersThisRound = room.gameState.drawersThisRound.filter(
      (id) => id !== socket.id
    );

    room.gameState.guessed = room.gameState.guessed.filter(
      (id) => id !== socket.id
    );

    // If room empty → delete it
    if (Object.keys(room.users).length === 0) {
      clearInterval(room.timer);
      delete rooms[code];
      return;
    }

    // Reassign host if needed
    if (room.host === socket.id) {
      room.host = Object.keys(room.users)[0];
    }

    // 🔥 CRITICAL FIX: if drawer left, skip immediately
    if (wasDrawer && room.gameState.status !== "lobby") {
      clearInterval(room.timer);
      room.gameState.roundTime = null;
      room.gameState.word = null;
      room.gameState.guessed = [];
      setTimeout(() => nextTurn(code), 500);
    }

    // Update everyone
    io.to(code).emit("player-update", {
      users: Object.values(room.users),
      host: room.host,
    });

    io.to(code).emit("chat", {
      player: "System",
      msg: "A player left. Skipping turn if needed.",
      type: "text",
    });
  });
});

server.listen(3000, () => console.log("Server running on 3000"));
