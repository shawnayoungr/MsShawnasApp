const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const COL_PATH = path.join(__dirname, 'prepopulated-colleges.json');
let COLS = [];
try { COLS = JSON.parse(fs.readFileSync(COL_PATH, 'utf8')); } catch (e) { COLS = []; }

router.get('/local', (req, res) => {
  res.json(COLS);
});

router.get('/local/:id', (req, res) => {
  const id = req.params.id;
  const c = COLS.find(x => x.id === id);
  if (!c) return res.status(404).json({ error: 'college not found' });
  res.json(c);
});

module.exports = router;
