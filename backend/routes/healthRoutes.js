const express = require('express');
const router = express.Router();

const { calculateRisk } = require('../controllers/healthController');

router.post('/predict', calculateRisk);

module.exports = router;