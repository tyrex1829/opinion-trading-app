import { WebSocket, WebSocketServer } from "ws";
import client from "../queue/redisClient";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws) => {
  console.log(`User connected`);

  ws.on("error", (error) => {
    console.error(`Error in ws-server: ${error}`);
  });

  ws.on("message", (message) => {
    console.log(`Recieved: ${message}`);
  });

  ws.on("close", () => {
    console.log("User disconnected");
  });
});

function sendToEachUser(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(`msg: ${message}`);
    }
  });
}

async function getCompletedTasks() {
  while (true) {
    const taskData = await client.brPop("completed tasks queues", 0);
    if (taskData) {
      const completedTask = JSON.parse(taskData.element);
      sendToEachUser(taskData);
    }
  }
}

getCompletedTasks();

console.log(`WebSocket server is running on ws://localhost:${8080}`);

export default wss;
