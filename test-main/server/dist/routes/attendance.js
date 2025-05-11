"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const attendance_1 = __importDefault(require("../controllers/attendance"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Admin only routes
router.post('/mark', auth_1.authenticateToken, auth_1.isAdmin, attendance_1.default.markAttendance);
router.post('/check', auth_1.authenticateToken, auth_1.isAdmin, attendance_1.default.runDailyAttendanceCheck);
// Admin and supervisor routes
router.get('/', auth_1.authenticateToken, auth_1.isSupervisor, attendance_1.default.getAllAttendance);
router.get('/today', auth_1.authenticateToken, auth_1.isSupervisor, attendance_1.default.getTodayAttendance);
// Protected routes with ownership check
router.get('/employee/:id', auth_1.authenticateToken, auth_1.isOwnerOrSupervisor, attendance_1.default.getEmployeeAttendance);
exports.default = router;
