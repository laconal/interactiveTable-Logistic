// // server.js
// const { Server } = require("socket.io");
// const io = new Server(3001, { cors: { origin: "*" } });

// // Map<orderId, Map<socketId, username>>
// const openUsersPerOrder = new Map();

// function broadcastViewers(objectID) {
//   const userMap = openUsersPerOrder.get(objectID) || new Map();
//   const users = Array.from(userMap.values());
//   const count = users.length;
//   // only emit to clients that have joined this order's room
//   io.in(`order-${objectID}`).emit("viewer:update", { objectID, count, users });
// }

// io.on("connection", (socket) => {
//   // A client opens a dialog for a specific order:
//   socket.on("dialog:open", ({ objectID, username }) => {
//     socket.join(`order-${objectID}`);

//     if (!openUsersPerOrder.has(objectID)) {
//       openUsersPerOrder.set(objectID, new Map());
//     }
//     openUsersPerOrder.get(objectID).set(socket.id, username);

//     broadcastViewers(objectID);
//   });

//   // A client closes that dialog:
//   socket.on("dialog:close", ({ objectID }) => {
//     socket.leave(`order-${objectID}`);
//     const userMap = openUsersPerOrder.get(objectID);
//     if (userMap) {
//       userMap.delete(socket.id);
//       if (userMap.size === 0) openUsersPerOrder.delete(objectID);
//     }
//     broadcastViewers(objectID);
//   });

//   // Clean up if they just disconnect:
//   socket.on("disconnect", () => {
//     for (const [objectID, userMap] of openUsersPerOrder.entries()) {
//       if (userMap.delete(socket.id)) {
//         if (userMap.size === 0) openUsersPerOrder.delete(objectID);
//         broadcastViewers(objectID);
//       }
//     }
//   });
// });

// console.log("🔌 Socket.IO server running on port 3001");


// server.js
const { createServer } = require("http");
const { Server } = require("socket.io");

// 1) Create a plain Node HTTP server:
const httpServer = createServer();

// 2) Attach Socket.IO to it, with your CORS settings:
const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
});

// 3) Your existing logic...
const openUsersPerOrder = new Map();

function broadcastViewers(objectID) {
  const userMap = openUsersPerOrder.get(objectID) || new Map();
  const users = Array.from(userMap.values());
  const count = users.length;
  io.in(`order-${objectID}`)
    .emit("viewer:update", { objectID, count, users });
}

io.on("connection", (socket) => {
  socket.on("dialog:open", ({ objectID, username }) => {
    socket.join(`order-${objectID}`);
    if (!openUsersPerOrder.has(objectID)) {
      openUsersPerOrder.set(objectID, new Map());
    }
    openUsersPerOrder.get(objectID).set(socket.id, username);
    broadcastViewers(objectID);
  });

  socket.on("dialog:close", ({ objectID }) => {
    socket.leave(`order-${objectID}`);
    const userMap = openUsersPerOrder.get(objectID);
    if (userMap) {
      userMap.delete(socket.id);
      if (userMap.size === 0) openUsersPerOrder.delete(objectID);
    }
    broadcastViewers(objectID);
  });

  socket.on("disconnect", () => {
    for (const [objectID, userMap] of openUsersPerOrder.entries()) {
      if (userMap.delete(socket.id)) {
        if (userMap.size === 0) openUsersPerOrder.delete(objectID);
        broadcastViewers(objectID);
      }
    }
  });
});

// 4) Tell the HTTP server to listen on 0.0.0.0:3001
httpServer.listen(3001, "0.0.0.0", () => {
  console.log("🔌 Socket.IO server running on 0.0.0.0:3001");
});
