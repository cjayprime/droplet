const request = require('supertest');
const { app } = require('../src/server');

const username = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
const email = username + '@yahoo.com';
const password = 'Password100%';
let token;

// SIGNUP TESTS
describe('/signup', () => {
  it('given all data, should pass with 200, and a status that is true.', async (done) => {
    const res = await request(app)
      .post('/signup')
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

  it('given no email, should pass with 400, and a status that is false.', async (done) => {
    const res = await request(app)
      .post('/signup')
      .send({
        username,
        password,
      });
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('status', false);
    done();
  });

  it('given no username, should pass with 400, and a status that is false.', async (done) => {
    const res = await request(app)
      .post('/signup')
      .send({
        email,
        password,
      });
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('status', false);
    done();
  });

  it('given no password, should pass with 400, and a status that is false.', async (done) => {
    const res = await request(app)
      .post('/signup')
      .send({
        email,
        username,
      });
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('status', false);
    done();
  });
});



// SIGNIN TESTS
describe('/signin', () => {
  it('given all data, should have a token, pass with 200, and a status that is true.', async (done) => {
    const res = await request(app)
      .post('/signin')
      .send({
        username,
        password,
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('status', true);
    expect(res.body).toMatchObject(
      {data: {token: expect.any(String)}}
    );
    token = res.body.data.token;
    done();
  });

  it('given no username, should pass with 400, and a status that is false.', async (done) => {
    const res = await request(app)
      .post('/signin')
      .send({
        password,
      });
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('status', false);
    done();
  });

  it('given no password, should pass with 400, and a status that is false.', async (done) => {
    const res = await request(app)
      .post('/signin')
      .send({
        username,
      });
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('status', false);
    done();
  });
});




// BALANCE TESTS
describe('/balance', () => {
  let balance = 0;
  it('GET /balance', async (done) => {
    const res = await request(app)
      .get('/balance')
      .set('Authorization', 'Bearer ' + token)
      .send();
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('status', true);
    expect(res.body).toMatchObject(
      {data: {balance: expect.any(Number)}}
    );
    balance = res.body.data.balance;
    done();
  });

  it('PUT /balance', async (done) => {
    const amount = Math.round(Math.random() * 1000);
    const res = await request(app)
      .put('/balance')
      .set('Authorization', 'Bearer ' + token)
      .send({ amount });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('status', true);
    expect(res.body).toMatchObject(
      {data: {balance: expect.any(Number)}}
    );
    expect(res.body.data.balance).toBe(amount + balance);
    done();
  });
});
