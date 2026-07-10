const request = require('supertest');
const { app, server } = require('../../src/index');

afterAll(() => server.close());

// HU-03: Listar el catálogo de productos (docs/user-stories/HU-03-listar-productos.md)
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

// HU-04: Consultar el detalle de un producto por ID (docs/user-stories/HU-04-consultar-producto.md)
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

// HU-05: Crear un nuevo producto (docs/user-stories/HU-05-crear-producto.md)
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

// HU-06: Actualizar un producto existente (docs/user-stories/HU-06-actualizar-producto.md)
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

// HU-07: Eliminar un producto (docs/user-stories/HU-07-eliminar-producto.md)
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
