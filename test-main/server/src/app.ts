import express from 'express';
import userRoutes from './routes/users';

const app = express();

// Ensure body parser is configured before routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware for all POST requests
app.use((req, res, next) => {
  if (req.method === 'POST') {
    console.log(`[DEBUG] ${req.method} ${req.path}`);
    console.log('Headers:', JSON.stringify(req.headers));
    console.log('Body:', req.body);
  }
  next();
});

// Make sure you're using the correct path for your API
app.use('/api/users', userRoutes);

export default app;