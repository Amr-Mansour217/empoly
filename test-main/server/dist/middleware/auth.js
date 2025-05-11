"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isOwnerOrSupervisor = exports.isSupervisor = exports.isAdmin = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    try {
        const secret = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(403).json({ message: 'Invalid token.' });
    }
};
exports.authenticateToken = authenticateToken;
// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    }
    else {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
};
exports.isAdmin = isAdmin;
// Middleware to check if user is supervisor
const isSupervisor = (req, res, next) => {
    if (req.user && (req.user.role === 'supervisor' || req.user.role === 'admin')) {
        next();
    }
    else {
        return res.status(403).json({ message: 'Access denied. Supervisor privileges required.' });
    }
};
exports.isSupervisor = isSupervisor;
// Middleware to check if user is the owner of the resource or a supervisor/admin
const isOwnerOrSupervisor = (req, res, next) => {
    const userId = parseInt(req.params.id);
    if (req.user && (req.user.id === userId || req.user.role === 'supervisor' || req.user.role === 'admin')) {
        next();
    }
    else {
        return res.status(403).json({ message: 'Access denied. You do not have permission to access this resource.' });
    }
};
exports.isOwnerOrSupervisor = isOwnerOrSupervisor;
