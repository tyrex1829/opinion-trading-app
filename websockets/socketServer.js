import { WebSocket, WebSocketServer } from "ws";
import {
  client,
  clientStart,
  popFromDoneTaskQueue,
} from "../queue/redisQueue.js";
import { v4 as uuidv4 } from "uuidv4";

const mpp = new Map();

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws) => {
  const clientId = uuidv4();
  mpp.set(clientId, ws);
  ws.clientId = clientId;

  console.log(`User connected: ${clientId}`);

  ws.on("error", (error) => {
    console.error(`Error in ws-server: ${error}`);
  });

  ws.on("message", (message) => {
    console.log(`Recieved: ${message}`);
  });

  ws.on("close", () => {
    console.log("User disconnected");
    mpp.delete(clientId);
  });
});

function sendToEachUser(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      console.log(`Sending message to client: ${JSON.stringify(message)}`);
      client.send(`msg: ${JSON.stringify(message)}`);
    }
  });
}

await clientStart().catch((error) => {
  console.error(`Failed to connect to redis in websocket-server: ${error}`);
  process.exit(1);
});
console.log(`Redis server running in websocket-server...`);

async function getCompletedTasks() {
  pubsub.subscribe("sentToWebSocket-server", (message) => {
    const data = message;
    console.log(data);
    sendToEachUser(data);
  });
}

getCompletedTasks();

console.log(`WebSocket server is running on ws://localhost:${8080}`);

export default wss;
