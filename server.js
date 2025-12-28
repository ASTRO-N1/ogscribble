const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  pingTimeout: 60000, // Keep connection alive longer
  pingInterval: 25000,
});

app.use(express.static("public"));

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

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
function getRandomWords(count) {
  return WORDS.sort(() => 0.5 - Math.random()).slice(0, count);
}

function nextTurn(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;
  const playerIds = Object.keys(room.users);

  let available = playerIds.filter(
    (id) => !room.gameState.drawersThisRound.includes(id)
  );
  if (available.length === 0) {
    room.gameState.currentRound++;
    room.gameState.drawersThisRound = [];
    available = playerIds;
    if (room.gameState.currentRound > room.settings.rounds)
      return endGame(roomCode);
  }

  const nextDrawerId = available[Math.floor(Math.random() * available.length)];
  room.gameState.drawer = nextDrawerId;
  room.gameState.drawersThisRound.push(nextDrawerId);

  room.gameState.status = "selecting";
  room.gameState.guessed = [];
  room.gameState.word = null;
  room.drawHistory = []; // Clear history

  io.to(roomCode).emit("clear");
  io.to(roomCode).emit("game-update", {
    status: "selecting",
    drawer: room.users[nextDrawerId].name,
    drawerId: nextDrawerId,
    round: room.gameState.currentRound,
    maxRounds: room.settings.rounds,
  });

  io.to(nextDrawerId).emit("choose-word", getRandomWords(3));
}

function startRound(roomCode, word) {
  const room = rooms[roomCode];
  if (!room) return;

  room.gameState.word = word;
  room.gameState.status = "drawing";
  room.gameState.roundTime = room.settings.drawTime;

  io.to(roomCode).emit("game-update", {
    status: "drawing",
    drawer: room.users[room.gameState.drawer].name,
    drawerId: room.gameState.drawer,
    time: room.gameState.roundTime,
  });

  io.to(room.gameState.drawer).emit("game-update", {
    status: "drawing",
    drawer: room.users[room.gameState.drawer].name,
    drawerId: room.gameState.drawer,
    word: word,
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

io.on("connection", (socket) => {
  // 1. CREATE ROOM
  socket.on("create-room", ({ name }) => {
    const code = generateCode();
    rooms[code] = {
      host: socket.id,
      users: {},
      drawHistory: [], // Only used for late joiners now
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

  // 2. JOIN ROOM
  socket.on("join-room", ({ code, name }) => {
    if (rooms[code]) joinRoom(socket, code, name);
    else socket.emit("error", "Room not found");
  });

  function joinRoom(socket, code, name) {
    socket.join(code);
    const room = rooms[code];
    room.users[socket.id] = {
      id: socket.id,
      name: name || `Player ${socket.id.substr(0, 4)}`,
      score: 0,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${socket.id}`,
    };
    socket.emit("room-joined", {
      code,
      isHost: socket.id === room.host,
      settings: room.settings,
    });
    io.to(code).emit("player-update", {
      users: Object.values(room.users),
      host: room.host,
    });

    // If joining mid-game, send current state
    if (room.gameState.status !== "lobby") {
      socket.emit("game-update", {
        status: room.gameState.status,
        drawer: room.users[room.gameState.drawer]?.name,
        drawerId: room.gameState.drawer,
        time: room.gameState.roundTime,
        round: room.gameState.currentRound,
        maxRounds: room.settings.rounds,
      });
      // Send history for initial load
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

  // --- DRAWING & SYNC ---
  socket.on("draw", (data) => {
    const code = getRoomCode(socket);
    if (code && rooms[code]) {
      rooms[code].drawHistory.push(data);
      socket.to(code).emit("draw", data);
    }
  });

  socket.on("fill", (data) => {
    const code = getRoomCode(socket);
    if (code && rooms[code]) {
      data.type = "fill";
      rooms[code].drawHistory.push(data);
      socket.to(code).emit("fill", data);
    }
  });

  // *** THE NUCLEAR SYNC FIX ***
  socket.on("sync-board", (imgData) => {
    const code = getRoomCode(socket);
    if (code) {
      // Broadcast the EXACT image of the drawer's screen to everyone
      socket.to(code).emit("sync-board", imgData);
    }
  });

  socket.on("clear", () => {
    const code = getRoomCode(socket);
    if (code) {
      rooms[code].drawHistory = [];
      io.to(code).emit("clear");
    }
  });

  socket.on("word-selected", (w) => startRound(getRoomCode(socket), w));

  socket.on("chat", (msg) => {
    const code = getRoomCode(socket);
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

  socket.on("disconnect", () => {
    const code = getRoomCode(socket);
    if (code && rooms[code]) {
      delete rooms[code].users[socket.id];
      if (Object.keys(rooms[code].users).length === 0) {
        delete rooms[code];
      } else {
        if (rooms[code].host === socket.id)
          rooms[code].host = Object.keys(rooms[code].users)[0];
        io.to(code).emit("player-update", {
          users: Object.values(rooms[code].users),
          host: rooms[code].host,
        });
      }
    }
  });
});

function getRoomCode(socket) {
  return Array.from(socket.rooms).find((r) => r.length === 6 && !isNaN(r));
}

server.listen(3000, () => console.log("OG Scribble Server running on 3000"));
