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

console.log(port);
console.log(INR_BALANCES, ORDERBOOK, STOCK_BALANCES);

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
    // pubsub -> promise
    await pushToTaskQueue(task);
    // pubsub -> subscribe
    return res.status(201).json({
      //got data from pubsub
    });
  } catch (error) {
    return res.status(403).json({
      error,
    });
  }

  if (INR_BALANCES[userId]) {
    if (!STOCK_BALANCES[userId]) {
      STOCK_BALANCES[userId] = {};
    }
    return res.status(403).json({
      message: "User Already exists",
    });
  }

  INR_BALANCES[userId] = {
    balance: 0,
    locked: 0,
  };

  STOCK_BALANCES[userId] = {};

  return res.status(200).json({
    message: `Successfully created a user of id: ${userId} in inr-balance as well as stock-balance variable`,
    INR_BALANCES,
  });
});

app.post("/symbol/create/:stockSymbol", (req, res) => {
  const stockSymbol = req.params.stockSymbol;
  const userId = req.body.userId;

  if (!userId) {
    return res.status(404).json({
      message: `Please provide userId.`,
    });
  }

  if (!STOCK_BALANCES[userId]) {
    return res.status(404).json({
      message: `${userId} does not exist, pls register this user id.`,
    });
  }

  if (STOCK_BALANCES[userId][stockSymbol]) {
    return res.status(400).json({
      message: `${userId} already has ${stockSymbol}.`,
    });
  }

  STOCK_BALANCES[userId][stockSymbol] = {
    yes: {
      quantity: 0,
      locked: 0,
    },
    no: {
      quantity: 0,
      locked: 0,
    },
  };

  res.status(200).json({
    message: `Successfully created ${stockSymbol} symbol for ${userId}`,
    updatedStockBalance: STOCK_BALANCES[userId],
  });
});

app.get("/orderbook", async (req, res) => {
  const uuid = uuidv4();
  const task = {
    type: "viewOrderbook",
    uuid: uuid,
  };
  try {
    // pub-sub -> promise
    await pushToTaskQueue(task);
    // subscribe -> pub-sub
    res.status(200).json({
      // got data from pub sub
    });
  } catch (error) {
    res.status(404).json({
      error,
    });
  }
  return res.status(200).json({
    ORDERBOOK,
  });
});

app.get("/balances/inr", async (req, res) => {
  const uuid = uuidv4();

  const task = {
    type: "getBalance",
    uuid,
  };

  try {
    // pub-sub -> promise
    await pushToTaskQueue(task);
    // pub-sub -> subscribe
    return res.status(200).json({
      // data from pub-sub
    });
  } catch (error) {
    return res.status(404).json({
      error,
    });
  }
  return res.status(200).json({
    INR_BALANCES,
  });
});

app.get("/balances/stock", async (req, res) => {
  const uuid = uuidv4();

  const task = {
    type: "getStockBalance",
    uuid,
  };

  try {
    // pub-sub -> promise
    await pushToTaskQueue(task);
    // pub-sub -> subscribe
    return res.status(200).json({
      // data from pub-sub
    });
  } catch (error) {
    return res.status(400).json({
      error,
    });
  }
  return res.status(200).json({
    STOCK_BALANCES,
  });
});

app.post("/reset", async (req, res) => {
  const uuid = uuidv4();

  const task = {
    type: "resetVariables",
    uuid,
  };

  try {
    // pub-sub -> promise
    await pushToTaskQueue(task);
    // pub-sub -> subscribe
    return res.status(200).json({
      // data from pub-sub
    });
  } catch (error) {
    return res.status(400).json({
      error,
    });
  }
  Object.keys(INR_BALANCES).forEach((key) => delete INR_BALANCES[key]);
  Object.keys(ORDERBOOK).forEach((key) => delete ORDERBOOK[key]);
  Object.keys(STOCK_BALANCES).forEach((key) => delete STOCK_BALANCES[key]);

  return res.status(200).json({
    message: `Reset data successfully.`,
    INR_BALANCES,
    ORDERBOOK,
    STOCK_BALANCES,
  });
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
    // pub-sub -> promise
    await pushToTaskQueue(task);
    // pub-sub -> subscribe
    return res.status(200).json({
      // pub-sub -> data
    });
  } catch (error) {
    return res.status(404).json({
      error,
    });
  }

  if (!INR_BALANCES[userId]) {
    return res.status(404).json({
      message: `${userId} not found`,
    });
  }

  const balanceOfReqUser = INR_BALANCES[userId].balance;

  res.json({
    balance: balanceOfReqUser,
  });
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
    // pub-sub -> promise
    await pushToTaskQueue(task);
    // pub-sub -> subscribe
    return res.status(200).json({
      // pub-sub -> data
    });
  } catch (error) {
    return res.status(404).json({
      error,
    });
  }

  if (typeof amount !== "number") {
    return res.status(403).json({
      message: `Amount can only be number.`,
    });
  }

  if (!INR_BALANCES[userId]) {
    return res.status(404).json({
      message: `${userId} not found`,
    });
  }

  INR_BALANCES[userId].balance += amount;

  res.json({
    INR_BALANCES,
  });
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
    // pub-sub -> promise
    await pushToTaskQueue(task);
    // pub-sub -> subscribe
    return res.status(200).json({
      // pub-sub -> data
    });
  } catch (error) {
    return res.status(404).json({
      error,
    });
  }

  if (!STOCK_BALANCES[userId]) {
    return res.status(404).json({
      message: `${userId} not found`,
    });
  }

  const balanceStockOfUser = STOCK_BALANCES[userId];

  return res.status(200).json({
    balanceStockOfUser,
  });
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
    // pub-sub -> promise
    await pushToTaskQueue(task);
    // pub-sub -> subscribe
    return res.status(200).json({
      // pub-sub -> data
    });
  } catch (error) {
    return res.status(400).json({
      error,
    });
  }

  if (
    !userId ||
    !stockSymbol ||
    !quantity ||
    quantity <= 0 ||
    !price ||
    (stockType !== "yes" && stockType !== "no")
  ) {
    return res.status(400).json({
      message: `Missing required field`,
    });
  }

  if (!INR_BALANCES[userId]) {
    return res.status(404).json({
      message: `${userId} is not available, please create the user first.`,
    });
  }

  const totalPrice = price * quantity;

  if (INR_BALANCES[userId].balance < totalPrice) {
    return res.status(403).json({
      message: `You don't have sufficient balance to place this order, kindly add the required amount first.`,
    });
  }

  initializeOrderBook(stockSymbol, stockType);

  let remainingQuantity = fulfillOrder(
    userId,
    stockSymbol,
    quantity,
    price,
    stockType,
    true
  );

  const fulfilledQuantity = quantity - remainingQuantity;
  INR_BALANCES[userId].balance -= fulfilledQuantity * price;
  INR_BALANCES[userId].locked += fulfilledQuantity * price;

  if (remainingQuantity > 0) {
    initializeOrderBook(stockSymbol, stockType, price);
    const levelOfPrice = ORDERBOOK[stockSymbol][stockType][price];

    if (levelOfPrice.orders[userId]) {
      levelOfPrice.orders[userId] += remainingQuantity;
    } else {
      levelOfPrice.orders[userId] = remainingQuantity;
    }

    levelOfPrice.total += remainingQuantity;

    INR_BALANCES[userId].balance -= remainingQuantity * price;
    INR_BALANCES[userId].locked += remainingQuantity * price;
  }

  return res.status(200).json({
    message: `Successfully placed buy order for ${quantity} of ${stockType} at price ${price} for ${stockSymbol}`,
    updatedOrderBook: ORDERBOOK[stockSymbol][stockType],
    userBalance: INR_BALANCES[userId],
    updatedStockBalance: STOCK_BALANCES[userId][stockSymbol],
  });
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
    // pub-sub -> promise
    await pushToTaskQueue(task);
    // pub-sub -> subscribe
    return res.status(200).json({
      // pub-sub -> data
    });
  } catch (error) {
    return res.status(404).json({
      error,
    });
  }

  if (
    !userId ||
    !stockSymbol ||
    !quantity ||
    quantity <= 0 ||
    !price ||
    (stockType !== "yes" && stockType !== "no")
  ) {
    return res.status(404).json({
      message: `Missing required field`,
    });
  }

  if (!STOCK_BALANCES[userId]) {
    return res.status(404).json({
      message: `${userId} is not registered, pls register this user first.`,
    });
  }

  if (!STOCK_BALANCES[userId][stockSymbol]) {
    return res.status(404).json({
      message: `${userId} does not own this stock-symbol, pls buy this stock-symbol first.`,
    });
  }

  if (!STOCK_BALANCES[userId][stockSymbol][stockType]) {
    return res.status(404).json({
      message: `${userId} does not own this stock-type, pls buy this stock-type first.`,
    });
  }

  if (STOCK_BALANCES[userId][stockSymbol][stockType].quantity < quantity) {
    return res.status(404).json({
      message: `${userId} does not own appropriate quantity of ${stockType} token of ${stockSymbol} to sell, pls sell accordingly.`,
    });
  }

  STOCK_BALANCES[userId][stockSymbol][stockType].quantity -= quantity;
  STOCK_BALANCES[userId][stockSymbol][stockType].locked += quantity;

  initializeOrderBook(stockSymbol, stockType);

  // if (!ORDERBOOK[stockSymbol]) {
  //   ORDERBOOK[stockSymbol] = {
  //     yes: {},
  //     no: {},
  //   };
  // }

  // if (!ORDERBOOK[stockSymbol][stockType]) {
  //   ORDERBOOK[stockSymbol][stockType] = {};
  // }

  let remainingQuantity = fulfillOrder(
    userId,
    stockSymbol,
    quantity,
    price,
    stockType,
    false
  );

  const fulfilledQuantity = quantity - remainingQuantity;
  STOCK_BALANCES[userId][stockSymbol][stockType].locked -= fulfilledQuantity;

  if (remainingQuantity > 0) {
    initializeOrderBook(stockSymbol, stockType, price);
    const levelOfPrice = ORDERBOOK[stockSymbol][stockType][price];

    if (levelOfPrice.orders[userId]) {
      levelOfPrice.orders[userId] += remainingQuantity;
    } else {
      levelOfPrice.orders[userId] = remainingQuantity;
    }

    levelOfPrice.total += remainingQuantity;
  }

  return res.status(200).json({
    message: `Successfully placed sell order for ${quantity} of ${stockType} at price ${price} for ${stockSymbol}`,
    userBalance: INR_BALANCES[userId],
    updatedOrderBook: ORDERBOOK[stockSymbol][stockType],
    updatedStockBalance: STOCK_BALANCES[userId][stockSymbol][stockType],
  });
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
    // pub-sub -> promise
    await pushToTaskQueue;
    // pub-sub -> subscribe
    return res.status(200).json({
      // pub-sub -> data
    });
  } catch (error) {
    return res.status(404).json({
      error,
    });
  }

  if (!ORDERBOOK[stockSymbol]) {
    return res.status(404).json({
      message: `${stockSymbol} is not found on orderbook, pls provide appropriate stock-symbol`,
    });
  }

  return res.status(200).json({
    OrderBook: ORDERBOOK[stockSymbol],
  });
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
    // pub-sub -> promise
    await pushToTaskQueue;
    // pub-sub -> subscribe
    return res.status(200).json({
      // pub-sub -> data
    });
  } catch (error) {
    return res.status(404).json({
      error,
    });
  }

  if (
    !userId ||
    !stockSymbol ||
    !quantity ||
    quantity <= 0 ||
    (stockType !== "yes" && stockType !== "no")
  ) {
    return res.status(404).json({
      message: `Please provide appropriate details.`,
    });
  }

  if (!STOCK_BALANCES[userId]) {
    return res.status(404).json({
      message: `${userId} not registered, pls register first.`,
    });
  }

  if (!STOCK_BALANCES[userId][stockSymbol]) {
    STOCK_BALANCES[userId][stockSymbol] = {
      yes: {
        quantity: 0,
        locked: 0,
      },
      no: {
        quantity: 0,
        locked: 0,
      },
    };
  }

  if (!STOCK_BALANCES[userId][stockSymbol][stockType]) {
    STOCK_BALANCES[userId][stockSymbol][stockType] = {
      quantity: 0,
      locked: 0,
    };
  }

  STOCK_BALANCES[userId][stockSymbol][stockType].quantity += quantity;

  return res.status(200).json({
    message: `Successfully minted ${quantity} of tokens for ${stockSymbol} to ${userId}`,
    updatedStockBalance: STOCK_BALANCES[userId][stockSymbol][stockType],
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
