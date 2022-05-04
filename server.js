const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const expressServer = createServer(app);
const PORT = 3001;
const io = new Server(expressServer, {
  cors: {
    origin: '*',
  },
});

let sockets = {};
let users = {};

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
});

expressServer.listen(PORT);
console.log('Server listening on Port: ' + PORT);
