const request = require('supertest');
const { app } = require('../src/server');

const username = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
const email = username + '@yahoo.com';
const validateShape = (body) => expect(body);
const password = 'Password100%';
let token;



// ATHENTICATION TESTS
describe('/authenticate', () => {
  it('given all data, should pass with 200, and a status that is true.', async (done) => {
    const res = await request(app)
      .post('/authenticate')
      .send({
        email,
        username,
        password,
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('status', true);
    done();
  });
});
