import {
  clientStart,
  popFromTaskQueue,
  pushToDoneTaskQueue,
} from "../queue/redisClient.js";

async function performTask(task) {
  const { type, payload, uuid } = task;
}

async function startEngine() {
  console.log(`Connecting to redis and starting engine...`);
  console.log(`Start engine`);

  await popFromTaskQueue(async (task) => {
    try {
      console.log(`Task fetched from taskQueue: ${JSON.stringify(task)}`);
      console.log();
      await performTask(task);
    } catch (error) {
      console.error(`Error in start-engine ${error.message}`);
    }
  });
}

await clientStart().catch((err) => {
  console.error(`Failed to connect to redis in engine: ${error}`);
  process.exit(1);
});

console.log(`Redis server running in engine...`);

startEngine();
