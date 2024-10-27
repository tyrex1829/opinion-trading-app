import { createClient } from "redis";

const client = createClient();

const clientStart = async () => {
  try {
    if (!client.isOpen) {
      await client.connect();
      console.log("Connecting to redis...");
    }
  } catch (error) {
    console.error("Error connecting to redis: " + error);
  }
};

const ensureConnected = async () => {
  if (!client.isOpen) {
    await clientStart();
  }
};

const pushToTaskQueue = async (task) => {
  try {
    await ensureConnected();
    await client.rPush("taskQueue", JSON.stringify(task));
    console.log(`Successfully pushed to task queue: ${JSON.stringify(task)}`);
  } catch (error) {
    console.error(`Error while pushing to task queue: ${error}`);
  }
};

const popFromTaskQueue = async (cb) => {
  try {
    await ensureConnected();
    while (true) {
      console.log(`Waiting for task in task-queue...`);
      const taskData = await client.blPop("taskQueue", 0);
      console.log(`blPOP response: ${JSON.stringify(taskData, null, 2)}`);

      if (taskData && taskData.key && taskData.element) {
        const task = taskData.element;
        try {
          console.log(`Queue name: ${taskData.key}, task: ${task}`);
          const parsedTask = JSON.parse(task);
          console.log(
            `Parsed task from task-queue: ${JSON.stringify(
              parsedTask,
              null,
              2
            )}`
          );
          await cb(parsedTask);
        } catch (error) {
          console.error(`Error parsing the task from in task-queue`);
        }
      } else {
        console.log(
          `No valid task-data returned from blPop, taskData: ${JSON.stringify(
            task,
            null,
            2
          )}`
        );
      }
    }
  } catch (error) {
    console.error(`Error while getting the task: ${error}`);
  }
};

const pushToDoneTaskQueue = async (doneTask) => {
  try {
    await ensureConnected();
    await client.lPush("doneTaskQueue", JSON.stringify(task));
    console.log(
      `Successfully pushed to done task queue: ${JSON.stringify(doneTask)}`
    );
  } catch (error) {
    console.error(`Error while pushing to task queue: ${error}`);
  }
};

const popFromDoneTaskQueue = async (cb) => {
  try {
    await ensureConnected();
    while (true) {
      console.log(`Waiting for task in done-task-queue...`);
      const taskData = await client.brPop("doneTaskQueue", 0);
      console.log(`blPOP response: ${JSON.stringify(taskData, null, 2)}`);

      if (taskData && taskData.key && taskData.element) {
        task = taskData.element;
        try {
          console.log(`Queue name: ${taskData.key}, job: ${task}`);
          const parsedTask = JSON.parse(task);
          await cb(parsedTask);
        } catch (error) {
          console.error(
            `Error parsing the task from done-task-queue: ${error}`
          );
        }
      } else {
        console.log(
          `No valid task data returned from blPOP, taskData: ${JSON.stringify(
            taskData,
            null,
            2
          )}`
        );
      }
    }
  } catch (error) {
    console.error(`Error while getting the task: ${error}`);
  }
};

client.on("error", (err) => {
  console.log("Redis client error: " + err);
});

export default {
  client,
  clientStart,
  pushToTaskQueue,
  popFromTaskQueue,
  pushToDoneTaskQueue,
  popFromDoneTaskQueue,
};
