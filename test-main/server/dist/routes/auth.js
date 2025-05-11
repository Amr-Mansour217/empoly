"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../controllers/auth"));
const auth_2 = require("../middleware/auth");
const router = express_1.default.Router();
// Public routes
router.post('/login', auth_1.default.login);
// Protected routes
router.post('/register', auth_2.authenticateToken, auth_2.isAdmin, auth_1.default.register);
router.get('/me', auth_2.authenticateToken, auth_1.default.getCurrentUser);
router.post('/change-password', auth_2.authenticateToken, auth_1.default.changePassword);
exports.default = router;
