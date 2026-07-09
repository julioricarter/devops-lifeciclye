const express = require('express');
const router = express.Router();

let products = [
  { id: 1, name: 'Widget Alpha', price: 29.99, stock: 150 },
  { id: 2, name: 'Widget Beta',  price: 49.99, stock: 80  },
  { id: 3, name: 'Widget Gamma', price: 99.99, stock: 30  },
];

let nextId = 4;

router.get('/', (req, res) => {
  res.json({ data: products, total: products.length });
});

router.get('/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

router.post('/', (req, res) => {
  const { name, price, stock } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ error: 'name and price are required' });
  }
  const product = { id: nextId++, name, price: parseFloat(price), stock: stock || 0 };
  products.push(product);
  res.status(201).json(product);
});

router.put('/:id', (req, res) => {
  const index = products.findIndex(p => p.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Product not found' });
  products[index] = { ...products[index], ...req.body, id: products[index].id };
  res.json(products[index]);
});

router.delete('/:id', (req, res) => {
  const index = products.findIndex(p => p.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Product not found' });
  products.splice(index, 1);
  res.status(204).send();
});

module.exports = router;
