"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reports_1 = __importDefault(require("../controllers/reports"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Employee routes
router.post('/', auth_1.authenticateToken, reports_1.default.createReport);
router.get('/me/current', auth_1.authenticateToken, reports_1.default.getCurrentEmployeeReport);
// Admin and supervisor routes
router.get('/', auth_1.authenticateToken, auth_1.isSupervisor, reports_1.default.getAllReports);
router.get('/stats', auth_1.authenticateToken, auth_1.isSupervisor, reports_1.default.getSummaryStats);
// Protected routes with ownership check
router.get('/:id', auth_1.authenticateToken, auth_1.isOwnerOrSupervisor, reports_1.default.getReportById);
router.get('/employee/:id', auth_1.authenticateToken, auth_1.isOwnerOrSupervisor, reports_1.default.getReportsByEmployeeId);
router.get('/employee/:id/details', auth_1.authenticateToken, auth_1.isOwnerOrSupervisor, reports_1.default.getEmployeeReportDetails);
exports.default = router;
