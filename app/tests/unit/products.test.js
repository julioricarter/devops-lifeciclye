const request = require('supertest');
const { app, server } = require('../../src/index');

afterAll(() => server.close());

describe('GET /api/products', () => {
  it('returns list of products with total count', async () => {
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.total).toBeGreaterThan(0);
  });
});

describe('GET /api/products/:id', () => {
  it('returns a single product by id', async () => {
    const res = await request(app).get('/api/products/1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', 1);
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('price');
  });

  it('returns 404 for non-existent product', async () => {
    const res = await request(app).get('/api/products/9999');
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error', 'Product not found');
  });
});

describe('POST /api/products', () => {
  it('creates a new product', async () => {
    const payload = { name: 'New Widget', price: 19.99, stock: 50 };
    const res = await request(app).post('/api/products').send(payload);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe(payload.name);
    expect(res.body.price).toBe(payload.price);
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app).post('/api/products').send({ price: 10 });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when price is missing', async () => {
    const res = await request(app).post('/api/products').send({ name: 'Test' });
    expect(res.statusCode).toBe(400);
  });
});

describe('PUT /api/products/:id', () => {
  it('updates an existing product', async () => {
    const res = await request(app).put('/api/products/1').send({ price: 39.99 });
    expect(res.statusCode).toBe(200);
    expect(res.body.price).toBe(39.99);
    expect(res.body.id).toBe(1);
  });

  it('returns 404 for non-existent product', async () => {
    const res = await request(app).put('/api/products/9999').send({ price: 1 });
    expect(res.statusCode).toBe(404);
  });
});

describe('DELETE /api/products/:id', () => {
  it('deletes a product and returns 204', async () => {
    const res = await request(app).delete('/api/products/2');
    expect(res.statusCode).toBe(204);
  });

  it('returns 404 for already deleted product', async () => {
    const res = await request(app).delete('/api/products/9999');
    expect(res.statusCode).toBe(404);
  });
});
