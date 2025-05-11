"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const activity_1 = __importDefault(require("../models/activity"));
class ActivityController {
    // Get all activity types
    getAllActivities(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const activities = yield activity_1.default.getAll();
                return res.status(200).json({ activities });
            }
            catch (error) {
                console.error('Get all activities error:', error);
                return res.status(500).json({ message: 'An error occurred while getting activities' });
            }
        });
    }
    // Get activity type by ID
    getActivityById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const activityId = parseInt(req.params.id);
                if (isNaN(activityId)) {
                    return res.status(400).json({ message: 'Invalid activity ID' });
                }
                const activity = yield activity_1.default.getById(activityId);
                if (!activity) {
                    return res.status(404).json({ message: 'Activity not found' });
                }
                return res.status(200).json({ activity });
            }
            catch (error) {
                console.error('Get activity by ID error:', error);
                return res.status(500).json({ message: 'An error occurred while getting activity' });
            }
        });
    }
    // Create a new activity type (admin only)
    createActivity(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { name } = req.body;
                if (!name) {
                    return res.status(400).json({ message: 'Activity name is required' });
                }
                const activityId = yield activity_1.default.create(name);
                return res.status(201).json({
                    message: 'Activity created successfully',
                    activityId
                });
            }
            catch (error) {
                console.error('Create activity error:', error);
                return res.status(500).json({ message: 'An error occurred while creating activity' });
            }
        });
    }
    // Update an activity type (admin only)
    updateActivity(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const activityId = parseInt(req.params.id);
                const { name } = req.body;
                if (isNaN(activityId)) {
                    return res.status(400).json({ message: 'Invalid activity ID' });
                }
                if (!name) {
                    return res.status(400).json({ message: 'Activity name is required' });
                }
                // Check if activity exists
                const activity = yield activity_1.default.getById(activityId);
                if (!activity) {
                    return res.status(404).json({ message: 'Activity not found' });
                }
                // Update activity
                const updated = yield activity_1.default.update(activityId, name);
                if (!updated) {
                    return res.status(400).json({ message: 'No changes were made' });
                }
                return res.status(200).json({ message: 'Activity updated successfully' });
            }
            catch (error) {
                console.error('Update activity error:', error);
                return res.status(500).json({ message: 'An error occurred while updating activity' });
            }
        });
    }
    // Delete an activity type (admin only)
    deleteActivity(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const activityId = parseInt(req.params.id);
                if (isNaN(activityId)) {
                    return res.status(400).json({ message: 'Invalid activity ID' });
                }
                // Check if activity exists
                const activity = yield activity_1.default.getById(activityId);
                if (!activity) {
                    return res.status(404).json({ message: 'Activity not found' });
                }
                // Delete activity
                const deleted = yield activity_1.default.delete(activityId);
                if (!deleted) {
                    return res.status(500).json({ message: 'Failed to delete activity' });
                }
                return res.status(200).json({ message: 'Activity deleted successfully' });
            }
            catch (error) {
                console.error('Delete activity error:', error);
                return res.status(500).json({ message: 'An error occurred while deleting activity' });
            }
        });
    }
}
exports.default = new ActivityController();
