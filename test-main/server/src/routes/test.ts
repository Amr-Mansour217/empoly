import express from 'express';
import { pool } from '../config/db';

const router = express.Router();

// Complete supervisor assignment implementation
router.post('/supervisor-assign', async (req, res) => {
  console.log('FULL IMPLEMENTATION IN TEST ROUTE');
  console.log('Request body:', req.body);
  
  try {
    const { employeeId, supervisorId } = req.body;
    
    if (!employeeId || !supervisorId) {
      return res.status(400).json({
        message: 'Missing required fields',
        requiredFields: ['employeeId', 'supervisorId'],
        receivedData: req.body
      });
    }
    
    // Parse IDs to ensure they're numbers
    const empId = Number(employeeId);
    const supId = Number(supervisorId);
    
    if (isNaN(empId) || isNaN(supId)) {
      return res.status(400).json({
        message: 'IDs must be valid numbers',
        receivedValues: { employeeId, supervisorId }
      });
    }
    
    console.log(`Checking if employee ${empId} exists...`);
    // Check if employee exists
    const [empRows]: any = await pool.execute(
      'SELECT id, role FROM users WHERE id = ?', 
      [empId]
    );
    
    if (!empRows || empRows.length === 0) {
      console.log(`Employee with ID ${empId} not found`);
      return res.status(404).json({
        message: `Employee not found with ID: ${empId}`
      });
    }
    
    const employee = empRows[0];
    console.log('Employee found:', employee);
    
    console.log(`Checking if supervisor ${supId} exists...`);
    // Check if supervisor exists
    const [supRows]: any = await pool.execute(
      'SELECT id, role FROM users WHERE id = ?', 
      [supId]
    );
    
    if (!supRows || supRows.length === 0) {
      console.log(`Supervisor with ID ${supId} not found`);
      return res.status(404).json({
        message: `Supervisor not found with ID: ${supId}`
      });
    }
    
    const supervisor = supRows[0];
    console.log('Supervisor found:', supervisor);
    
    // Validate roles
    if (employee.role !== 'employee') {
      return res.status(400).json({
        message: 'User is not an employee',
        role: employee.role
      });
    }
    
    if (supervisor.role !== 'supervisor' && supervisor.role !== 'admin') {
      return res.status(400).json({
        message: 'User is not a supervisor or admin',
        role: supervisor.role
      });
    }
    
    console.log('Creating/updating assignment record...');
    // Create or update assignment
    const [result]: any = await pool.execute(
      'REPLACE INTO employee_supervisors (employee_id, supervisor_id) VALUES (?, ?)',
      [empId, supId]
    );
    
    console.log('Assignment operation result:', result);
    
    if (!result || result.affectedRows === 0) {
      return res.status(500).json({
        message: 'Database operation failed',
        details: result
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Supervisor assigned successfully',
      assignment: { 
        employeeId: empId, 
        supervisorId: supId,
        timestamp: new Date().toISOString() 
      }
    });
  } catch (error: any) {
    console.error('Error in supervisor assignment:', error);
    return res.status(500).json({
      message: 'Server error occurred during supervisor assignment',
      error: error.message || 'Unknown error'
    });
  }
});

export default router;
