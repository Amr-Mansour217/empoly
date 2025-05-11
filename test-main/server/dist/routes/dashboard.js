"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dashboard_1 = __importDefault(require("../controllers/dashboard"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Admin and supervisor routes
router.get('/', auth_1.authenticateToken, auth_1.isSupervisor, dashboard_1.default.getDashboardData);
// Employee routes
router.get('/employee', auth_1.authenticateToken, dashboard_1.default.getEmployeeDashboard);
exports.default = router;
