import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import reportRoutes from './routes/reports';
import reportDetailRoutes from './routes/reportDetail';
import attendanceRoutes from './routes/attendance';
import activityRoutes from './routes/activities';
import dashboardRoutes from './routes/dashboard';
import testRoutes from './routes/test';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan('dev'));

// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Add a middleware to debug request body parsing
app.use((req, res, next) => {
  if (req.method === 'POST' && req.path.includes('assign-supervisor')) {
    console.log('Global middleware - Request body check:');
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Has body parser run:', typeof req.body === 'object');
    console.log('Body content:', req.body);
  }
  next();
});

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  const defaultEnv = `PORT=5001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=employee_tracker
JWT_SECRET=your_jwt_secret_key_here`;
  
  fs.writeFileSync(envPath, defaultEnv);
  console.log('Created default .env file');
}

// Routes
app.use('/test', testRoutes);
app.use('/api/auth', authRoutes);

// Add console log to verify routes are being registered correctly
console.log('Registering user routes...');

// Make sure your users routes are properly mounted
// The path prefix should match what you're using in Postman
app.use('/api/users', userRoutes);

app.use('/api/reports', reportRoutes);
app.use('/api/report-details', reportDetailRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Employee Performance Tracking API');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Schedule the daily attendance check (runs at midnight)
import { scheduleDailyAttendanceCheck } from './utils/scheduler';
scheduleDailyAttendanceCheck();