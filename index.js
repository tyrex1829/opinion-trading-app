import express from "express";
import env from "dotenv";
import { INR_BALANCES, ORDERBOOK, STOCK_BALANCES } from "./models/state.js";
import {
  initializeStockBalances,
  initializeOrderBook,
} from "./utils/stateHelper.js";
import fulfillOrder from "./services/fullFillOrder.js";
import { clientStart, pushToTaskQueue } from "./queue/redisClient.js";
import { uuid, v4 as uuidv4 } from "uuidv4";

const app = express();
env.config();
const port = process.env.PORT || 3000;

app.use(express.json());

try {
  await clientStart();
  console.log("Redis server is running in api...");
} catch (error) {
  console.error("Failed to connected with redis client");
  process.exit(1);
}

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

    await pushToTaskQueue(task);

    const response = await pubSubPromise;

    return res.status(201).json({
      //
    });
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

    await pushToTaskQueue(task);

    const response = await pubSubPromise;

    return res.status(201).json({
      //
    });
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

    await pushToTaskQueue(task);

    const response = await pubSubPromise;

    res.status(200).json({
      // got data from pub sub
    });
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

    await pushToTaskQueue(task);

    const response = await pubSubPromise;

    return res.status(200).json({
      // data from pub-sub
    });
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

    await pushToTaskQueue(task);

    const response = await pubSubPromise;

    return res.status(200).json({
      // data from pub-sub
    });
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

    await pushToTaskQueue(task);

    const response = await pubSubPromise;

    return res.status(200).json({
      // data from pub-sub
    });
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

    await pushToTaskQueue(task);

    const response = await pubSubPromise;

    return res.status(200).json({
      // pub-sub -> data
    });
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

    await pushToTaskQueue(task);

    const response = await pubSubPromise;

    return res.status(200).json({
      // pub-sub -> data
    });
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

    await pushToTaskQueue(task);

    const response = await pubSubPromise;

    return res.status(200).json({
      // pub-sub -> data
    });
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

    await pushToTaskQueue(task);

    const response = await pubSubPromise;

    return res.status(200).json({
      // pub-sub -> data
    });
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

    await pushToTaskQueue(task);

    const response = await pubSubPromise;

    return res.status(200).json({
      // pub-sub -> data
    });
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

    await pushToTaskQueue;

    const response = await pubSubPromise;

    return res.status(200).json({
      // pub-sub -> data
    });
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

    await pushToTaskQueue;

    const response = await pubSubPromise;

    return res.status(200).json({
      // pub-sub -> data
    });
  } catch (error) {
    return res.status(500).json({
      error,
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
