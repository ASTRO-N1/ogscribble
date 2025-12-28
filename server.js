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
const WORDS = [
  "Apple",
  "Banana",
  "Cat",
  "Dog",
  "Elephant",
  "Fish",
  "Guitar",
  "House",
  "Ice Cream",
  "Jellyfish",
  "Kite",
  "Lion",
  "Moon",
  "Nest",
  "Orange",
  "Pizza",
  "Queen",
  "Rabbit",
  "Sun",
  "Tree",
  "Umbrella",
  "Violin",
  "Watermelon",
  "Xylophone",
  "Yacht",
  "Zebra",
  "Airplane",
  "Book",
  "Car",
  "Drum",
  "Egg",
  "Flower",
  "Ghost",
  "Hat",
  "Igloo",
  "Jacket",
  "Key",
  "Lamp",
  "Mushroom",
  "Nose",
  "Owl",
  "Pencil",
  "Robot",
  "Snake",
  "Train",
  "Whale",
];

const rooms = {};

// --- HELPERS ---
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
function getRandomWords(count) {
  return WORDS.sort(() => 0.5 - Math.random()).slice(0, count);
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

  io.to(roomCode).emit("clear");
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
    room.gameState.roundTime--;
    io.to(roomCode).emit("timer", room.gameState.roundTime);
    if (room.gameState.roundTime <= 0) endRound(roomCode);
  }, 1000);
}

function endRound(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;
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
      settings: { rounds: 3, drawTime: 60 },
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
    if (code && rooms[code]) {
      rooms[code].drawHistory.push(data);
      socket.to(code).emit("draw", data);
    }
  });

  socket.on("fill", (data) => {
    const code = socket.roomCode;
    if (code && rooms[code]) {
      data.type = "fill";
      rooms[code].drawHistory.push(data);
      socket.to(code).emit("fill", data);
    }
  });

  socket.on("sync-board", (imgData) => {
    const code = socket.roomCode;
    if (code) socket.to(code).emit("sync-board", imgData);
  });

  socket.on("clear", () => {
    const code = socket.roomCode;
    if (code) {
      rooms[code].drawHistory = [];
      io.to(code).emit("clear");
    }
  });

  socket.on("undo", () => {
    const code = socket.roomCode;
    if (!code || !rooms[code]) return;

    const room = rooms[code];

    // Only drawer can undo
    if (room.gameState.drawer !== socket.id) return;

    // Remove last drawing action
    room.drawHistory.pop();

    // Clear board and resend history
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
