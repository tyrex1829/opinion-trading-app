import express from "express";
import env from "dotenv";
import { INR_BALANCES, ORDERBOOK, STOCK_BALANCES } from "./state.js";

const app = express();
env.config();
const port = process.env.PORT || 3000;

console.log(port);
console.log(INR_BALANCES, ORDERBOOK, STOCK_BALANCES);

app.use(express.json());

app.get("/", (req, res) => {
  console.log("Landing page");
});

// End-Points
app.post("/user/create/:userId", (req, res) => {
  const userId = req.params.userId;

  if (INR_BALANCES[userId]) {
    return res.status(403).json({
      message: "User Already exists",
    });
  }

  INR_BALANCES[userId] = {
    balance: 0,
    locked: 0,
  };

  console.log(INR_BALANCES);

  return res.status(200).json({
    message: `Successfully created a user of id: ${userId}`,
    INR_BALANCES,
  });
});

app.post("/user/create/:stockSymbol", (req, res) => {
  const stockSymbol = req.params.stockSymbol;

  if (ORDERBOOK[stockSymbol]) {
    return res.status(403).json({
      message: `Symbol ${stockSymbol} already exists`,
    });
  }

  ORDERBOOK[stockSymbol] = {
    yes: {},
    no: {},
  };

  res.status(200).json({
    message: `Successfully created ${stockSymbol} symbol`,
    ORDERBOOK,
  });
});

app.get("/orderbook", (req, res) => {
  return res.status(200).json({
    ORDERBOOK,
  });
});

app.get("/balance/inr", (req, res) => {
  return res.status(200).json({
    INR_BALANCES,
  });
});

app.get("/balances/stock", (req, res) => {
  return res.status(200).json({
    STOCK_BALANCES,
  });
});

// Functionality
app.get("/balance/inr/:userId", (req, res) => {
  const userId = req.params.userId;

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

app.post("/onramp/inr", (req, res) => {
  const { userId, amount } = req.body;

  if (!INR_BALANCES[userId]) {
    return res.status(404).json({
      message: `${userId} not found`,
    });
  }

  //   check if correct typeof amount sent
  INR_BALANCES[userId].balance += amount;

  res.json({
    INR_BALANCES,
  });
});

app.get("/balance/stock/:userId", (req, res) => {
  const userId = req.params.userId;

  if (!STOCK_BALANCES[userId]) {
    return res.status(404).json({
      message: `${userId} not found`,
    });
  }

  const balanceStockOfUser = STOCK_BALANCES[userId].BTC_USDT_10_Oct_2024_9_30;

  return res.status(200).json({
    balanceStockOfUser,
  });
});

app.post("/order/buy", (req, res) => {
  const { userId, stockSymbol, quantity, price, stockType } = req.body;

  if (!userId || !stockSymbol || !quantity || !price) {
    return res.status(404).json({
      message: `Missing required field`,
    });
  }

  if (!ORDERBOOK[stockSymbol]) {
    return res.status(404).json({
      message: `Stock not available in orderbook`,
    });
  }

  if (!ORDERBOOK[stockSymbol].stockType[price]) {
    ORDERBOOK[stockSymbol].stockType[price] = {
      total: 0,
      orders: {},
    };
  }

  const levelOfPrice = ORDERBOOK[stockSymbol].stockType[price];

  if (levelOfPrice.orders[userId]) {
    levelOfPrice.orders[userId] += quantity;
  } else {
    levelOfPrice.orders[userId] = quantity;
  }

  levelOfPrice.total += quantity;

  return res.status(200).json({
    message: `Successfully placed buy order for ${quantity} of ${stockType} at price ${price} for ${stockSymbol}`,
    updatedOrderBook: ORDERBOOK[stockSymbol].stockType,
  });
});

app.post("/order/sell", (req, res) => {
  const { userId, stockSymbol, quantity, price, stockType } = req.body;

  if (!userId || !stockSymbol || !quantity || !price) {
    return res.status(404).json({
      message: `Missing required field`,
    });
  }

  if (!ORDERBOOK[stockSymbol]) {
    return res.status(404).json({
      message: `Stock not available in orderbook`,
    });
  }

  if (!ORDERBOOK[stockSymbol].stockType[price]) {
    return res.status(404).json({
      message: `No ${stockType} orders found at price ${price} for stock ${stockSymbol}`,
    });
  }

  const levelOfPrice = ORDERBOOK[stockSymbol].stockType[price];

  if (!levelOfPrice.orders[userId] || levelOfPrice.orders[userId]) {
  }
});

app.post("/order/buy", (req, res) => {});

app.post("/order/sell", (req, res) => {});

app.get("/orderbook/:stockSymbol", (req, res) => {
  const stockSymbol = req.params.stockSymbol;
});

app.post("/trade/mint", (req, res) => {});

app.post;

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
