"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const users_1 = __importDefault(require("./routes/users"));
const app = (0, express_1.default)();
// Ensure body parser is configured before routes
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
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
app.use('/api/users', users_1.default);
exports.default = app;
