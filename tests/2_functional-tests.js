const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');
const Stock = require('../models/Stock');

const assert = chai.assert;
chai.use(chaiHttp);

suite('Functional Tests', function () {

  before(async () => {
    await Stock.deleteMany({});
  });

  test('Viewing one stock', done => {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.property(res.body.stockData, 'stock');
        assert.property(res.body.stockData, 'price');
        assert.property(res.body.stockData, 'likes');
        done();
      });
  });

  test('Viewing one stock and liking it', done => {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG', like: true })
      .end((err, res) => {
        assert.equal(res.body.stockData.likes, 1);
        done();
      });
  });

  test('Viewing same stock and liking again (no double like)', done => {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG', like: true })
      .end((err, res) => {
        assert.equal(res.body.stockData.likes, 1);
        done();
      });
  });

  test('Viewing two stocks', done => {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: ['GOOG', 'MSFT'] })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isArray(res.body.stockData);
        assert.property(res.body.stockData[0], 'rel_likes');
        assert.property(res.body.stockData[1], 'rel_likes');
        done();
      });
  });

  test('Viewing two stocks and liking them', done => {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: ['GOOG', 'MSFT'], like: true })
      .end((err, res) => {
        assert.equal(res.body.stockData.length, 2);
        done();
      });
  });
});
