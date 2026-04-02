const express = require('express');
const cors = require('cors');
const path = require('path');

const healthRoutes = require('./routes/healthRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/health', healthRoutes);

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));