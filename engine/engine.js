import express, { response } from "express";
import { createClient } from "redis";

const app = express();

export const redisClient = createClient();
export const publisher = createClient();
export const requestQueue = "taskQueue";

let INR_BALANCES = {};
let ORDERBOOK = {};
let STOCK_BALANCES = {};

async function performTask(task) {
  const { type, payload, uuid } = task;

  if (type === "createUser") {
    const userId = payload;

    if (INR_BALANCES[userId]) {
      if (!STOCK_BALANCES[userId]) {
        STOCK_BALANCES[userId] = {};
      }
      await pubSub.publish(
        "createUserAdd",
        JSON.stringify({
          uuid,
          error: true,
          msg: `${userId} already exists`,
        })
      );
    }

    INR_BALANCES[userId] = {
      balance: 0,
      locked: 0,
    };

    STOCK_BALANCES[userId] = {};

    await pubSub.publish(
      "newUserAdd",
      JSON.stringify({
        uuid,
        error: false,
        msg: `${userId} successfully created`,
      })
    );
  } else if (type === "createStockSymbol") {
  } else if (type === "viewOrderbook") {
    await pubSub.publish(
      "allOrderbook",
      JSON.stringify({
        uuid,
        error: false,
        msg: JSON.stringify(ORDERBOOK),
      })
    );
  } else if (type === "getBalance") {
    await pubSub.publish(
      "allInrBalance",
      JSON.stringify({
        uuid,
        error: false,
        msg: JSON.stringify(INR_BALANCES),
      })
    );
  } else if (type === "getStockBalance") {
    await pubSub.publish(
      "allStockBalance",
      JSON.stringify({
        uuid,
        error: false,
        msg: JSON.stringify(STOCK_BALANCES),
      })
    );
  } else if (type === "resetVariables") {
    Object.keys(INR_BALANCES).forEach((key) => delete INR_BALANCES[key]);
    Object.keys(ORDERBOOK).forEach((key) => delete ORDERBOOK[key]);
    Object.keys(STOCK_BALANCES).forEach((key) => delete STOCK_BALANCES[key]);

    await pubSub.publish(
      "resetAllVariables",
      JSON.stringify({
        uuid,
        error: false,
        msg: `Successful reset: ${JSON.stringify(
          INR_BALANCES
        )}, ${JSON.stringify(ORDERBOOK)}, ${JSON.stringify(STOCK_BALANCES)}`,
      })
    );
  } else if (type === "getBalanceOfParticularUser") {
    const userId = payload;

    if (!INR_BALANCES[userId]) {
      await pubSub.publish(
        "userBalance",
        JSON.stringify({
          uuid,
          error: true,
          msg: `${userId} not found`,
        })
      );
    }

    const balanceOfReqUser = INR_BALANCES[userId].balance;
    await pubSub.publish(
      "userBalance",
      JSON.stringify({
        uuid,
        error: false,
        msg: `Balance of ${userId}: ${balanceOfReqUser}`,
      })
    );
  } else if (type === "addMoneyToParticularUser") {
    const { userId, amount } = payload;

    if (typeof amount !== "number") {
      await pubSub.publish(
        "addMoneyToUser",
        JSON.stringify({
          uuid,
          error: true,
          msg: `Amount can only be number.`,
        })
      );
    }

    if (!INR_BALANCES[userId]) {
      await pubSub.publish(
        "addMoneyToUser",
        JSON.stringify({
          uuid,
          error: true,
          msg: `${userId} not found`,
        })
      );
    }

    INR_BALANCES[userId].balance += amount;
    await pubSub.publish(
      "addMoneyToUser",
      JSON.stringify({
        uuid,
        error: false,
        msg: `Balance of ${userId}: ${JSON.stringify(INR_BALANCES[userId])}`,
      })
    );
  } else if (type === "getStockBalanceOfParticularUser") {
    const userId = payload;

    if (!STOCK_BALANCES[userId]) {
      await pubSub.publish(
        "stockBalanceOfUser",
        JSON.stringify({
          uuid,
          error: true,
          msg: `${userId} not found`,
        })
      );
    }

    const balanceStockOfUser = STOCK_BALANCES[userId];
    await pubSub.publish(
      "stockBalanceOfUser",
      JSON.stringify({
        uuid,
        error: false,
        msg: `Stock balance of ${userId}: ${balanceStockOfUser}`,
      })
    );
  } else if (type === "orderBuy") {
    const { userId, stockSymbol, quantity, price } = payload;

    if (!userId || !stockSymbol || !quantity || quantity <= 0 || !price) {
      await pubSub.publish(
        "buyOrder",
        JSON.stringify({
          uuid,
          error: true,
          msg: `Missing required field`,
        })
      );
    }

    const covertedPrice = price / 100;

    if (stockType == "yes") {
      //       INR_BALANCES[userId].balance -= quantity * price * 100;
      //   INR_BALANCES[userId].locked += quantity * price * 100;
      //   if (!ORDERBOOK[stockSymbol]) {
      //     return { msg: "Invalid stock symbol" };
      //   }
      //   let availableQuantity = 0;
      //   let availableNoQuantity = 0;
      //   if (ORDERBOOK[stockSymbol].yes[price]) {
      //     availableQuantity = ORDERBOOK[stockSymbol].yes[price].total;
      //     availableNoQuantity = ORDERBOOK[stockSymbol].no[10 - price]?.total || 0;
      //   }
      //   console.log("available quant is ", availableQuantity)
      //   console.log("availabel no quant is ",availableNoQuantity)
      //   let tempQuantity = quantity;
      //   if (availableQuantity > 0) {
      //     for (let user in ORDERBOOK[stockSymbol].yes[price].orders) {
      //       if (tempQuantity <= 0) break;
      //       const available = ORDERBOOK[stockSymbol].yes[price].orders[user].quantity;
      //       const toTake = Math.min(available, tempQuantity);
      //       ORDERBOOK[stockSymbol].yes[price].orders[user].quantity -= toTake;
      //       ORDERBOOK[stockSymbol].yes[price].total -= toTake;
      //       console.log("tempquant before ", tempQuantity)
      //       tempQuantity -= toTake;
      //       console.log("tempquant after ",tempQuantity)
      //       if (ORDERBOOK[stockSymbol].yes[price].orders[user].type == "sell") {
      //         if (STOCK_BALANCES[user][stockSymbol].yes) {
      //           STOCK_BALANCES[user][stockSymbol].yes.locked -= toTake;
      //           INR_BALANCES[user].balance += toTake * price * 100;
      //         }
      //       } else if (
      //         ORDERBOOK[stockSymbol].yes[price].orders[user].type == "reverted"
      //       ) {
      //         if (STOCK_BALANCES[user][stockSymbol].no) {
      //           STOCK_BALANCES[user][stockSymbol].no.quantity += toTake;
      //           INR_BALANCES[user].locked -= toTake * price*100;
      //         }
      //       }
      //       if (ORDERBOOK[stockSymbol].yes[price].orders[user].quantity === 0) {
      //         delete ORDERBOOK[stockSymbol].yes[price].orders[user];
      //       }
      //     }
      //     if (ORDERBOOK[stockSymbol].yes[price].total === 0) {
      //       delete ORDERBOOK[stockSymbol].yes[price];
      //     }
      //   }
      //   if (availableNoQuantity > 0 && ORDERBOOK[stockSymbol].no[10 - price]) {
      //     for (let user in ORDERBOOK[stockSymbol].no[10 - price].orders) {
      //       if (tempQuantity <= 0) break;
      //       const available =
      //         ORDERBOOK[stockSymbol].no[10 - price].orders[user].quantity;
      //       const toTake = Math.min(available, tempQuantity);
      //       ORDERBOOK[stockSymbol].no[10 - price].orders[user].quantity -= toTake;
      //       ORDERBOOK[stockSymbol].no[10 - price].total -= toTake;
      //       console.log("tempquant before in no ", tempQuantity)
      //       tempQuantity -= toTake;
      //       console.log("tempquant after in no ",tempQuantity)
      //       if (ORDERBOOK[stockSymbol].no[10 - price].orders[user].type == "sell") {
      //         if (STOCK_BALANCES[user][stockSymbol].no) {
      //           STOCK_BALANCES[user][stockSymbol].no.locked -= toTake;
      //           INR_BALANCES[user].balance += toTake * (10 - price) * 100;
      //         }
      //       } else if (
      //         ORDERBOOK[stockSymbol].no[10 - price].orders[user].type == "reverted"
      //       ) {
      //         if (STOCK_BALANCES[user][stockSymbol].yes) {
      //           STOCK_BALANCES[user][stockSymbol].yes.quantity += toTake;
      //           INR_BALANCES[user].locked -= toTake * (10 - price) * 100;
      //         }
      //       }
      //       if (ORDERBOOK[stockSymbol].no[10 - price].orders[user].quantity === 0) {
      //         delete ORDERBOOK[stockSymbol].no[10 - price].orders[user];
      //       }
      //     }
      //     if (ORDERBOOK[stockSymbol].no[10 - price].total === 0) {
      //       delete ORDERBOOK[stockSymbol].no[10 - price];
      //     }
      //   }
      //   if (tempQuantity > 0) {
      //     mintOppositeStock(stockSymbol, price, tempQuantity, userId, "yes");
      //   }
      //   initializeStockBalance(userId, stockSymbol);
      //   if (STOCK_BALANCES[userId][stockSymbol]?.yes) {
      //     STOCK_BALANCES[userId][stockSymbol].yes.quantity += quantity - tempQuantity;
      //   }
      //   INR_BALANCES[userId].locked -= (quantity - tempQuantity) * price * 100;
      //   return {
      //     message: `Buy order for 'yes' added for ${stockSymbol}`,
      //     orderbook: ORDERBOOK[stockSymbol],
      //   };
      // };
    } else if (stockType == "no") {
      //     INR_BALANCES[userId].balance -= quantity * price * 100;
      // INR_BALANCES[userId].locked += quantity * price * 100;
      // if (!ORDERBOOK[stockSymbol]) {
      //   return { msg: "Invalid stock symbol" };
      // }
      // let availableQuantity = 0;
      // let availableYesQuantity = 0;
      // if (ORDERBOOK[stockSymbol].no[price]) {
      //   availableQuantity = ORDERBOOK[stockSymbol].no[price].total;
      //   availableYesQuantity = ORDERBOOK[stockSymbol].yes[10 - price]?.total || 0;
      // }
      // console.log("availabe quantity is ",availableQuantity)
      // console.log("available yea quant is ",availableYesQuantity)
      // let tempQuantity = quantity;
      // if (availableQuantity > 0) {
      //   for (let user in ORDERBOOK[stockSymbol].no[price].orders) {
      //     if (!STOCK_BALANCES[userId]) {
      //       STOCK_BALANCES[userId] = {};
      //     }
      //     if (!STOCK_BALANCES[user]) {
      //       STOCK_BALANCES[user] = {};
      //     }
      //     if (!STOCK_BALANCES[userId][stockSymbol]) {
      //       STOCK_BALANCES[userId][stockSymbol] = {
      //         yes: { quantity: 0, locked: 0 },
      //         no: { quantity: 0, locked: 0 },
      //       };
      //     }
      //     if (!STOCK_BALANCES[user][stockSymbol]) {
      //       STOCK_BALANCES[user][stockSymbol] = {
      //         yes: { quantity: 0, locked: 0 },
      //         no: { quantity: 0, locked: 0 },
      //       };
      //     }
      //     if (tempQuantity <= 0) break;
      //     const available = ORDERBOOK[stockSymbol].no[price].orders[user].quantity;
      //     const toTake = Math.min(available, tempQuantity);
      //     ORDERBOOK[stockSymbol].no[price].orders[user].quantity -= toTake;
      //     ORDERBOOK[stockSymbol].no[price].total -= toTake;
      //     tempQuantity -= toTake;
      //     if (ORDERBOOK[stockSymbol].no[price].orders[user].type == "sell") {
      //       if (STOCK_BALANCES[user][stockSymbol].no) {
      //         STOCK_BALANCES[user][stockSymbol].no.locked -= toTake;
      //         INR_BALANCES[user].balance += toTake * 100 * price;
      //       }
      //     } else if (
      //       ORDERBOOK[stockSymbol].no[price].orders[user].type == "reverted"
      //     ) {
      //       console.log(JSON.stringify(STOCK_BALANCES));
      //       if (STOCK_BALANCES[userId][stockSymbol].yes) {
      //         console.log(
      //           "stock balance of yes actual before ",
      //           STOCK_BALANCES[userId][stockSymbol].yes.quantity
      //         );
      //       }
      //       if (STOCK_BALANCES[user][stockSymbol].yes) {
      //         STOCK_BALANCES[user][stockSymbol].yes.quantity += toTake;
      //         INR_BALANCES[user].locked -= toTake * 100 * price;
      //         console.log(
      //           "stock balance of yes ",
      //           STOCK_BALANCES[user][stockSymbol].yes.quantity
      //         );
      //       }
      //       if (STOCK_BALANCES[userId][stockSymbol].yes) {
      //         console.log(
      //           "stock balance of yes actual ",
      //           STOCK_BALANCES[userId][stockSymbol].yes.quantity
      //         );
      //       }
      //       console.log("user:", user, "userId:", userId);
      //       console.log(JSON.stringify(STOCK_BALANCES));
      //       console.log(STOCK_BALANCES[userId] == STOCK_BALANCES[user]);
      //     }
      //     if (ORDERBOOK[stockSymbol].no[price].orders[user].quantity === 0) {
      //       delete ORDERBOOK[stockSymbol].no[price].orders[user];
      //     }
      //   }
      //   if (ORDERBOOK[stockSymbol].no[price].total === 0) {
      //     delete ORDERBOOK[stockSymbol].no[price];
      //   }
      // }
      // if (availableYesQuantity > 0 && ORDERBOOK[stockSymbol].yes[10 - price]) {
      //   for (let user in ORDERBOOK[stockSymbol].yes[10 - price].orders) {
      //     if (!STOCK_BALANCES[userId]) {
      //       STOCK_BALANCES[userId] = {};
      //     }
      //     if (!STOCK_BALANCES[user]) {
      //       STOCK_BALANCES[user] = {};
      //     }
      //     if (!STOCK_BALANCES[userId][stockSymbol]) {
      //       STOCK_BALANCES[userId][stockSymbol] = {
      //         yes: { quantity: 0, locked: 0 },
      //         no: { quantity: 0, locked: 0 },
      //       };
      //     }
      //     if (!STOCK_BALANCES[user][stockSymbol]) {
      //       STOCK_BALANCES[user][stockSymbol] = {
      //         yes: { quantity: 0, locked: 0 },
      //         no: { quantity: 0, locked: 0 },
      //       };
      //     }
      //     if (tempQuantity <= 0) break;
      //     const available =
      //       ORDERBOOK[stockSymbol].yes[10 - price].orders[user].quantity;
      //     const toTake = Math.min(available, tempQuantity);
      //     ORDERBOOK[stockSymbol].yes[10 - price].orders[user].quantity -= toTake;
      //     ORDERBOOK[stockSymbol].yes[10 - price].total -= toTake;
      //     tempQuantity -= toTake;
      //     if (ORDERBOOK[stockSymbol].yes[10 - price].orders[user].type == "sell") {
      //       if (STOCK_BALANCES[user][stockSymbol].yes) {
      //         STOCK_BALANCES[user][stockSymbol].yes.locked -= toTake;
      //         INR_BALANCES[user].balance += toTake * 100 * (10 - price);
      //       }
      //     } else if (
      //       ORDERBOOK[stockSymbol].yes[10 - price].orders[user].type == "reverted"
      //     ) {
      //       if (STOCK_BALANCES[user][stockSymbol].no) {
      //         STOCK_BALANCES[user][stockSymbol].no.quantity += toTake;
      //         INR_BALANCES[user].locked -= toTake * 100 * (10 - price);
      //       }
      //     }
      //     if (ORDERBOOK[stockSymbol].yes[10 - price].orders[user].quantity === 0) {
      //       delete ORDERBOOK[stockSymbol].yes[10 - price].orders[user];
      //     }
      //   }
      //   if (ORDERBOOK[stockSymbol].yes[10 - price].total === 0) {
      //     delete ORDERBOOK[stockSymbol].yes[10 - price];
      //   }
      // }
      // if (tempQuantity > 0) {
      //   mintOppositeStock(stockSymbol, price, tempQuantity, userId, "no");
      // }
      // initializeStockBalance(userId, stockSymbol);
      // if (STOCK_BALANCES[userId][stockSymbol]?.no) {
      //   STOCK_BALANCES[userId][stockSymbol].no.quantity += quantity - tempQuantity;
      // }
      // console.log("the quantity is ",quantity, " the remaingin tempquant is ",tempQuantity)
      // INR_BALANCES[userId].locked -= (quantity - tempQuantity) * price * 100;
      // return {
      //   message: `Buy order for 'no' added for ${stockSymbol}`,
      //   orderbook: ORDERBOOK[stockSymbol],
      // };
    }

    // if (stockType === "yes") {
    //   stockOppositeType = "no";
    // } else {
    //   stockOppositeType = "yes";
    // }

    // if (!INR_BALANCES[userId]) {
    //   await pubSub.publish(
    //     "buyOrder",
    //     JSON.stringify({
    //       uuid,
    //       error: true,
    //       msg: `${userId} is not available, please create the user first.`,
    //     })
    //   );
    // }

    // if (!ORDERBOOK[stockSymbol]) {
    //   await pubSub.publish(
    //     "buyOrder",
    //     JSON.stringify({
    //       uuid,
    //       error: true,
    //       msg: `${stockSymbol} is not available, please create it first.`,
    //     })
    //   );
    // }

    // INR_BALANCES[userId].balance -= quantity * price * 100;
    // INR_BALANCES[userId].locked -= quantity * price * 100;

    // let availableQuantity = 0;
    // let availableNoQuantity = 0;

    // if (ORDERBOOK[stockSymbol][stockType][price]) {
    //   availableQuantity = ORDERBOOK[stockSymbol][stockType][price].total;
    //   availableNoQuantity =
    //     ORDERBOOK[stockSymbol][stockOppositeType][10 - price].total || 0;
    // }

    // let tempQuantity = quantity;

    // if (availableQuantity > 0) {
    //   for (let user in ORDERBOOK[stockSymbol][stockType][price].orders) {
    //     if (!STOCK_BALANCES[userId]) {
    //       STOCK_BALANCES[userId] = {};
    //     }
    //     if (!STOCK_BALANCES[user]) {
    //       STOCK_BALANCES[user] = {};
    //     }
    //     if (!STOCK_BALANCES[userId][stockSymbol]) {
    //       STOCK_BALANCES[userId][stockSymbol] = {
    //         yes: { quantity: 0, locked: 0 },
    //         no: { quantity: 0, locked: 0 },
    //       };
    //     }
    //     if (!STOCK_BALANCES[user][stockSymbol]) {
    //       STOCK_BALANCES[user][stockSymbol] = {
    //         yes: { quantity: 0, locked: 0 },
    //         no: { quantity: 0, locked: 0 },
    //       };
    //     }
    //     if (tempQuantity <= 0) break;
    //     const available =
    //       ORDERBOOK[stockSymbol][stockType][price].orders[user].quantity;
    //     const toTake = Math.min(available, tempQuantity);

    //     ORDERBOOK[stockSymbol][stockType][price].orders[user].type;
    //   }
    // }
    // const totalPrice = price * quantity;

    // if (INR_BALANCES[userId].balance / 100 < totalPrice) {
    //   await pubSub.publish(
    //     "buyOrder",
    //     JSON.stringify({
    //       uuid,
    //       error: true,
    //       msg: `You don't have sufficient balance to place this order, kindly add the required amount first.`,
    //     })
    //   );
    // }

    // initializeOrderBook(stockSymbol, stockType);
    // let stockName = `${stockSymbol}_${Date.now()}`;

    // await pubSub.publish(
    //   "buyOrder",
    //   JSON.stringify({
    //     uuid,
    //     error: false,
    //     msg: `Successfully placed buy order for ${quantity} of ${stockType} at price ${price} for ${stockSymbol}`,
    //   })
    // );
    // return res.status(200).json({
    //   message: `Successfully placed buy order for ${quantity} of ${stockType} at price ${price} for ${stockSymbol}`,
    //   updatedOrderBook: ORDERBOOK[stockSymbol][stockType],
    //   userBalance: INR_BALANCES[userId],
    //   updatedStockBalance: STOCK_BALANCES[userId][stockSymbol],
    // });
  } else if (type === "orderSell") {
    const { userId, stockSymbol, quantity, price } = payload;

    if (!userId || !stockSymbol || !quantity || quantity <= 0 || !price) {
      await pubSub.publish(
        "sellOrder",
        JSON.stringify({
          uuid,
          error: true,
          msg: `Missing required field`,
        })
      );
    }

    const convertedPrice = price / 100;

    if (!STOCK_BALANCES[userId]) {
      await pubSub.publish(
        "sellOrder",
        JSON.stringify({
          uuid,
          error: true,
          msg: `${userId} is not registered, pls register this user first.`,
        })
      );
    }

    if (!STOCK_BALANCES[userId][stockSymbol]) {
      await pubSub.publish(
        "sellOrder",
        JSON.stringify({
          uuid,
          error: true,
          msg: `${userId} does not own this stock-symbol, pls buy this stock-symbol first.`,
        })
      );
    }

    if (!STOCK_BALANCES[userId][stockSymbol][stockType]) {
      await pubSub.publish(
        "sellOrder",
        JSON.stringify({
          uuid,
          error: true,
          msg: `${userId} does not own this stock-type, pls buy this stock-type first.`,
        })
      );
    }

    if (STOCK_BALANCES[userId][stockSymbol][stockType].quantity < quantity) {
      await pubSub.publish(
        "sellOrder",
        JSON.stringify({
          uuid,
          error: true,
          msg: `${userId} does not own appropriate quantity of ${stockType} token of ${stockSymbol} to sell, pls sell accordingly.`,
        })
      );
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
    await pubSub.publish(
      "sellOrder",
      JSON.stringify({
        uuid,
        error: false,
        msg: `Successfully placed sell order for ${quantity} of ${stockType} at price ${price} for ${stockSymbol}`,
      })
    );
    // return res.status(200).json({
    //   message: `Successfully placed sell order for ${quantity} of ${stockType} at price ${price} for ${stockSymbol}`,
    //   userBalance: INR_BALANCES[userId],
    //   updatedOrderBook: ORDERBOOK[stockSymbol][stockType],
    //   updatedStockBalance: STOCK_BALANCES[userId][stockSymbol][stockType],
    // });
  } else if (type === "getOrderbookOfParticularSymbol") {
    const stockSymbol = payload;

    if (!ORDERBOOK[stockSymbol]) {
      await pubSub.publish(
        "orderBookOfParticularUser",
        JSON.stringify({
          uuid,
          error: true,
          msg: `${stockSymbol} is not found in orderbook, pls provide appropriate stock-symbol`,
        })
      );
    }

    await pubSub.publish(
      "sellOrder",
      JSON.stringify({
        uuid,
        error: false,
        msg: JSON.stringify(ORDERBOOK[stockSymbol]),
      })
    );
  } else if (type === "mintTokens") {
    const { userId, stockSymbol, quantity } = payload;
    if (!userId || !stockSymbol || !quantity || quantity <= 0) {
      await pubSub.publish(
        "mintNewTokens",
        JSON.stringify({
          uuid,
          error: true,
          msg: `Please provide appropriate details.`,
        })
      );
    }

    if (!STOCK_BALANCES[userId]) {
      await pubSub.publish(
        "mintNewTokens",
        JSON.stringify({
          uuid,
          error: true,
          msg: `${userId} not registered, pls register first.`,
        })
      );
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

    if (
      !STOCK_BALANCES[userId][stockSymbol].yes ||
      !STOCK_BALANCES[userId][stockSymbol].no
    ) {
      STOCK_BALANCES[userId][stockSymbol].yes = { quantity: 0, locked: 0 };
      STOCK_BALANCES[userId][stockSymbol].no = { quantity: 0, locked: 0 };
    }

    STOCK_BALANCES[userId][stockSymbol].yes.quantity += quantity;
    STOCK_BALANCES[userId][stockSymbol].no.quantity += quantity;

    await pubSub.publish(
      "mintNewTokens",
      JSON.stringify({
        uuid,
        error: false,
        msg: `Successfully minted ${quantity} of tokens for ${stockSymbol}: ${STOCK_BALANCES[userId][stockSymbol]}`,
      })
    );
  }
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
