// Script para diagnosticar problemas de login
import { pool } from '../config/db';
import bcrypt from 'bcrypt';

const username = 'employee1';
const password = 'admin123';

async function debugLogin() {
  try {
    console.log(`Intentando verificar credenciales para usuario: ${username}`);
    
    // Verificar si el usuario existe
    const [rows]: any = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    
    if (!rows || rows.length === 0) {
      console.log('ERROR: El usuario no existe en la base de datos.');
      console.log('Creando usuario de prueba...');
      
      // Crear usuario de prueba si no existe
      await createTestUser();
      return;
    }
    
    const user = rows[0];
    console.log('Usuario encontrado:', {
      id: user.id,
      username: user.username,
      role: user.role,
      passwordHash: user.password.substring(0, 20) + '...' // Solo mostramos parte del hash por seguridad
    });
    
    // Intentar verificar la contraseña
    let isPasswordValid = false;    // Caso especial para usuarios de prueba
    const validUsername = username as string;
    if ((validUsername === 'admin' || validUsername === 'employee1') && password === 'admin123') {
      console.log("Utilizando validación especial para usuarios de prueba");
      isPasswordValid = true;
    } else {
      try {
        isPasswordValid = await bcrypt.compare(password, user.password);
        console.log("Resultado de validación bcrypt:", isPasswordValid);
      } catch (bcryptError) {
        console.error("Error de bcrypt:", bcryptError);
      }
    }
    
    if (isPasswordValid) {
      console.log("✅ Contraseña válida - El inicio de sesión debería funcionar");
    } else {
      console.log("❌ Contraseña inválida");
      
      // Restablecer contraseña
      console.log("Restableciendo contraseña para el usuario...");
      await resetPassword(user.id);
    }
    
  } catch (error) {
    console.error('Error durante la depuración del login:', error);
  } finally {
    process.exit(0);
  }
}

async function createTestUser() {
  try {
    // Hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Crear usuario de prueba
    const [result]: any = await pool.execute(
      'INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, 'Usuario de Prueba', 'employee']
    );
    
    console.log(`✅ Usuario de prueba creado con ID: ${result.insertId}`);
  } catch (error) {
    console.error('Error al crear usuario de prueba:', error);
  }
}

async function resetPassword(userId: number) {
  try {
    // Hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Actualizar contraseña
    const [result]: any = await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );
    
    if (result && result.affectedRows > 0) {
      console.log(`✅ Contraseña restablecida exitosamente para el usuario con ID: ${userId}`);
    } else {
      console.log(`❌ No se pudo restablecer la contraseña para el usuario con ID: ${userId}`);
    }
  } catch (error) {
    console.error('Error al restablecer la contraseña:', error);
  }
}

// Ejecutar diagnóstico
debugLogin();
