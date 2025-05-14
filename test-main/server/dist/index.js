"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Routes
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const reports_1 = __importDefault(require("./routes/reports"));
const attendance_1 = __importDefault(require("./routes/attendance"));
const activities_1 = __importDefault(require("./routes/activities"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const test_1 = __importDefault(require("./routes/test"));
// Load environment variables
dotenv_1.default.config();
// Create Express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5001;
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('dev'));
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
const envPath = path_1.default.join(__dirname, '..', '.env');
if (!fs_1.default.existsSync(envPath)) {
    const defaultEnv = `PORT=5001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=employee_tracker
JWT_SECRET=your_jwt_secret_key_here`;
    fs_1.default.writeFileSync(envPath, defaultEnv);
    console.log('Created default .env file');
}
// Routes
app.use('/test', test_1.default);
app.use('/api/auth', auth_1.default);
// Add console log to verify routes are being registered correctly
console.log('Registering user routes...');
// Make sure your users routes are properly mounted
// The path prefix should match what you're using in Postman
app.use('/api/users', users_1.default);
app.use('/api/reports', reports_1.default);
app.use('/api/attendance', attendance_1.default);
app.use('/api/activities', activities_1.default);
app.use('/api/dashboard', dashboard_1.default);
// Root route
app.get('/', (req, res) => {
    res.send('Employee Performance Tracking API');
});
// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
// Schedule the daily attendance check (runs at midnight)
const scheduler_1 = require("./utils/scheduler");
(0, scheduler_1.scheduleDailyAttendanceCheck)();
