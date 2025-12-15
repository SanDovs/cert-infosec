'use strict';

const fetch = require('node-fetch');
const crypto = require('crypto');
const Stock = require('../models/Stock');

module.exports = function (app) {

  // Hash IP for GDPR-friendly storage
  function hashIP(ip) {
    return crypto
      .createHash('sha256')
      .update(ip)
      .digest('hex');
  }

  async function getStockPrice(symbol) {
    const res = await fetch(
      `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`
    );
    const data = await res.json();
    return data.latestPrice;
  }

  async function handleStock(symbol, like, ip) {
    const hashedIP = hashIP(ip);
    const price = await getStockPrice(symbol);

    let stock = await Stock.findOne({ symbol });

    if (!stock) {
      stock = new Stock({ symbol });
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

      if (Array.isArray(stock)) {
        const [s1, s2] = stock;

        const stock1 = await handleStock(s1, like, req.ip);
        const stock2 = await handleStock(s2, like, req.ip);

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

      const data = await handleStock(stock, like, req.ip);
      res.json({ stockData: data });

    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });
};
