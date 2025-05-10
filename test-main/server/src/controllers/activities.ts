import { Request, Response } from 'express';
import activityModel from '../models/activity';

class ActivityController {
  // Get all activity types
  async getAllActivities(req: Request, res: Response) {
    try {
      const activities = await activityModel.getAll();
      return res.status(200).json({ activities });
    } catch (error) {
      console.error('Get all activities error:', error);
      return res.status(500).json({ message: 'An error occurred while getting activities' });
    }
  }
  
  // Get activity type by ID
  async getActivityById(req: Request, res: Response) {
    try {
      const activityId = parseInt(req.params.id);
      
      if (isNaN(activityId)) {
        return res.status(400).json({ message: 'Invalid activity ID' });
      }
      
      const activity = await activityModel.getById(activityId);
      
      if (!activity) {
        return res.status(404).json({ message: 'Activity not found' });
      }
      
      return res.status(200).json({ activity });
    } catch (error) {
      console.error('Get activity by ID error:', error);
      return res.status(500).json({ message: 'An error occurred while getting activity' });
    }
  }
  
  // Create a new activity type (admin only)
  async createActivity(req: Request, res: Response) {
    try {
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: 'Activity name is required' });
      }
      
      const activityId = await activityModel.create(name);
      
      return res.status(201).json({
        message: 'Activity created successfully',
        activityId
      });
    } catch (error) {
      console.error('Create activity error:', error);
      return res.status(500).json({ message: 'An error occurred while creating activity' });
    }
  }
  
  // Update an activity type (admin only)
  async updateActivity(req: Request, res: Response) {
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
      const activity = await activityModel.getById(activityId);
      if (!activity) {
        return res.status(404).json({ message: 'Activity not found' });
      }
      
      // Update activity
      const updated = await activityModel.update(activityId, name);
      
      if (!updated) {
        return res.status(400).json({ message: 'No changes were made' });
      }
      
      return res.status(200).json({ message: 'Activity updated successfully' });
    } catch (error) {
      console.error('Update activity error:', error);
      return res.status(500).json({ message: 'An error occurred while updating activity' });
    }
  }
  
  // Delete an activity type (admin only)
  async deleteActivity(req: Request, res: Response) {
    try {
      const activityId = parseInt(req.params.id);
      
      if (isNaN(activityId)) {
        return res.status(400).json({ message: 'Invalid activity ID' });
      }
      
      // Check if activity exists
      const activity = await activityModel.getById(activityId);
      if (!activity) {
        return res.status(404).json({ message: 'Activity not found' });
      }
      
      // Delete activity
      const deleted = await activityModel.delete(activityId);
      
      if (!deleted) {
        return res.status(500).json({ message: 'Failed to delete activity' });
      }
      
      return res.status(200).json({ message: 'Activity deleted successfully' });
    } catch (error) {
      console.error('Delete activity error:', error);
      return res.status(500).json({ message: 'An error occurred while deleting activity' });
    }
  }
}

export default new ActivityController(); 