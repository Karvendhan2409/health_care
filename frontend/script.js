// ================== INITIALIZATION ==================
let healthHistory = [];
let chartInstances = {};
let currentAssessment = null;

// Load history from localStorage on page load
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
    setupEventListeners();
    loadDarkMode();
});

// ================== EVENT LISTENERS ==================
function setupEventListeners() {
    try {
        // Form submission
        const form = document.getElementById('healthForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await submitHealthForm();
            });
        } else {
            console.warn('Form #healthForm not found');
        }

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                switchTab(e.target.dataset.tab);
            });
        });

        // Dark mode toggle
        const darkModeBtn = document.getElementById('darkModeBtn');
        if (darkModeBtn) {
            darkModeBtn.addEventListener('click', toggleDarkMode);
        }

        // History controls
        const clearHistoryBtn = document.getElementById('clearHistoryBtn');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', clearAllHistory);
        }

        // Export PDF
        const exportPdfBtn = document.getElementById('exportPdfBtn');
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', exportPDF);
        }
        
        // Export CSV
        const exportCsvBtn = document.getElementById('exportCsvBtn');
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', exportCSV);
        }
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

// ================== FORM SUBMISSION ==================
async function submitHealthForm() {
    try {
        // Get form values with validation
        const age = document.getElementById('age');
        const weight = document.getElementById('weight');
        const height = document.getElementById('height');
        const bp = document.getElementById('bp');
        const sugar = document.getElementById('sugar');
        const heartRate = document.getElementById('heartRate');
        const smoking = document.getElementById('smoking');
        const exercise = document.getElementById('exercise');
        const name = document.getElementById('name');
        const address = document.getElementById('address');

        if (!age || !weight || !height || !bp || !sugar || !heartRate) {
            alert('Error: Some form fields are missing. Please refresh the page.');
            return;
        }

        const bmi = calculateBMI(parseInt(weight.value), parseInt(height.value));
        
        const familyHistory = [
            document.getElementById('familyHypertension')?.checked ? 'Hypertension' : null,
            document.getElementById('familyDiabetes')?.checked ? 'Diabetes' : null,
            document.getElementById('familyHeart')?.checked ? 'Heart Disease' : null,
            document.getElementById('familyStroke')?.checked ? 'Stroke' : null
        ].filter(x => x);

        const formData = {
            name: name.value || 'Anonymous',
            address: address.value || 'Not Provided',
            age: parseInt(age.value),
            weight: parseInt(weight.value),
            height: parseInt(height.value),
            bmi: bmi,
            bp: parseInt(bp.value),
            sugar: parseInt(sugar.value),
            heartRate: parseInt(heartRate.value),
            smoking: smoking.value || 'never',
            exercise: parseInt(exercise.value) || 0,
            familyHistory: familyHistory
        };

        const response = await fetch('http://localhost:5000/api/health/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                age: formData.age,
                bp: formData.bp,
                sugar: formData.sugar,
                heartRate: formData.heartRate
            })
        });

        if (!response.ok) throw new Error('API request failed');
        
        const result = await response.json();
        const assessment = {
            ...formData,
            risk: result.risk,
            advice: result.advice,
            score: calculateDetailedScore(formData),
            timestamp: new Date().toISOString()
        };

        currentAssessment = assessment;
        displayResult(assessment);
        saveToHistory(assessment);
        updateAnalytics();
        displayTips(assessment);
    } catch (error) {
        console.error('Form submission error:', error);
        alert('Error: ' + error.message);
    }
}

// ================== RESULT DISPLAY ==================
function displayResult(assessment) {
    const resultDiv = document.getElementById('result');
    const riskClass = assessment.risk.toLowerCase();
    
    const scoreBreakdown = getScoreBreakdown(assessment);
    const metricsStatus = getMetricsStatus(assessment);
    const healthScoreIndex = calculateHealthScoreIndex(assessment);
    const comparison = compareWithPrevious(assessment);
    const doctorRec = getDoctorRecommendation(assessment);
    const emergencyAlert = getEmergencyAlert(assessment);

    resultDiv.innerHTML = `
        ${emergencyAlert ? `
            <div style="padding: 15px; background: #ffe6e6; border: 2px solid #e74c3c; border-radius: 8px; margin-bottom: 15px;">
                <strong style="color: #e74c3c;">🚨 EMERGENCY ALERT</strong><p style="margin: 10px 0 0 0; color: #c0392b;">${emergencyAlert}</p>
            </div>
        ` : ''}

        <div class="result-header">
            <div>
                <div class="risk-level ${riskClass}">
                    ${assessment.risk.toUpperCase()} RISK
                </div>
            </div>
            <div class="risk-score">
                Score: ${assessment.score}/10<br>
                <small>Health Index: ${healthScoreIndex}/100</small>
            </div>
        </div>
        
        <div class="advice ${riskClass}">
            <strong>✨ Assessment:</strong> ${assessment.advice}
        </div>

        ${comparison ? `
            <div style="margin-top: 15px; padding: 15px; background: rgba(155, 89, 182, 0.1); border-radius: 8px;">
                <strong>📈 Comparison with Previous Record:</strong><p style="margin: 10px 0 0 0;">${comparison}</p>
            </div>
        ` : ''}

        ${doctorRec ? `
            <div style="margin-top: 15px; padding: 15px; background: rgba(26, 188, 156, 0.1); border-radius: 8px;">
                <strong>👨‍⚕️ Doctor Recommendation:</strong><p style="margin: 10px 0 0 0;">${doctorRec}</p>
            </div>
        ` : ''}

        <div class="metric-details">
            ${metricsStatus.map(metric => `
                <div class="metric-item ${metric.status}">
                    <div class="metric-label">${metric.label}</div>
                    <div class="metric-value">${metric.value}</div>
                    <small>${metric.status.toUpperCase()}</small>
                </div>
            `).join('')}
        </div>

        <div style="margin-top: 20px; padding: 15px; background: rgba(52, 152, 219, 0.1); border-radius: 8px;">
            <strong>📊 Risk Breakdown:</strong><br>
            ${scoreBreakdown.map(item => `<div> ${item}</div>`).join('')}
        </div>
    `;
    
    resultDiv.classList.add('show');
}

// ================== HEALTH SCORE INDEX ==================
function calculateHealthScoreIndex(assessment) {
    // 0-100 score where 100 is perfect health
    let score = 100;
    
    // Age penalty
    if (assessment.age > 60) score -= 15;
    else if (assessment.age > 50) score -= 10;
    else if (assessment.age > 40) score -= 5;
    
    // Vital signs penalties
    if (assessment.bp > 160) score -= 20;
    else if (assessment.bp > 140) score -= 15;
    else if (assessment.bp > 130) score -= 10;
    
    if (assessment.sugar > 200) score -= 20;
    else if (assessment.sugar > 150) score -= 15;
    else if (assessment.sugar > 126) score -= 10;
    
    if (assessment.heartRate > 120) score -= 15;
    else if (assessment.heartRate > 100) score -= 10;
    
    // BMI penalty
    if (assessment.bmi >= 35) score -= 20;
    else if (assessment.bmi >= 30) score -= 15;
    else if (assessment.bmi >= 25) score -= 10;
    else if (assessment.bmi < 18.5) score -= 5;
    
    // Smoking penalty
    if (assessment.smoking === 'current') score -= 20;
    else if (assessment.smoking === 'former') score -= 10;
    
    // Exercise bonus
    if (assessment.exercise >= 5) score += 15;
    else if (assessment.exercise >= 3) score += 10;
    
    // Family history penalty
    score -= (assessment.familyHistory.length * 8);
    
    return Math.max(0, Math.min(100, Math.round(score)));
}

// ================== COMPARISON WITH PREVIOUS ==================
function compareWithPrevious(assessment) {
    if (healthHistory.length < 2) return null;
    
    const previous = healthHistory[1];
    const currentScore = assessment.score;
    const previousScore = previous.score;
    
    let comparison = '';
    
    if (currentScore > previousScore) {
        const diff = currentScore - previousScore;
        comparison += `⚠️ Your risk score has INCREASED by ${diff} points. Take action immediately!<br>`;
    } else if (currentScore < previousScore) {
        const diff = previousScore - currentScore;
        comparison += `✅ Great progress! Your risk score has DECREASED by ${diff} points!<br>`;
    } else {
        comparison += `→ Your risk score remains STABLE.<br>`;
    }
    
    // Check specific metrics improvement
    if (assessment.bp < previous.bp) comparison += `✅ Blood pressure improved`;
    else if (assessment.bp > previous.bp) comparison += `⚠️ Blood pressure increased`;
    
    if (assessment.sugar < previous.sugar) comparison += ` | ✅ Sugar level improved`;
    else if (assessment.sugar > previous.sugar) comparison += ` | ⚠️ Sugar level increased`;
    
    return comparison;
}

// ================== DOCTOR RECOMMENDATION ==================
function getDoctorRecommendation(assessment) {
    if (assessment.risk === 'High') {
        return '🚨 <strong>URGENT:</strong> Consult a cardiologist within 24-48 hours. High risk indicators detected.';
    } else if (assessment.risk === 'Medium') {
        if (assessment.bp > 140 || assessment.sugar > 150) {
            return '⚠️ Schedule appointment with your doctor within 1 week. Consider specialist consultation (cardiologist/endocrinologist).';
        }
        return '📋 Schedule a check-up with your doctor within 2-3 weeks for comprehensive assessment.';
    }
    return '✅ Continue regular health check-ups annually. Maintain current healthy habits.';
}

// ================== EMERGENCY ALERT ==================
function getEmergencyAlert(assessment) {
    const alerts = [];
    
    if (assessment.bp > 180) {
        alerts.push('Severely elevated blood pressure (Hypertensive Crisis)');
    }
    if (assessment.sugar > 400) {
        alerts.push('Dangerously high blood sugar levels');
    }
    if (assessment.heartRate > 150) {
        alerts.push('Critically elevated heart rate');
    }
    if (assessment.smoking === 'current' && assessment.bp > 140 && assessment.age > 50) {
        alerts.push('Critical combination: Smoking + Hypertension + Age > 50');
    }
    
    if (alerts.length > 0) {
        return alerts.join(' | ') + '<br>If you experience chest pain, shortness of breath, or dizziness, CALL EMERGENCY SERVICES IMMEDIATELY.';
    }
    return null;
}

// ================== BMI CALCULATION ==================
function calculateBMI(weight, height) {
    // weight in kg, height in cm
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    return parseFloat(bmi.toFixed(1));
}

function getBMICategory(bmi) {
    if (bmi < 18.5) return { category: 'Underweight', icon: '📉', risk: 'medium' };
    if (bmi < 25) return { category: 'Normal Weight', icon: '✅', risk: 'low' };
    if (bmi < 30) return { category: 'Overweight', icon: '⚠️', risk: 'medium' };
    return { category: 'Obese', icon: '🚨', risk: 'high' };
}
function calculateDetailedScore(data) {
    let score = 0;
    if (data.age > 50) score += 2;
    if (data.bp > 140) score += 2;
    if (data.sugar > 150) score += 2;
    if (data.heartRate > 100) score += 1;
    
    // BMI scoring
    if (data.bmi >= 30) score += 2;
    else if (data.bmi >= 25) score += 1;
    
    // Smoking scoring
    if (data.smoking === 'current') score += 2;
    else if (data.smoking === 'former') score += 1;
    
    // Exercise scoring (bonus for good habits)
    if (data.exercise >= 5) score = Math.max(0, score - 1);
    
    // Family history scoring
    score += data.familyHistory.length;
    
    return Math.min(score, 10);
}

function getScoreBreakdown(assessment) {
    const breakdown = [];
    if (assessment.age > 50) {
        breakdown.push(`🔴 Age (${assessment.age} years): +2 points`);
    } else {
        breakdown.push(`🟢 Age (${assessment.age} years): 0 points`);
    }
    
    if (assessment.bp > 140) {
        breakdown.push(`🔴 Blood Pressure (${assessment.bp} mmHg): +2 points`);
    } else {
        breakdown.push(`🟢 Blood Pressure (${assessment.bp} mmHg): 0 points`);
    }
    
    if (assessment.sugar > 150) {
        breakdown.push(`🔴 Blood Sugar (${assessment.sugar} mg/dL): +2 points`);
    } else {
        breakdown.push(`🟢 Blood Sugar (${assessment.sugar} mg/dL): 0 points`);
    }
    
    if (assessment.heartRate > 100) {
        breakdown.push(`🟡 Heart Rate (${assessment.heartRate} bpm): +1 point`);
    } else {
        breakdown.push(`🟢 Heart Rate (${assessment.heartRate} bpm): 0 points`);
    }
    
    // BMI breakdown
    const bmiCat = getBMICategory(assessment.bmi);
    if (assessment.bmi >= 30) {
        breakdown.push(`🔴 BMI (${assessment.bmi}): +2 points - ${bmiCat.category}`);
    } else if (assessment.bmi >= 25) {
        breakdown.push(`🟡 BMI (${assessment.bmi}): +1 point - ${bmiCat.category}`);
    } else {
        breakdown.push(`🟢 BMI (${assessment.bmi}): 0 points - ${bmiCat.category}`);
    }
    
    // Smoking breakdown
    if (assessment.smoking === 'current') {
        breakdown.push(`🔴 Smoking Status (Current): +2 points`);
    } else if (assessment.smoking === 'former') {
        breakdown.push(`🟡 Smoking Status (Former): +1 point`);
    } else {
        breakdown.push(`🟢 Smoking Status (Never): 0 points`);
    }
    
    // Exercise breakdown
    if (assessment.exercise >= 5) {
        breakdown.push(`🟢 Exercise (${assessment.exercise}d/week): -1 point bonus`);
    } else {
        breakdown.push(`🟡 Exercise (${assessment.exercise}d/week): 0 points`);
    }
    
    // Family history
    if (assessment.familyHistory.length > 0) {
        breakdown.push(`⚠️ Family History (${assessment.familyHistory.join(', ')}): +${assessment.familyHistory.length} point(s)`);
    } else {
        breakdown.push(`🟢 Family History: No known conditions`);
    }
    
    return breakdown;
}

function getMetricsStatus(assessment) {
    const bmiCat = getBMICategory(assessment.bmi);
    return [
        {
            label: 'Age',
            value: assessment.age + ' yrs',
            status: assessment.age > 50 ? 'warning' : 'normal'
        },
        {
            label: 'Blood Pressure',
            value: assessment.bp + ' mmHg',
            status: assessment.bp > 140 ? 'danger' : 'normal'
        },
        {
            label: 'Blood Sugar',
            value: assessment.sugar + ' mg/dL',
            status: assessment.sugar > 150 ? 'danger' : 'normal'
        },
        {
            label: 'Heart Rate',
            value: assessment.heartRate + ' bpm',
            status: assessment.heartRate > 100 ? 'warning' : 'normal'
        },
        {
            label: 'BMI',
            value: assessment.bmi,
            status: assessment.bmi >= 30 ? 'danger' : (assessment.bmi >= 25 ? 'warning' : 'normal')
        },
        {
            label: 'Exercise',
            value: assessment.exercise + ' d/week',
            status: assessment.exercise >= 5 ? 'normal' : 'warning'
        }
    ];
}

// ================== HISTORY MANAGEMENT ==================
function saveToHistory(assessment) {
    try {
        healthHistory.unshift(assessment);
        if (healthHistory.length > 50) healthHistory.pop();
        const jsonData = JSON.stringify(healthHistory);
        localStorage.setItem('healthHistory', jsonData);
        console.log('Data saved to history:', assessment);
        displayHistory();
        updateAnalytics();
    } catch (error) {
        console.error('Error saving to history:', error);
    }
}

function loadHistory() {
    try {
        const saved = localStorage.getItem('healthHistory');
        if (saved) {
            healthHistory = JSON.parse(saved);
            console.log('Loaded history:', healthHistory);
        } else {
            healthHistory = [];
        }
        displayHistory();
    } catch (error) {
        console.error('Error loading history:', error);
        healthHistory = [];
    }
}

function displayHistory() {
    try {
        const historyList = document.getElementById('historyList');
        if (!historyList) {
            console.error('historyList element not found');
            return;
        }
        
        if (healthHistory.length === 0) {
            historyList.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <div class="empty-state-icon">📋</div>
                    <div class="empty-state-text">No assessment history yet</div>
                    <div class="empty-state-subtext">Complete assessments to see your history here</div>
                </div>
            `;
            return;
        }

        historyList.innerHTML = healthHistory.map((item, idx) => `
            <div class="history-item ${item.risk.toLowerCase()}">
                <div class="history-date">
                    ${new Date(item.timestamp).toLocaleDateString()} 
                    ${new Date(item.timestamp).toLocaleTimeString()}
                </div>
                <div class="history-person">
                    <strong>👤 ${item.name}</strong><br>
                    <small>📍 ${item.address}</small>
                </div>
                <div class="history-risk">🎯 ${item.risk} Risk | Score: ${item.score}/10</div>
                <div class="history-metrics">
                    <div>Age: ${item.age} yrs | Weight: ${item.weight}kg | Height: ${item.height}cm | BMI: ${item.bmi}</div>
                    <div>BP: ${item.bp} mmHg | Sugar: ${item.sugar} mg/dL | HR: ${item.heartRate} bpm</div>
                    <div>Exercise: ${item.exercise}d/week | Smoking: ${item.smoking}</div>
                    ${item.familyHistory.length > 0 ? `<div>🧬 Family History: ${item.familyHistory.join(', ')}</div>` : ''}
                </div>
                <button class="history-delete" onclick="deleteHistoryItem(${idx})">Delete</button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error displaying history:', error);
    }
}

function deleteHistoryItem(index) {
    if (confirm('Delete this assessment?')) {
        healthHistory.splice(index, 1);
        localStorage.setItem('healthHistory', JSON.stringify(healthHistory));
        displayHistory();
        updateAnalytics();
    }
}

function clearAllHistory() {
    if (confirm('Clear all history? This cannot be undone.')) {
        healthHistory = [];
        localStorage.removeItem('healthHistory');
        displayHistory();
        updateAnalytics();
        updateCharts();
    }
}

// ================== ANALYTICS ==================
function updateAnalytics() {
    try {
        const analyticsStats = document.getElementById('analyticsStats');
        if (!analyticsStats) {
            console.error('analyticsStats element not found');
            return;
        }

        if (healthHistory.length === 0) {
            analyticsStats.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <div class="empty-state-icon">📊</div>
                    <div class="empty-state-text">No data for analytics</div>
                    <div class="empty-state-subtext">Complete assessments to see analytics</div>
                </div>
            `;
            return;
        }

        const stats = calculateStatistics();
        analyticsStats.innerHTML = `
            <div class="stat-card">
                <div class="stat-label">Total Assessments</div>
                <div class="stat-value">${healthHistory.length}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Avg Risk Score</div>
                <div class="stat-value">${stats.avgScore.toFixed(1)}/10</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Avg Blood Pressure</div>
                <div class="stat-value">${stats.avgBP} mmHg</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Avg Heart Rate</div>
                <div class="stat-value">${stats.avgHR} bpm</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Avg Sugar Level</div>
                <div class="stat-value">${stats.avgSugar} mg/dL</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Risk Trend</div>
                <div class="stat-value">${stats.trend}</div>
            </div>
        `;

        updateCharts();
    } catch (error) {
        console.error('Error updating analytics:', error);
    }
}

function calculateStatistics() {
    const scores = healthHistory.map(h => h.score);
    const bps = healthHistory.map(h => h.bp);
    const hrs = healthHistory.map(h => h.heartRate);
    const sugars = healthHistory.map(h => h.sugar);

    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const avgBP = Math.round(bps.reduce((a, b) => a + b, 0) / bps.length);
    const avgHR = Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length);
    const avgSugar = Math.round(sugars.reduce((a, b) => a + b, 0) / sugars.length);

    let trend = '→ Stable';
    if (healthHistory.length > 1) {
        const recent = scores[0];
        const past = scores[Math.min(5, scores.length - 1)];
        if (recent > past) trend = '📈 Increasing';
        else if (recent < past) trend = '📉 Decreasing';
    }

    return { avgScore, avgBP, avgHR, avgSugar, trend };
}

function updateCharts() {
    try {
        if (healthHistory.length === 0) {
            console.log('No history data for charts');
            return;
        }
        
        // Delay chart updates to ensure DOM is ready
        setTimeout(() => {
            try {
                updateTrendChart();
                updateMetricsChart();
                updateScoreChart();
                updateStatusChart();
                console.log('Charts updated successfully');
            } catch (error) {
                console.warn('Some charts failed to update:', error.message);
            }
        }, 100);
    } catch (error) {
        console.error('Error updating charts:', error);
    }
}

function updateTrendChart() {
    try {
        const ctx = document.getElementById('trendChart');
        if (!ctx) {
            console.warn('trendChart canvas not found');
            return;
        }
        
        if (chartInstances.trend) chartInstances.trend.destroy();
        
        chartInstances.trend = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: healthHistory.slice().reverse().map((h, i) => `Assessment ${healthHistory.length - i}`),
                datasets: [{
                    label: 'Risk Score',
                    data: healthHistory.slice().reverse().map(h => h.score),
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: true } },
                scales: { y: { min: 0, max: 10 } }
            }
        });
    } catch (error) {
        console.warn('Error creating trend chart:', error.message);
    }
}

function updateMetricsChart() {
    const ctx = document.getElementById('metricsChart').getContext('2d');
    
    if (chartInstances.metrics) chartInstances.metrics.destroy();
    
    const stats = calculateStatistics();
    chartInstances.metrics = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Avg BP', 'Avg Sugar', 'Avg HR'],
                datasets: [{
                    label: 'Average Values',
                    data: [stats.avgBP / 2, stats.avgSugar / 2, stats.avgHR],
                    backgroundColor: ['#3498db', '#f39c12', '#2ecc71'],
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: true } },
                scales: { y: { beginAtZero: true } }
            }
        });
}

function updateScoreChart() {
    const ctx = document.getElementById('scoreChart').getContext('2d');
    
    if (chartInstances.score) chartInstances.score.destroy();
    try {
    const riskCounts = {
        low: healthHistory.filter(h => h.risk === 'Low').length,
        medium: healthHistory.filter(h => h.risk === 'Medium').length,
        high: healthHistory.filter(h => h.risk === 'High').length
    };

    chartInstances.score = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Low Risk', 'Medium Risk', 'High Risk'],
                datasets: [{
                    data: [riskCounts.low, riskCounts.medium, riskCounts.high],
                    backgroundColor: ['#2ecc71', '#f39c12', '#e74c3c'],
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    } catch (error) {
        console.warn('Error creating score chart:', error.message);
    }
}

function updateStatusChart() {
    const ctx = document.getElementById('statusChart').getContext('2d');
    
    if (chartInstances.status) chartInstances.status.destroy();
    try {
    const latest = healthHistory[0];
    if (!latest) return;

    const normalMetrics = [];
    if (latest.age <= 50) normalMetrics.push('Age');
    if (latest.bp <= 140) normalMetrics.push('BP');
    if (latest.sugar <= 150) normalMetrics.push('Sugar');
    if (latest.heartRate <= 100) normalMetrics.push('HR');

    chartInstances.status = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Age', 'BP', 'Sugar Level', 'Heart Rate'],
                datasets: [{
                    label: 'Current Metrics (normalized)',
                    data: [
                        (latest.age / 100) * 100,
                        (latest.bp / 200) * 100,
                        (latest.sugar / 200) * 100,
                        (latest.heartRate / 120) * 100
                    ],
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                scales: { r: { beginAtZero: true, max: 100 } },
                plugins: { legend: { display: true } }
            }
        });
    } catch (error) {
        console.warn('Error creating status chart:', error.message);
    }
}

// ================== HEALTH TIPS ==================
function displayTips(assessment) {
    try {
        const tipsContent = document.getElementById('tipsContent');
        if (!tipsContent) {
            console.error('tipsContent element not found');
            return;
        }
        const tips = generatePersonalizedTips(assessment);
        
        tipsContent.innerHTML = tips.map(category => `
            <div class="tips-category ${category.risk}">
                <h4>${category.title} ${category.icon}</h4>
                <ul class="tips-list">
                    ${category.items.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
        `).join('');
        
        console.log('Tips displayed for assessment:', assessment.risk);
    } catch (error) {
        console.error('Error displaying tips:', error);
    }
}

function generatePersonalizedTips(assessment) {
    const tips = [];

    // General tips
    tips.push({
        title: '💪 General Wellness',
        icon: '✨',
        risk: 'low',
        items: [
            'Exercise for at least 30 minutes daily',
            'Maintain a balanced diet rich in fruits and vegetables',
            'Stay hydrated - drink at least 8 glasses of water daily',
            'Get 7-9 hours of quality sleep every night',
            'Practice stress management through meditation or yoga'
        ]
    });

    // Age-specific tips
    if (assessment.age > 50) {
        tips.push({
            title: '👴 Age-Related Care',
            icon: '⚠️',
            risk: 'medium',
            items: [
                'Increase health screenings - annual check-ups recommended',
                'Include strength training to maintain muscle mass',
                'Focus on bone health with calcium and vitamin D',
                'Regular eye and hearing tests',
                'Consult with healthcare provider about preventive medications'
            ]
        });
    }

    // Hypertension tips
    if (assessment.bp > 140) {
        tips.push({
            title: '🩸 Blood Pressure Management',
            icon: '🚑',
            risk: 'high',
            items: [
                'URGENT: Consult a healthcare professional immediately',
                'Reduce sodium intake to less than 2,300mg per day',
                'Limit caffeine and alcohol consumption',
                'Perform aerobic exercises 5 days a week',
                'Monitor blood pressure regularly (daily or weekly)',
                'Consider medication if prescribed by doctor'
            ]
        });
    }

    // Diabetes tips
    if (assessment.sugar > 150) {
        tips.push({
            title: '🩺 Blood Sugar Control',
            icon: '🚑',
            risk: 'high',
            items: [
                'URGENT: Schedule an appointment with an endocrinologist',
                'Reduce refined sugar and simple carbohydrate intake',
                'Increase fiber intake through whole grains',
                'Monitor blood glucose levels regularly',
                'Maintain consistent meal times and portions',
                'Regular physical activity helps improve insulin sensitivity'
            ]
        });
    }

    // Heart rate tips
    if (assessment.heartRate > 100) {
        tips.push({
            title: '❤️ Heart Health',
            icon: '⚠️',
            risk: 'medium',
            items: [
                'Practice relaxation techniques to reduce resting heart rate',
                'Limit stimulants like coffee and energy drinks',
                'Engage in regular cardio exercises',
                'Monitor heart rate daily to track changes',
                'Consult cardiologist if rate remains elevated',
                'Avoid smoking and secondhand smoke'
            ]
        });
    }

    // Risk-level specific
    if (assessment.risk === 'High') {
        tips.push({
            title: '🚨 Immediate Actions',
            icon: '🚑',
            risk: 'high',
            items: [
                'Contact your healthcare provider immediately',
                'Consider scheduling an urgent appointment',
                'Have regular health check-ups at least monthly',
                'Keep emergency contacts easily accessible',
                'Maintain a health diary to track symptoms',
                'Follow all medical prescriptions strictly'
            ]
        });
    } else if (assessment.risk === 'Medium') {
        tips.push({
            title: '⚠️ Preventive Measures',
            icon: '📋',
            risk: 'medium',
            items: [
                'Schedule a check-up with your doctor within 2 weeks',
                'Start a regular exercise routine',
                'Review and improve your diet',
                'Monitor key vital signs weekly',
                'Consider lifestyle coaching or support groups',
                'Learn about your family health history'
            ]
        });
    }

    return tips;
}

// ================== PDF EXPORT ==================
function exportPDF() {
    if (!currentAssessment) {
        alert('Please complete an assessment first');
        return;
    }

    const element = document.createElement('div');
    element.innerHTML = generatePDFContent();
    element.style.padding = '20px';
    element.style.fontFamily = 'Arial, sans-serif';

    const opt = {
        margin: 10,
        filename: `health-report-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };

    html2pdf().set(opt).from(element).save();
}

function generatePDFContent() {
    const assessment = currentAssessment;
    const stats = calculateStatistics();
    const date = new Date(assessment.timestamp);
    const healthIndex = calculateHealthScoreIndex(assessment);

    return `
        <div style="text-align: center; margin-bottom: 20px;">
            <h1>🏥 Health Risk Assessment Report</h1>
            <p>Generated: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}</p>
        </div>

        <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
            <h2>Patient Information</h2>
            <p><strong>Name:</strong> ${assessment.name}</p>
            <p><strong>Address:</strong> ${assessment.address}</p>
            <p><strong>Age:</strong> ${assessment.age} years</p>
        </div>

        <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
            <h2>Assessment Results</h2>
            <p><strong>Risk Level:</strong> ${assessment.risk.toUpperCase()}</p>
            <p><strong>Risk Score:</strong> ${assessment.score}/10</p>
            <p><strong>Health Index Score:</strong> ${healthIndex}/100</p>
            <p><strong>Assessment:</strong> ${assessment.advice}</p>
        </div>

        <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
            <h2>Vital Metrics & Personal Data</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <tr style="background: #f0f0f0;">
                    <th style="border: 1px solid #ddd; padding: 8px;">Metric</th>
                    <th style="border: 1px solid #ddd; padding: 8px;">Value</th>
                    <th style="border: 1px solid #ddd; padding: 8px;">Status</th>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">Age</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${assessment.age} years</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${assessment.age > 50 ? 'Above Normal' : 'Normal'}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">Height / Weight</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${assessment.height} cm / ${assessment.weight} kg</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">-</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">BMI</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${assessment.bmi}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${assessment.bmi >= 30 ? 'Obese' : (assessment.bmi >= 25 ? 'Overweight' : 'Normal')}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">Blood Pressure</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${assessment.bp} mmHg</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${assessment.bp > 140 ? 'High' : 'Normal'}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">Blood Sugar</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${assessment.sugar} mg/dL</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${assessment.sugar > 150 ? 'High' : 'Normal'}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">Heart Rate</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${assessment.heartRate} bpm</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${assessment.heartRate > 100 ? 'Elevated' : 'Normal'}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">Smoking Status</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${assessment.smoking.charAt(0).toUpperCase() + assessment.smoking.slice(1)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${assessment.smoking === 'current' ? 'High Risk' : 'Good'}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">Exercise Frequency</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${assessment.exercise} days/week</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${assessment.exercise >= 5 ? 'Good' : 'Needs Improvement'}</td>
                </tr>
                ${assessment.familyHistory.length > 0 ? `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">Family History</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${assessment.familyHistory.join(', ')}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">High Risk</td>
                </tr>
                ` : ''}
            </table>
        </div>

        ${healthHistory.length > 1 ? `
            <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
                <h2>Historical Trends</h2>
                <p><strong>Total Assessments:</strong> ${healthHistory.length}</p>
                <p><strong>Average Score:</strong> ${stats.avgScore.toFixed(1)}/10</p>
                <p><strong>Average BP:</strong> ${stats.avgBP} mmHg</p>
                <p><strong>Average HR:</strong> ${stats.avgHR} bpm</p>
                <p><strong>Trend:</strong> ${stats.trend}</p>
            </div>
        ` : ''}

        <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; background: #fffacd;">
            <p><strong>⚠️ Disclaimer:</strong> This assessment is for informational purposes only and should not be considered as medical advice. 
            Please consult with a qualified healthcare professional for proper diagnosis and treatment.</p>
        </div>
    `;
}

// ================== DARK MODE ==================
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    updateDarkModeButton();
}

function loadDarkMode() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
    }
    updateDarkModeButton();
}

function updateDarkModeButton() {
    const btn = document.getElementById('darkModeBtn');
    const isDark = document.body.classList.contains('dark-mode');
    btn.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
}

// ================== CSV EXPORT ==================
function exportCSV() {
    if (healthHistory.length === 0) {
        alert('No records to export');
        return;
    }

    let csv = 'Date,Name,Address,Age,Weight(kg),Height(cm),BMI,BP(mmHg),Sugar(mg/dL),HR(bpm),Smoking,Exercise(days),Family History,Risk Level,Risk Score,Health Index\n';
    
    healthHistory.forEach(record => {
        const date = new Date(record.timestamp).toLocaleDateString();
        const healthIndex = calculateHealthScoreIndex(record);
        const familyHist = record.familyHistory.join('|') || 'None';
        csv += `"${date}","${record.name}","${record.address}",${record.age},${record.weight},${record.height},${record.bmi},${record.bp},${record.sugar},${record.heartRate},"${record.smoking}",${record.exercise},"${familyHist}","${record.risk}",${record.score},${healthIndex}\n`;
    });

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', `health-records-${new Date().toISOString().split('T')[0]}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    alert('✅ Records exported successfully!');
}

// ================== TAB SWITCHING ==================
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Deactivate all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName).classList.add('active');

    // Activate selected button
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update charts if switching to analytics
    if (tabName === 'analytics') {
        setTimeout(updateCharts, 100);
    }
}
