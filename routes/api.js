'use strict';

const fetch = require('node-fetch');
const crypto = require('crypto');
const Stock = require('../models/Stock');

module.exports = function (app) {

  // Hash IP (GDPR friendly)
  function hashIP(ip) {
    return crypto.createHash('sha256').update(ip).digest('hex');
  }

  async function getPrice(symbol) {
    const response = await fetch(
      `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`
    );
    const data = await response.json();
    return data.latestPrice;
  }

  async function processStock(symbol, like, ip) {
    const hashedIP = hashIP(ip);
    const price = await getPrice(symbol);

    let stock = await Stock.findOne({ symbol });

    if (!stock) {
      stock = new Stock({
        symbol,
        likes: 0,
        ips: []
      });
    }

    if (like && !stock.ips.includes(hashedIP)) {
      stock.likes += 1;
      stock.ips.push(hashedIP);
    }

    await stock.save();

    return {
      stock: stock.symbol,
      price,
      likes: stock.likes
    };
  }

  app.get('/api/stock-prices', async (req, res) => {
    try {
      let { stock, like } = req.query;
      like = like === 'true';

      // TWO STOCKS
      if (Array.isArray(stock)) {
        const stock1 = await processStock(stock[0], like, req.ip);
        const stock2 = await processStock(stock[1], like, req.ip);

        return res.json({
          stockData: [
            {
              stock: stock1.stock,
              price: stock1.price,
              rel_likes: stock1.likes - stock2.likes
            },
            {
              stock: stock2.stock,
              price: stock2.price,
              rel_likes: stock2.likes - stock1.likes
            }
          ]
        });
      }

      // ONE STOCK
      const data = await processStock(stock, like, req.ip);

      res.json({
        stockData: {
          stock: data.stock,
          price: data.price,
          likes: data.likes
        }
      });

    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
};
