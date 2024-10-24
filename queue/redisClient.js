import { createClient } from "redis";

const client = createClient();

const connectToRedis = async () => {
  try {
    await client.connect();
    console.log("Connecting to redis...");
  } catch (error) {
    console.error("Error connecting to redis: " + error);
  }
};

connectToRedis();

client.on("error", (err) => {
  console.log("Redis client error: " + err);
});

export default client;
