import { pool } from '../config/db';
import bcrypt from 'bcrypt';

interface User {
  id?: number;
  username: string;
  password: string;
  full_name: string;
  phone?: string;
  nationality?: string;
  location?: string;
  role: 'admin' | 'supervisor' | 'employee';
}

interface UserWithoutPassword {
  id: number;
  username: string;
  full_name: string;
  phone?: string;
  nationality?: string;
  location?: string;
  role: string;
  created_at?: Date;
  updated_at?: Date;
}

class UserModel {
  // Create a new user
  async create(userData: User): Promise<number> {
    const { username, password, full_name, phone, nationality, location, role } = userData;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    try {
      const [result]: any = await pool.execute(
        'INSERT INTO users (username, password, full_name, phone, nationality, location, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [username, hashedPassword, full_name, phone || null, nationality || null, location || null, role]
      );
      
      return result?.insertId || 0;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
  
  // Get user by ID
  async getById(id: number): Promise<UserWithoutPassword | null> {
    try {
      const [rows]: any = await pool.execute(
        'SELECT id, username, full_name, phone, nationality, location, role, created_at, updated_at FROM users WHERE id = ?',
        [id]
      );
      
      return rows && rows.length ? rows[0] : null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }
  
  // Get user by username (for authentication)
  async getByUsername(username: string): Promise<User | null> {
    try {
      const [rows]: any = await pool.execute(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );
      
      return rows && rows.length ? rows[0] : null;
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw error;
    }
  }
  
  // Update user
  async update(id: number, userData: Partial<User>): Promise<boolean> {
    try {
      const allowedFields = ['full_name', 'phone', 'nationality', 'location', 'role'];
      const updates: string[] = [];
      const values: any[] = [];
      
      // Build dynamic update query
      Object.entries(userData).forEach(([key, value]) => {
        if (allowedFields.includes(key) && value !== undefined) {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      });
      
      // If password is being updated, hash it
      if (userData.password) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        updates.push('password = ?');
        values.push(hashedPassword);
      }
      
      if (updates.length === 0) return false;
      
      // Add ID to values array
      values.push(id);
      
      const [result]: any = await pool.execute(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
      
      return result && result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
  
  // Delete user
  async delete(id: number): Promise<boolean> {
    try {
      const [result]: any = await pool.execute(
        'DELETE FROM users WHERE id = ?',
        [id]
      );
      
      return result && result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
  
  // Get all users
  async getAll(): Promise<UserWithoutPassword[]> {
    try {
      const [rows]: any = await pool.execute(
        'SELECT id, username, full_name, phone, nationality, location, role, created_at, updated_at FROM users'
      );
      
      return rows || [];
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }
  
  // Get all employees
  async getAllEmployees(): Promise<UserWithoutPassword[]> {
    try {
      const [rows]: any = await pool.execute(
        'SELECT id, username, full_name, phone, nationality, location, role, created_at, updated_at FROM users WHERE role = "employee"'
      );
      
      return rows || [];
    } catch (error) {
      console.error('Error getting all employees:', error);
      throw error;
    }
  }
  
  // Get all supervisors
  async getAllSupervisors(): Promise<UserWithoutPassword[]> {
    try {
      const [rows]: any = await pool.execute(
        'SELECT id, username, full_name, phone, nationality, location, role, created_at, updated_at FROM users WHERE role = "supervisor" OR role = "admin"'
      );
      
      return rows || [];
    } catch (error) {
      console.error('Error getting all supervisors:', error);
      throw error;
    }
  }
  
  // Get employees by supervisor ID
  async getEmployeesBySupervisor(supervisorId: number): Promise<UserWithoutPassword[]> {
    try {
      const [rows]: any = await pool.execute(
        `SELECT u.id, u.username, u.full_name, u.phone, u.nationality, u.location, u.role, u.created_at, u.updated_at 
         FROM users u
         JOIN employee_supervisors es ON u.id = es.employee_id
         WHERE es.supervisor_id = ?`,
        [supervisorId]
      );
      
      return rows || [];
    } catch (error) {
      console.error('Error getting employees by supervisor:', error);
      throw error;
    }
  }
  
  // Assign supervisor to employee
  async assignSupervisor(employeeId: number, supervisorId: number): Promise<boolean> {
    try {
      // Check if the employee already has a supervisor
      const [existing]: any = await pool.execute(
        'SELECT * FROM employee_supervisors WHERE employee_id = ?',
        [employeeId]
      );
      
      if (existing && existing.length > 0) {
        // Update existing relationship
        const [result]: any = await pool.execute(
          'UPDATE employee_supervisors SET supervisor_id = ? WHERE employee_id = ?',
          [supervisorId, employeeId]
        );
        return result && result.affectedRows > 0;
      } else {
        // Create new relationship
        const [result]: any = await pool.execute(
          'INSERT INTO employee_supervisors (employee_id, supervisor_id) VALUES (?, ?)',
          [employeeId, supervisorId]
        );
        return result && result.affectedRows > 0;
      }
    } catch (error) {
      console.error('Error assigning supervisor:', error);
      return false;
    }
  }
  
  // Get supervisor for employee
  async getSupervisorForEmployee(employeeId: number): Promise<UserWithoutPassword | null> {
    try {
      const [rows]: any = await pool.execute(
        `SELECT u.id, u.username, u.full_name, u.phone, u.nationality, u.location, u.role, u.created_at, u.updated_at 
         FROM users u
         JOIN employee_supervisors es ON u.id = es.supervisor_id
         WHERE es.employee_id = ?`,
        [employeeId]
      );
      
      return rows && rows.length ? rows[0] : null;
    } catch (error) {
      console.error('Error getting supervisor for employee:', error);
      throw error;
    }
  }
}

export default new UserModel(); 