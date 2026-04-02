function getRiskLevel(age, bp, sugar, heartRate) {
    let score = 0;

    if (age > 50) score += 2;
    if (bp > 140) score += 2;
    if (sugar > 150) score += 2;
    if (heartRate > 100) score += 1;

    let risk = "Low";
    let advice = "You are healthy 👍";

    if (score >= 5) {
        risk = "High";
        advice = "Consult a doctor immediately 🚑";
    } else if (score >= 3) {
        risk = "Medium";
        advice = "Take care and monitor regularly ⚠️";
    }

    return { risk, advice };
}

module.exports = { getRiskLevel };