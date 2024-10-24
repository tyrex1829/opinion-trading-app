import { INR_BALANCES, ORDERBOOK, STOCK_BALANCES } from "../models/state.js";
import { initializeStockBalances } from "../utils/stateHelper.js";

export default function fulfillOrder(
  userId,
  stockSymbol,
  quantity,
  price,
  stockType,
  isBuyOrder
) {
  let remainingQuantity = quantity;
  const oppositeType = stockType === "yes" ? "no" : "yes";

  for (let existingPrice in ORDERBOOK[stockSymbol][oppositeType]) {
    existingPrice = parseFloat(existingPrice);

    if (
      (isBuyOrder && existingPrice > price) ||
      (!isBuyOrder && existingPrice < price)
    ) {
      continue;
    }

    const existingOrders = ORDERBOOK[stockSymbol][oppositeType][existingPrice];

    for (let existingUserId in existingOrders.orders) {
      if (remainingQuantity <= 0) break;

      if (existingUserId === userId) continue;

      const availableQuantity = existingOrders.orders[existingUserId];
      const quantityToMatch = Math.min(availableQuantity, remainingQuantity);
      const matchCost = quantityToMatch * existingPrice;

      INR_BALANCES[existingUserId].locked -= matchCost;
      INR_BALANCES[existingUserId].balance += matchCost;

      initializeStockBalances(userId, stockSymbol, stockType);
      initializeStockBalances(existingUserId, stockSymbol, oppositeType);

      STOCK_BALANCES[existingUserId][stockSymbol][oppositeType].quantity -=
        quantityToMatch;
      STOCK_BALANCES[userId][stockSymbol][stockType].quantity +=
        quantityToMatch;

      existingOrders.total -= quantityToMatch;
      existingOrders.orders[existingUserId] -= quantityToMatch;

      if (existingOrders.orders[existingUserId] <= 0) {
        delete existingOrders.orders[existingUserId];
      }

      remainingQuantity -= quantityToMatch;
    }

    if (existingOrders.total <= 0) {
      delete ORDERBOOK[stockSymbol][oppositeType][existingPrice];
    }

    if (remainingQuantity <= 0) break;
  }

  return remainingQuantity;
}
