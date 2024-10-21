function fulfillOrder(
  userId,
  stockSymbol,
  quantity,
  price,
  stockType,
  isBuyOrder
) {
  let remainingQuantity = quantity; // How much quantity is still left to fulfill.

  // Determine the opposite type for matching (buy -> match sell, sell -> match buy).
  const oppositeType = stockType === "yes" ? "no" : "yes";

  // Get all price levels for the opposite orders (for matching).
  const matchingOrders = Object.keys(ORDERBOOK[stockSymbol][oppositeType])
    .map(Number) // Convert keys (prices) to numbers.
    .sort(isBuyOrder ? (a, b) => a - b : (a, b) => b - a); // Sort based on buy/sell order type.

  // Loop through the matching price levels.
  for (let matchingPrice of matchingOrders) {
    if (isBuyOrder && matchingPrice > price) break; // For buy, stop if price is too high.
    if (!isBuyOrder && matchingPrice < price) break; // For sell, stop if price is too low.
    if (remainingQuantity <= 0) break; // If no more quantity to fulfill, stop.

    const matchingLevel = ORDERBOOK[stockSymbol][oppositeType][matchingPrice]; // Get sell/buy orders at this price level.

    // Determine how much of the order can be fulfilled at this price level.
    const fulfillableQuantity = Math.min(
      remainingQuantity,
      matchingLevel.total
    );

    remainingQuantity -= fulfillableQuantity; // Update the remaining quantity to fulfill.
    matchingLevel.total -= fulfillableQuantity; // Reduce the available quantity at this price level.

    // Fulfill the orders for each opposite user at this price level.
    for (let oppositeUserId in matchingLevel.orders) {
      const matchedOrderQuantity = Math.min(
        matchingLevel.orders[oppositeUserId],
        fulfillableQuantity
      );

      if (matchedOrderQuantity > 0) {
        // Update the stock balances and INR balances for the opposite user.
        STOCK_BALANCES[oppositeUserId][stockSymbol][oppositeType].quantity -=
          matchedOrderQuantity;
        INR_BALANCES[oppositeUserId].balance +=
          matchedOrderQuantity * matchingPrice;
        INR_BALANCES[oppositeUserId].locked -=
          matchedOrderQuantity * matchingPrice;

        fulfillableQuantity -= matchedOrderQuantity; // Update how much more can be fulfilled.
        matchingLevel.orders[oppositeUserId] -= matchedOrderQuantity; // Reduce this user's order quantity.

        // If this user's order is fully fulfilled, remove it from the order book.
        if (matchingLevel.orders[oppositeUserId] <= 0) {
          delete matchingLevel.orders[oppositeUserId];
        }

        if (fulfillableQuantity <= 0) break; // Stop if no more to fulfill.
      }
    }

    // If this price level is fully fulfilled, remove it from the order book.
    if (matchingLevel.total <= 0) {
      delete ORDERBOOK[stockSymbol][oppositeType][matchingPrice];
    }
  }

  return remainingQuantity; // Return any quantity that couldn't be fulfilled.
}
