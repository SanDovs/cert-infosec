const mongoose = require('mongoose');

const StockSchema = new mongoose.Schema({
  symbol: { type: String, required: true, uppercase: true },
  likes: { type: Number, default: 0 },
  ips: { type: [String], default: [] } // hashed IPs
});

module.exports = mongoose.model('Stock', StockSchema);
