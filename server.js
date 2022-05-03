import { Server } from "socket.io";

const io = new Server(3000);

io.on("connection", (socket) => {
  socket.emit("hello from server", 1, "2", { 3: Buffer.from([4]) });

  socket.on("hello from client", (...args) => {
    // ...
  });
});