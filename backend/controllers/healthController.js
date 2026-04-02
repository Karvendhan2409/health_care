const { getRiskLevel } = require('../utils/riskCalculator');

exports.calculateRisk = (req, res) => {
    const { age, bp, sugar, heartRate } = req.body;

    const result = getRiskLevel(age, bp, sugar, heartRate);

    res.json(result);
};