const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const hostelRoutes = require('./routes/hostels');
const roomRoutes = require('./routes/rooms');
const tenantRoutes = require('./routes/tenants');
const paymentRoutes = require('./routes/payments');
const ebRoutes = require('./routes/electricity');
const complaintRoutes = require('./routes/complaints');
const dashboardRoutes = require('./routes/dashboard');
const aiRoutes = require('./routes/ai');
const notificationRoutes = require('./routes/notifications');
const reportRoutes = require('./routes/reports');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/hostels', hostelRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/electricity', ebRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '1.0.0' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🏠 Hostel API running on port ${PORT}`));

module.exports = app;
