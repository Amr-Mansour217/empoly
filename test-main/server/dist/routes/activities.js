"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const activities_1 = __importDefault(require("../controllers/activities"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Public routes (accessible to all authenticated users)
router.get('/', auth_1.authenticateToken, activities_1.default.getAllActivities);
router.get('/:id', auth_1.authenticateToken, activities_1.default.getActivityById);
// Admin only routes
router.post('/', auth_1.authenticateToken, auth_1.isAdmin, activities_1.default.createActivity);
router.put('/:id', auth_1.authenticateToken, auth_1.isAdmin, activities_1.default.updateActivity);
router.delete('/:id', auth_1.authenticateToken, auth_1.isAdmin, activities_1.default.deleteActivity);
exports.default = router;
