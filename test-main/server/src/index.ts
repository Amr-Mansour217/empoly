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
import attendanceRoutes from './routes/attendance';
import activityRoutes from './routes/activities';
import dashboardRoutes from './routes/dashboard';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

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
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
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