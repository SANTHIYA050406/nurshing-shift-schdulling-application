const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
const nurseRoutes = require('./routes/nurseRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const overtimeRoutes = require('./routes/overtimeRoutes');

app.use('/api/nurses', nurseRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/overtime', overtimeRoutes);

// Serve Frontend Static Files
const distPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(distPath));

// SPA Fallback for client-side routing
app.use((req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nursing_portal')
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

app.listen(PORT, () => {
    console.log(`Integrated Server is running on port ${PORT}`);
});
