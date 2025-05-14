import { Request, Response } from 'express';
import userModel from '../models/user';
import { pool } from '../config/db';

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
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const user = await userModel.getById(userId);
      
      if (!user) {
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
      const userId = parseInt(req.params.id);
      const { full_name, phone, nationality, location, role } = req.body;
      
      console.log('Updating user:', {
        userId,
        updates: { full_name, phone, nationality, location, role }
      });
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      // Check if user exists
      const user = await userModel.getById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check for any changes before updating
      const currentValues = {
        full_name: user.full_name,
        phone: user.phone || null,
        nationality: user.nationality || null,
        location: user.location || null,
        role: user.role
      };
      
      const updates = {
        full_name,
        phone: phone || null,
        nationality: nationality || null,
        location: location || null,
        role: role as 'admin' | 'supervisor' | 'employee'
      };
      
      // Compare if any field has changed
      const hasChanges = Object.keys(updates).some(key => {
        // @ts-ignore
        return updates[key] !== currentValues[key];
      });
      
      if (!hasChanges) {
        console.log('No changes detected during update for user:', userId);
        return res.status(200).json({ 
          message: 'No changes were detected', 
          success: true 
        });
      }
      
      // Update user if there are changes
      const updated = await userModel.update(userId, updates);
      
      if (!updated) {
        console.log('Update operation returned false for user:', userId);
        return res.status(200).json({ 
          message: 'No changes were made', 
          success: true,
          details: 'The database reported no changes were made'
        });
      }
      
      console.log('User updated successfully:', userId);
      return res.status(200).json({ message: 'User updated successfully', success: true });
    } catch (error) {
      console.error('Update user error:', error);
      return res.status(500).json({ message: 'An error occurred while updating user' });
    }
  }
  
  // Delete user
  async deleteUser(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      // Check if user exists
      const user = await userModel.getById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      try {
        // Delete user
        const deleted = await userModel.delete(userId);
        
        if (!deleted) {
          return res.status(500).json({ message: 'Failed to delete user' });
        }
        
        return res.status(200).json({ message: 'User deleted successfully' });
      } catch (deleteError: any) {
        console.error('Error during user deletion:', deleteError);
        
        // Check if this might be a foreign key constraint error
        // but the delete may have actually succeeded due to database cascading
        const errorMessage = deleteError.message || String(deleteError);
        
        // After attempting deletion, try to verify if the user still exists
        try {
          const userStillExists = await userModel.getById(userId);
          
          if (!userStillExists) {
            // User was actually deleted despite the error
            console.log(`User ${userId} no longer exists - delete likely succeeded despite error`);
            return res.status(200).json({ 
              message: 'User deleted successfully', 
              note: 'Operation succeeded despite database constraint issues'
            });
          }
        } catch (verifyError) {
          console.error('Error verifying user existence after delete attempt:', verifyError);
        }
        
        // Rethrow if user still exists
        throw deleteError;
      }
    } catch (error) {
      console.error('Delete user error:', error);
      return res.status(500).json({ message: 'An error occurred while deleting user' });
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
  
  // Assign supervisor to employee
  async assignSupervisor(req: Request, res: Response) {
    try {
      const { employeeId, supervisorId } = req.body;
      
      // Enhanced debug logging to trace the exact execution path
      console.log('Assign supervisor request received:', {
        employeeId,
        supervisorId,
        bodyKeys: Object.keys(req.body),
        fullBody: JSON.stringify(req.body)
      });
      
      // Check if the required parameters are present
      if (employeeId === undefined) {
        console.log('Missing employeeId in request');
        return res.status(400).json({ 
          message: 'Missing employee ID',
          errorCode: 'EMPLOYEE_ID_MISSING'
        });
      }
      
      if (supervisorId === undefined) {
        console.log('Missing supervisorId in request');
        return res.status(400).json({ 
          message: 'Missing supervisor ID',
          errorCode: 'SUPERVISOR_ID_MISSING'
        });
      }
      
      // Improved ID parsing handling
      const empId = typeof employeeId === 'string' ? parseInt(employeeId) : employeeId;
      const supId = typeof supervisorId === 'string' ? parseInt(supervisorId) : supervisorId;
      
      
      // Validate the parsed IDs are valid numbers
      if (isNaN(empId) || !empId) {
        console.log('Invalid employee ID after parsing:', { employeeId, empId });
        return res.status(400).json({ 
          message: 'Invalid employee ID format',
          errorCode: 'EMPLOYEE_ID_INVALID',
          details: { providedValue: employeeId }
        });
      }
      
      if (isNaN(supId) || !supId) {
        console.log('Invalid supervisor ID after parsing:', { supervisorId, supId });
        return res.status(400).json({ 
          message: 'Invalid supervisor ID format',
          errorCode: 'SUPERVISOR_ID_INVALID',
          details: { providedValue: supervisorId }
        });
      }
      
      // تأكد من أن المعرفات أرقام موجبة
      if (empId <= 0 || supId <= 0) {
        return res.status(400).json({ 
          message: 'Employee and supervisor IDs must be positive numbers',
          details: {
            parsedEmployeeId: empId,
            parsedSupervisorId: supId
          }
        });
      }
      
      console.log(`Checking if employee exists with ID: ${empId} (${typeof empId})`);
      // Check if employee exists
      const employee = await userModel.getById(empId);
      if (!employee) {
        console.log(`Employee not found with ID: ${empId}`);
        return res.status(404).json({ 
          message: `Employee not found with ID: ${empId}`,
          errorCode: 'EMPLOYEE_NOT_FOUND'
        });
      }
      console.log(`Found employee:`, employee);
      
      console.log(`Checking if supervisor exists with ID: ${supId} (${typeof supId})`);
      // Check if supervisor exists
      const supervisor = await userModel.getById(supId);
      if (!supervisor) {
        console.log(`Supervisor not found with ID: ${supId}`);
        return res.status(404).json({ 
          message: `Supervisor not found with ID: ${supId}`,
          errorCode: 'SUPERVISOR_NOT_FOUND'
        });
      }
      console.log(`Found supervisor:`, supervisor);
      
      // Check if employee is actually an employee
      if (employee.role !== 'employee') {
        return res.status(400).json({ message: 'User is not an employee' });
      }
      
      // Check if supervisor is actually a supervisor or admin
      if (supervisor.role !== 'supervisor' && supervisor.role !== 'admin') {
        return res.status(400).json({ message: 'User is not a supervisor or admin' });
      }
      
      // Check if employee already has this supervisor assigned
      const currentSupervisor = await userModel.getSupervisorForEmployee(empId);
      if (currentSupervisor && currentSupervisor.id === supId) {
        // Not an error - just no change needed
        return res.status(200).json({ 
          message: 'Supervisor is already assigned to this employee',
          success: true,
          noChangesNeeded: true
        });
      }
      
      // Assign supervisor - استخدام القيم المحولة بدلاً من القيم الأصلية
      const assigned = await userModel.assignSupervisor(empId, supId);
      
      if (!assigned) {
        return res.status(500).json({ message: 'Failed to assign supervisor' });
      }
      
      return res.status(200).json({ message: 'Supervisor assigned successfully' });
    } catch (error) {
      console.error('Assign supervisor error:', error);
      return res.status(500).json({ 
        message: 'An error occurred while assigning supervisor',
        errorCode: 'INTERNAL_SERVER_ERROR'
      });
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