import { STOCK_BALANCES, ORDERBOOK, INR_BALANCES } from "../models/state.js";

export function initializeStockBalances(userId, stockSymbol, stockType) {
  STOCK_BALANCES[userId] = STOCK_BALANCES[userId] || {};
  STOCK_BALANCES[userId][stockSymbol] = STOCK_BALANCES[userId][stockSymbol] || {
    yes: { quantity: 0, locked: 0 },
    no: { quantity: 0, locked: 0 },
  };
  STOCK_BALANCES[userId][stockSymbol][stockType] = STOCK_BALANCES[userId][
    stockSymbol
  ][stockType] || { quantity: 0, locked: 0 };
}

export function initializeOrderBook(stockSymbol, stockType, price) {
  ORDERBOOK[stockSymbol] = ORDERBOOK[stockSymbol] || {
    yes: {},
    no: {},
  };
  ORDERBOOK[stockSymbol][stockType] = ORDERBOOK[stockSymbol][stockType] || {};
  if (price !== undefined) {
    ORDERBOOK[stockSymbol][stockType][price] = ORDERBOOK[stockSymbol][
      stockType
    ][price] || {
      total: 0,
      orders: {},
    };
  }
}
