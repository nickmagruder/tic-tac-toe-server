require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
app.use(cors());
const expressServer = createServer(app);
const PORT = process.env.PORT;
const io = new Server(expressServer, {
  cors: {
    origin: '*',
  },
});

let sockets = {};
let users = {};
let currentGames = {};

/* let board = {
  1: ' ',
  2: ' ',
  3: ' ',
  4: ' ',
  5: ' ',
  6: ' ',
  7: ' ',
  8: ' ',
  9: ' ',
};

let startingBoard = {
  1: '1',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
}; */

const winners = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  [1, 4, 7],
  [2, 5, 8],
  [3, 6, 9],
  [1, 5, 9],
  [3, 5, 7],
];

io.on('connection', (client) => {
  console.log(client.id + ' has connected');
  client.emit('connected', { id: client.id });

  client.on('checkUserName', (data) => {
    let boolean = false;
    for (let id in sockets) {
      if (sockets[id].userName === data.name) {
        boolean = true;
        break;
      }
    }
    if (!boolean) {
      sockets[client.id] = {
        userName: data.name,
        isPlaying: false,
        gameId: null,
      };
    }
    client.emit('userNameResponse', !boolean);
    console.log('current sockets:', sockets);
  });

  client.on('getPlayers', (data) => {
    let response = [];
    for (const id in sockets) {
      if (id !== client.id && !sockets[id].isPlaying) {
        response.push({
          id: id,
          name: sockets[id].userName,
        });
      }
    }
    client.emit('getResponse', response);
    client.broadcast.emit('newOpponent', {
      id: client.id,
      name: sockets[client.id].userName,
    });
  });

  client.on('selectPlayer', (data) => {
    let game_ID = uuidv4();
    if (!sockets[data.id].isPlaying) {
      sockets[data.id].isPlaying = true;
      sockets[client.id].isPlaying = true;
      sockets[data.id].gameID = game_ID;
      sockets[client.id].gameID = game_ID;

      currentGames[game_ID] = {
        player1: client.id,
        player2: data.id,
        currentTurn: client.id,
        playboard: {
          1: null,
          2: null,
          3: null,
          4: null,
          5: null,
          6: null,
          7: null,
          8: null,
          9: null,
        },
        status: 'ongoing',
        winner: null,
        winningCombo: [],
        message: null,
      };
      currentGames[game_ID][client.id] = {
        userName: sockets[client.id].userName,
        sign: 'x',
      };
      currentGames[game_ID][data.id] = {
        userName: sockets[data.id].userName,
        sign: 'o',
      };
      const opponentSocketId = data.id;
      const opponentSocket = sockets[opponentSocketId];
      io.to(opponentSocket).to(client.id).socketsJoin(game_ID);

      client.emit('gameStarted', {
        clientId: data.id,
        opponentID: client.id,
        status: true,
        gameId: sockets[client.id].gameID,
        gameData: currentGames[sockets[client.id].gameID],
      });

      client.broadcast.emit('gameStarted', {
        clientId: data.id,
        opponentID: client.id,
        status: true,
        gameId: sockets[client.id].gameID,
        gameData: currentGames[sockets[client.id].gameID],
      });
      client.broadcast.emit('excludePlayers', { one: client.id, two: data.id });
    }
  });
});

expressServer.listen(PORT);
console.log('Server listening on Port: ' + PORT);
