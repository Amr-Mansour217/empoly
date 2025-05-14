"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reportDetail_1 = __importDefault(require("../controllers/reportDetail"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Get report details by employee ID and date
router.get('/employee/:employeeId/date/:date', auth_1.authenticateToken, auth_1.isOwnerOrSupervisor, reportDetail_1.default.getReportByEmployeeAndDate);
exports.default = router;
