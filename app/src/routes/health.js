const express = require('express');
const router = express.Router();

const startTime = Date.now();

router.get('/', (req, res) => {
  res.json({ status: 'ok', uptime: Math.floor((Date.now() - startTime) / 1000) });
});

router.get('/ready', (req, res) => {
  res.json({ status: 'ready', timestamp: new Date().toISOString() });
});

router.get('/live', (req, res) => {
  res.json({ status: 'alive', pid: process.pid });
});

module.exports = router;
