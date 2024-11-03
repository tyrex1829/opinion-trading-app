import express from "express";
import env from "dotenv";

import { v4 as uuidv4 } from "uuidv4";

const app = express();
env.config();
const port = process.env.PORT || 3000;

app.use(express.json());

const handlePubSubWithTimeout = (uuid, timeoutMs) => {
  return new Promise((resolve, reject) => {
    const channel = `response.${uuid}`;

    const timeout = setTimeout(() => {
      subscriber.unsubscribe(channel);
      reject(new Error("Response timed out"));
    }, timeoutMs);

    subscriber.subscribe(channel, (data) => {
      clearTimeout(timeout);
      subscriber.unsubscribe(channel);
      resolve(data);
    });
  });
};

const sendResponse = (res, payload) => {
  try {
    const { error, ...data } = JSON.parse(payload);
    if (error) {
      res.status(404).json(data);
    } else {
      res.status(200).json(data);
    }
  } catch (err) {
    res.status(500).json({ error: "Invalid response from server" });
  }
};

// try {
//   await clientStart();
//   console.log("Redis server is running in api...");
// } catch (error) {
//   console.error("Failed to connected with redis client");
//   process.exit(1);
// }

app.get("/", (req, res) => {
  console.log("Landing page");
  res.json({
    message: `Landing Page`,
  });
});

// End-Points
app.post("/user/create/:userId", async (req, res) => {
  const userId = req.params.userId;
  const uuid = uuidv4();

  const task = {
    type: "createUser",
    payload: userId,
    uuid: uuid,
  };

  try {
    const pubSubPromise = handlePubSubWithTimeout(uuid, 5000);

    await redisClient.rPush(taskQueue, JSON.stringify(task));

    const response = await pubSubPromise;

    sendResponse(res, response);
  } catch (error) {
    return res.status(500).json({
      error,
    });
  }
});

app.post("/symbol/create/:stockSymbol", async (req, res) => {
  const stockSymbol = req.params.stockSymbol;
  const uuid = uuidv4();

  const task = {
    type: "createUser",
    payload: userId,
    uuid: uuid,
  };

  try {
    const pubSubPromise = handlePubSubWithTimeout(uuid, 5000);

    await redisClient.rPush(taskQueue, JSON.stringify(task));

    const response = await pubSubPromise;

    sendResponse(res, response);
  } catch (error) {
    return res.status(500).json({
      error,
    });
  }
  // const userId = req.body.userId;

  // if (!userId) {
  //   return res.status(404).json({
  //     message: `Please provide userId.`,
  //   });
  // }

  // if (!STOCK_BALANCES[userId]) {
  //   return res.status(404).json({
  //     message: `${userId} does not exist, pls register this user id.`,
  //   });
  // }

  // if (STOCK_BALANCES[userId][stockSymbol]) {
  //   return res.status(400).json({
  //     message: `${userId} already has ${stockSymbol}.`,
  //   });
  // }

  // STOCK_BALANCES[userId][stockSymbol] = {
  //   yes: {
  //     quantity: 0,
  //     locked: 0,
  //   },
  //   no: {
  //     quantity: 0,
  //     locked: 0,
  //   },
  // };

  // res.status(200).json({
  //   message: `Successfully created ${stockSymbol} symbol for ${userId}`,
  //   updatedStockBalance: STOCK_BALANCES[userId],
  // });
});

app.get("/orderbook", async (req, res) => {
  const uuid = uuidv4();

  const task = {
    type: "viewOrderbook",
    payload: {},
    uuid: uuid,
  };

  try {
    const pubSubPromise = handlePubSubWithTimeout(uuid, 5000);

    await redisClient.rPush(taskQueue, JSON.stringify(task));

    const response = await pubSubPromise;

    sendResponse(res, response);
  } catch (error) {
    res.status(500).json({
      error,
    });
  }
});

app.get("/balances/inr", async (req, res) => {
  const uuid = uuidv4();

  const task = {
    type: "getBalance",
    payload: {},
    uuid,
  };

  try {
    const pubSubPromise = handlePubSubWithTimeout(uuid, 5000);

    await redisClient.rPush(taskQueue, JSON.stringify(task));

    const response = await pubSubPromise;

    sendResponse(res, response);
  } catch (error) {
    return res.status(500).json({
      error,
    });
  }
});

app.get("/balances/stock", async (req, res) => {
  const uuid = uuidv4();

  const task = {
    type: "getStockBalance",
    payload: {},
    uuid,
  };

  try {
    const pubSubPromise = handlePubSubWithTimeout(uuid, 5000);

    await redisClient.rPush(taskQueue, JSON.stringify(task));

    const response = await pubSubPromise;

    sendResponse(res, response);
  } catch (error) {
    return res.status(500).json({
      error,
    });
  }
});

app.post("/reset", async (req, res) => {
  const uuid = uuidv4();

  const task = {
    type: "resetVariables",
    payload: {},
    uuid,
  };

  try {
    const pubSubPromise = handlePubSubWithTimeout(uuid, 5000);

    await redisClient.rPush(taskQueue, JSON.stringify(task));

    const response = await pubSubPromise;

    sendResponse(res, response);
  } catch (error) {
    return res.status(500).json({
      error,
    });
  }
});

// Functionality
app.get("/balance/inr/:userId", async (req, res) => {
  const userId = req.params.userId;
  const uuid = uuidv4();

  const task = {
    type: "getBalanceOfParticularUser",
    payload: userId,
    uuid,
  };

  try {
    const pubSubPromise = handlePubSubWithTimeout(uuid, 5000);

    await redisClient.rPush(taskQueue, JSON.stringify(task));

    const response = await pubSubPromise;

    sendResponse(res, response);
  } catch (error) {
    return res.status(500).json({
      error,
    });
  }
});

app.post("/onramp/inr", async (req, res) => {
  const { userId, amount } = req.body;
  const uuid = uuidv4();

  const task = {
    type: "addMoneyToParticularUser",
    payload: {
      userId,
      amount,
    },
    uuid,
  };

  try {
    const pubSubPromise = handlePubSubWithTimeout(uuid, 5000);

    await redisClient.rPush(taskQueue, JSON.stringify(task));

    const response = await pubSubPromise;

    sendResponse(res, response);
  } catch (error) {
    return res.status(500).json({
      error,
    });
  }
});

app.get("/balance/stock/:userId", async (req, res) => {
  const userId = req.params.userId;
  const uuid = uuidv4();

  const task = {
    type: "getStockBalanceOfParticularUser",
    payload: userId,
    uuid,
  };

  try {
    const pubSubPromise = handlePubSubWithTimeout(uuid, 5000);

    await redisClient.rPush(taskQueue, JSON.stringify(task));

    const response = await pubSubPromise;

    sendResponse(res, response);
  } catch (error) {
    return res.status(500).json({
      error,
    });
  }
});

app.post("/order/buy", async (req, res) => {
  const { userId, stockSymbol, quantity, price, stockType } = req.body;
  const uuid = uuidv4();

  const task = {
    type: "orderBuy",
    payload: {
      userId,
      stockSymbol,
      quantity,
      price,
      stockType,
    },
    uuid,
  };

  try {
    const pubSubPromise = handlePubSubWithTimeout(uuid, 5000);

    await redisClient.rPush(taskQueue, JSON.stringify(task));

    const response = await pubSubPromise;

    sendResponse(res, response);
  } catch (error) {
    return res.status(500).json({
      error,
    });
  }
});

app.post("/order/sell", async (req, res) => {
  const { userId, stockSymbol, quantity, price, stockType } = req.body;

  const uuid = uuidv4();

  const task = {
    type: "orderSell",
    payload: {
      userId,
      stockSymbol,
      quantity,
      price,
      stockType,
    },
    uuid,
  };

  try {
    const pubSubPromise = handlePubSubWithTimeout(uuid, 5000);

    await redisClient.rPush(taskQueue, JSON.stringify(task));

    const response = await pubSubPromise;

    sendResponse(res, response);
  } catch (error) {
    return res.status(500).json({
      error,
    });
  }
});

app.get("/orderbook/:stockSymbol", async (req, res) => {
  const stockSymbol = req.params.stockSymbol;
  const uuid = uuidv4();

  const task = {
    type: "getOrderbookOfParticularSymbol",
    payload: stockSymbol,
    uuid,
  };

  try {
    const pubSubPromise = handlePubSubWithTimeout(uuid, 5000);

    await redisClient.rPush(taskQueue, JSON.stringify(task));

    const response = await pubSubPromise;

    sendResponse(res, response);
  } catch (error) {
    return res.status(500).json({
      error,
    });
  }
});

app.post("/trade/mint", async (req, res) => {
  const { userId, stockSymbol, quantity, stockType } = req.body;
  const uuid = uuidv4();

  const task = {
    type: "mintTokens",
    payload: {
      userId,
      stockSymbol,
      quantity,
      stockType,
    },
    uuid,
  };

  try {
    const pubSubPromise = handlePubSubWithTimeout(uuid, 5000);

    await redisClient.rPush(taskQueue, JSON.stringify(task));

    const response = await pubSubPromise;

    sendResponse(res, response);
  } catch (error) {
    return res.status(500).json({
      error,
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
