import { Request, Response } from 'express';
import userModel from '../models/user';

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
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      // Check if user exists
      const user = await userModel.getById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Update user
      const updated = await userModel.update(userId, {
        full_name,
        phone,
        nationality,
        location,
        role: role as 'admin' | 'supervisor' | 'employee'
      });
      
      if (!updated) {
        return res.status(400).json({ message: 'No changes were made' });
      }
      
      return res.status(200).json({ message: 'User updated successfully' });
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
      
      // Delete user
      const deleted = await userModel.delete(userId);
      
      if (!deleted) {
        return res.status(500).json({ message: 'Failed to delete user' });
      }
      
      return res.status(200).json({ message: 'User deleted successfully' });
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
      
      // Debug log to see what values are being received
      console.log('Assign supervisor request received:', {
        employeeId: employeeId,
        supervisorId: supervisorId,
        employeeIdType: typeof employeeId,
        supervisorIdType: typeof supervisorId
      });
      
      // Convert string IDs to integers if needed
      const empId = typeof employeeId === 'string' ? parseInt(employeeId) : employeeId;
      const supId = typeof supervisorId === 'string' ? parseInt(supervisorId) : supervisorId;
      
      if (!empId || isNaN(empId) || !supId || isNaN(supId)) {
        return res.status(400).json({ message: 'Valid employee ID and supervisor ID are required' });
      }
      
      // Check if employee exists
      const employee = await userModel.getById(empId);
      if (!employee) {
        return res.status(404).json({ message: `Employee not found with ID: ${empId}` });
      }
      
      // Check if supervisor exists
      const supervisor = await userModel.getById(supId);
      if (!supervisor) {
        return res.status(404).json({ message: `Supervisor not found with ID: ${supId}` });
      }
      
      // Check if employee is actually an employee
      if (employee.role !== 'employee') {
        return res.status(400).json({ message: 'User is not an employee' });
      }
      
      // Check if supervisor is actually a supervisor or admin
      if (supervisor.role !== 'supervisor' && supervisor.role !== 'admin') {
        return res.status(400).json({ message: 'User is not a supervisor or admin' });
      }
      
      // Assign supervisor
      const assigned = await userModel.assignSupervisor(employeeId, supervisorId);
      
      if (!assigned) {
        return res.status(500).json({ message: 'Failed to assign supervisor' });
      }
      
      return res.status(200).json({ message: 'Supervisor assigned successfully' });
    } catch (error) {
      console.error('Assign supervisor error:', error);
      return res.status(500).json({ message: 'An error occurred while assigning supervisor' });
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
      
      if (!supervisor) {
        return res.status(404).json({ message: 'No supervisor assigned to this employee' });
      }
      
      return res.status(200).json({ supervisor });
    } catch (error) {
      console.error('Get supervisor for employee error:', error);
      return res.status(500).json({ message: 'An error occurred while getting supervisor' });
    }
  }
}

export default new UserController(); 