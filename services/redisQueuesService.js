import client from "../queue/redisClient.js";

export const addToOrderQueue = async (orderData) => {
  await client.lPush("orderQueue", JSON.stringify(orderData));
};

export const addToCompletedQueue = async (resultData) => {
  await client.lPush("completedTasksQueue", JSON.stringify(resultData));
};
