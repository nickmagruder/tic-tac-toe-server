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
    console.log(data);
    let flag = false;
    for (let id in sockets) {
      if (sockets[id].userName === data.name) {
        flag = true;
        break;
      }
    }
    if (!flag) {
      sockets[client.id] = {
        userName: data.name,
      };
    }
    client.emit('userNameResponse', !flag);
  });
});

expressServer.listen(PORT);
console.log('Server listening on Port: ' + PORT);
