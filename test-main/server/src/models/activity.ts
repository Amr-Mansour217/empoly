import { pool } from '../config/db';

interface ActivityType {
  id?: number;
  name: string;
  created_at?: Date;
}

class ActivityModel {
  // Get all activity types
  async getAll(): Promise<ActivityType[]> {
    const [rows]: any = await pool.execute('SELECT * FROM activity_types');
    return rows;
  }
  
  // Get activity type by ID
  async getById(id: number): Promise<ActivityType | null> {
    const [rows]: any = await pool.execute(
      'SELECT * FROM activity_types WHERE id = ?',
      [id]
    );
    
    return rows.length ? rows[0] : null;
  }
  
  // Create a new activity type
  async create(name: string): Promise<number> {
    const [result]: any = await pool.execute(
      'INSERT INTO activity_types (name) VALUES (?)',
      [name]
    );
    
    return result.insertId;
  }
  
  // Update an activity type
  async update(id: number, name: string): Promise<boolean> {
    const [result]: any = await pool.execute(
      'UPDATE activity_types SET name = ? WHERE id = ?',
      [name, id]
    );
    
    return result.affectedRows > 0;
  }
  
  // Delete an activity type
  async delete(id: number): Promise<boolean> {
    const [result]: any = await pool.execute(
      'DELETE FROM activity_types WHERE id = ?',
      [id]
    );
    
    return result.affectedRows > 0;
  }
}

export default new ActivityModel(); 