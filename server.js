require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
import { Server } from 'socket.io';
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
app.use(cors());
const expressServer = createServer(app);
const PORT = process.env.PORT;
const io = new Server(expressServer, {
  cors: {
    origin: 'http://localhost:3000',
  },
});

let sockets = {};
let users = {};
let currentGames = {};

let board = {
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
};

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
  /*   console.log(
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    io.sockets.sockets,
    'io.sockets.sockets'
  ); */

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
  });

  client.on('getPlayers', (data) => {
    let response = [];
    for (const id in sockets) {
      if (id !== client.id && !sockets[id].is_playing) {
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
          1: '#',
          2: '#',
          3: '#',
          4: '#',
          5: '#',
          6: '#',
          7: '#',
          8: '#',
          9: '#',
        },
        status: 'ongoing',
        winner: null,
        winningCombo: [],
      };
      currentGames[game_ID][client.id] = {
        userName: sockets[client.id].userName,
        sign: 'x',
      };
      currentGames[game_ID][data.id] = {
        userName: sockets[data.id].userName,
        sign: 'o',
      };
      client.join(game_ID);
    }
    console.log('connectOpponent, client.id', client.id);
    client.emit('connectOpponent', {
      opponentID: client.id,
      gameId: sockets[client.id].gameID,
      gameData: currentGames[sockets[client.id].gameID],
    });
  });

  client.on('opponentConnected', (data) => {
    console.log('opponentConnected client.id', client.id);
    client.join(data.gameId);
    io.to(sockets[client.id].gameID).emit('gameStarted', {
      status: true,
      gameId: sockets[client.id].gameID,
      gameData: currentGames[sockets[client.id].gameID],
    });
  });
});

expressServer.listen(PORT);
console.log('Server listening on Port: ' + PORT);
