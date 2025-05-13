import express ,{ Request, Response } from 'express';
import userModel from '../models/user';
import { pool } from '../config/db';

const app = express();



class UserController {
  // Get all supervisors
  async getAllSupervisors(req: Request, res: Response) {
    try {
      const supervisors = await userModel.getAllSupervisors();
      console.log(`Supervisors API - Found ${supervisors.length} supervisors`);
      
      // Always return 200 status with the supervisors array, even if empty
      // This prevents frontend errors and simplifies client-side handling
      return res.status(200).json({ 
        success: true,
        supervisors,
        message: supervisors.length === 0 ? 'No supervisors found, you may need to create users first' : undefined
      });
    } catch (error) {
      console.error('Get all supervisors error:', error);
      // Return 200 with empty array instead of 500 to prevent UI errors
      return res.status(200).json({ 
        success: false, 
        supervisors: [],
        message: 'An error occurred while getting supervisors, but we returned an empty list to prevent UI errors.' 
      });
    }
  }

  // Get all users
  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await userModel.getAll();
      console.log(`Users API - Found ${users.length} users`);
      return res.status(200).json({ 
        users,
        success: true,
        // If no users are found, provide an informative message
        message: users.length === 0 ? 'No users found in the system yet' : undefined 
      });
    } catch (error) {
      console.error('Get all users error:', error);
      return res.status(500).json({ 
        success: false,
        message: 'An error occurred while getting users',
        users: [] // Always include empty users array even on error
      });
    }
  }
  
  // Get user by ID
  async getUserById(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id, 10); // Add radix parameter

      // Improved validation with more descriptive error message
      if (isNaN(userId) || userId <= 0) {
        console.log(`Invalid user ID provided: ${req.params.id}`);
        return res.status(400).json({ 
          message: 'Invalid user ID', 
          details: { providedId: req.params.id }
        });
      }
      
      console.log(`Looking for user with ID: ${userId}`);
      const user = await userModel.getById(userId);
      
      if (!user) {
        console.log(`User not found with ID: ${userId}`);
        return res.status(404).json({ message: 'User not found' });
      }
      
      return res.status(200).json({ user });
    } catch (error) {
      console.error('Get user by ID error:', error);
      return res.status(500).json({ message: 'An error occurred while getting user' });
    }
  }
  
  // Update user
  async updateUser(req: Request, res: Response) {
    try {
      console.log('Update user request received:', {
        userId: req.params.id,
        body: req.body
      });
      
      const userId = parseInt(req.params.id, 10);
      const { full_name, phone, nationality, location, role } = req.body;
      
      if (isNaN(userId) || userId <= 0) {
        console.log(`Invalid user ID: ${req.params.id}`);
        return res.status(400).json({ 
          message: 'Invalid user ID',
          details: { providedId: req.params.id } 
        });
      }
      
      // Check if user exists directly in database
      try {
        // Check if the user exists
        const [userRows]: any = await pool.execute('SELECT * FROM users WHERE id = ?', [userId]);
        
        if (!userRows || userRows.length === 0) {
          console.log(`User not found with ID: ${userId}`);
          return res.status(404).json({ message: 'User not found' });
        }
        
        const user = userRows[0];
        console.log(`Found user:`, user);
        
        // Build SQL update query dynamically
        let updates = [];
        let params = [];
        
        if (full_name !== undefined && full_name !== user.full_name) {
          updates.push('full_name = ?');
          params.push(full_name);
        }
        
        if (phone !== undefined && phone !== user.phone) {
          updates.push('phone = ?');
          params.push(phone);
        }
        
        if (nationality !== undefined && nationality !== user.nationality) {
          updates.push('nationality = ?');
          params.push(nationality);
        }
        
        if (location !== undefined && location !== user.location) {
          updates.push('location = ?');
          params.push(location);
        }
        
        if (role !== undefined && role !== user.role) {
          updates.push('role = ?');
          params.push(role);
        }
        
        // If nothing to update, return success
        if (updates.length === 0) {
          console.log('No changes detected, returning success');
          return res.status(200).json({ 
            message: 'No changes were needed',
            success: true,
            unchanged: true
          });
        }
        
        // Add user ID to params
        params.push(userId);
        
        // Execute the update directly
        console.log('Executing update with:', { updates, params });
        const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
        console.log('Update query:', query);
        
        const [updateResult]: any = await pool.execute(query, params);
        
        console.log('Update result:', updateResult);
        
        // Always assume success if we got this far
        return res.status(200).json({ 
          message: 'User updated successfully',
          success: true
        });
        
      } catch (dbError: any) {
        console.error('Database error during update:', dbError);
        return res.status(500).json({ 
          message: 'Database error occurred during update',
          success: false,
          details: dbError.message
        });
      }
    } catch (error: any) {
      console.error('Update user error:', error);
      return res.status(500).json({ 
        message: 'An error occurred while updating user',
        error: error.message || 'Unknown error',
        success: false
      });
    }
  }
  
  // Delete user
  async deleteUser(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id, 10);
      console.log('Delete request for user ID:', userId);
      
      if (isNaN(userId) || userId <= 0) {
        console.log(`Invalid user ID format: ${req.params.id}`);
        return res.status(400).json({ 
          message: 'Invalid user ID format',
          success: false 
        });
      }
      
      // Use a simplified approach without transactions
      try {
        // Check if the user exists
        const [userCheckResult]: any = await pool.execute('SELECT id FROM users WHERE id = ?', [userId]);
        
        if (!userCheckResult || userCheckResult.length === 0) {
          return res.status(404).json({ 
            message: 'User not found in database',
            success: false
          });
        }
        
        console.log(`Found user with ID ${userId}, proceeding with deletion`);
        
        // First remove any supervisor assignments
        console.log('Removing supervisor assignments...');
        await pool.execute(
          'DELETE FROM employee_supervisors WHERE employee_id = ? OR supervisor_id = ?', 
          [userId, userId]
        );
        
        // Then delete the user
        console.log('Deleting user...');
        const [deleteResult]: any = await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
        
        console.log('Delete operation result:', deleteResult);
        
        // Always assume success if we got this far without errors
        console.log(`Successfully deleted user ${userId}`);
        return res.status(200).json({ 
          message: 'User deleted successfully',
          success: true 
        });
        
      } catch (dbError: any) {
        console.error('Full database error:', dbError);
        
        // Check for foreign key constraint violations
        if (dbError.code === 'ER_ROW_IS_REFERENCED' || dbError.errno === 1451) {
          return res.status(400).json({
            message: 'Cannot delete this user because they are referenced by other records',
            success: false
          });
        }
        
        // Return more specific error details to help diagnose the issue
        return res.status(500).json({ 
          message: 'Database error occurred',
          success: false,
          details: dbError.message,
          code: dbError.code || dbError.errno
        });
      }
      
    } catch (error: any) {
      console.error('Delete user error:', error);
      return res.status(500).json({ 
        message: 'An error occurred while deleting user',
        success: false
      });
    }
  }
  
  // Get all employees
  async getAllEmployees(req: Request, res: Response) {
    try {
      const employees = await userModel.getAllEmployees();
      return res.status(200).json({ employees });
    } catch (error) {
      console.error('Get all employees error:', error);
      return res.status(500).json({ message: 'An error occurred while getting employees' });
    }
  }
  
  // Get employees by supervisor ID
  async getEmployeesBySupervisor(req: Request, res: Response) {
    try {
      const supervisorId = parseInt(req.params.id);
      
      if (isNaN(supervisorId)) {
        return res.status(400).json({ message: 'Invalid supervisor ID' });
      }
      
      // Check if supervisor exists
      const supervisor = await userModel.getById(supervisorId);
      if (!supervisor) {
        return res.status(404).json({ message: 'Supervisor not found' });
      }
      
      // Get employees
      const employees = await userModel.getEmployeesBySupervisor(supervisorId);
      
      return res.status(200).json({ employees });
    } catch (error) {
      console.error('Get employees by supervisor error:', error);
      return res.status(500).json({ message: 'An error occurred while getting employees' });
    }
  }
  
  // Get supervisor for employee
  async getSupervisorForEmployee(req: Request, res: Response) {
    try {
      const employeeId = parseInt(req.params.id);
      
      if (isNaN(employeeId)) {
        return res.status(400).json({ message: 'Invalid employee ID' });
      }
      
      // Check if employee exists
      const employee = await userModel.getById(employeeId);
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      
      // Get supervisor
      const supervisor = await userModel.getSupervisorForEmployee(employeeId);
      
      // Return 200 even when no supervisor is found, just with null supervisor property
      // This prevents client-side error handling for what's a normal state
      if (!supervisor) {
        return res.status(200).json({ 
          supervisor: null, 
          message: 'No supervisor assigned to this employee',
          success: true
        });
      }
      
      return res.status(200).json({ supervisor, success: true });
    } catch (error) {
      console.error('Get supervisor for employee error:', error);
      return res.status(500).json({ message: 'An error occurred while getting supervisor' });
    }
  }
  
  // Get all supervisor assignments at once (optimization)
  async getAllSupervisorAssignments(req: Request, res: Response) {
    try {
      const [assignments]: any = await pool.execute('SELECT * FROM employee_supervisors');
      
      return res.status(200).json({
        success: true,
        assignments: assignments || []
      });
    } catch (error) {
      console.error('Get all supervisor assignments error:', error);
      return res.status(200).json({ 
        success: false, 
        assignments: [],
        message: 'An error occurred while getting supervisor assignments'
      });
    }
  }
}

export default new UserController();