"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const users_1 = __importDefault(require("../controllers/users"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Admin only routes
router.get('/', auth_1.authenticateToken, auth_1.isAdmin, users_1.default.getAllUsers);
router.post('/:id', auth_1.authenticateToken, auth_1.isAdmin, users_1.default.updateUser);
router.delete('/:id', auth_1.authenticateToken, auth_1.isAdmin, users_1.default.deleteUser);
// Admin and supervisor routes
router.get('/employees', auth_1.authenticateToken, auth_1.isSupervisor, users_1.default.getAllEmployees);
// Make supervisors endpoint accessible to anyone authenticated (remove isSupervisor restriction)
router.get('/supervisors', auth_1.authenticateToken, users_1.default.getAllSupervisors);
router.post('/assign-supervisor', auth_1.authenticateToken, auth_1.isAdmin, users_1.default.assignSupervisor);
// Protected routes with ownership check
router.get('/:id([0-9]+)', auth_1.authenticateToken, auth_1.isOwnerOrSupervisor, users_1.default.getUserById);
router.get('/:id/supervisor', auth_1.authenticateToken, auth_1.isOwnerOrSupervisor, users_1.default.getSupervisorForEmployee);
router.get('/supervisor/:id/employees', auth_1.authenticateToken, auth_1.isSupervisor, users_1.default.getEmployeesBySupervisor);
exports.default = router;
