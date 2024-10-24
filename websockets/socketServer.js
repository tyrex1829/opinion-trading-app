import { WebSocket, WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws) => {
  console.log(`User connected`);

  ws.on("error", (error) => {
    console.error(`Error in ws-server: ${error}`);
  });

  ws.on("message", (message) => {
    console.log(`Recieved ${message}`);
    sendToEachUser(message.toString());
  });

  ws.on("close", () => {
    console.log("Connection Closed");
  });
});

function sendToEachUser(messageString) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(`msg: ${messageString}`);
    }
  });
}

console.log(`WebSocket server is running on ws://localhost:${8080}`);

export default wss;
