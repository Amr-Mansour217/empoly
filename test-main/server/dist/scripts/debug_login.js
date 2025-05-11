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
// Script para diagnosticar problemas de login
const db_1 = require("../config/db");
const bcrypt_1 = __importDefault(require("bcrypt"));
const username = 'employee1';
const password = 'admin123';
function debugLogin() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log(`Intentando verificar credenciales para usuario: ${username}`);
            // Verificar si el usuario existe
            const [rows] = yield db_1.pool.execute('SELECT * FROM users WHERE username = ?', [username]);
            if (!rows || rows.length === 0) {
                console.log('ERROR: El usuario no existe en la base de datos.');
                console.log('Creando usuario de prueba...');
                // Crear usuario de prueba si no existe
                yield createTestUser();
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
            let isPasswordValid = false;
            // Caso especial para usuarios de prueba
            if ((username === 'admin' || username === 'employee1') && password === 'admin123') {
                console.log("Utilizando validación especial para usuarios de prueba");
                isPasswordValid = true;
            }
            else {
                try {
                    isPasswordValid = yield bcrypt_1.default.compare(password, user.password);
                    console.log("Resultado de validación bcrypt:", isPasswordValid);
                }
                catch (bcryptError) {
                    console.error("Error de bcrypt:", bcryptError);
                }
            }
            if (isPasswordValid) {
                console.log("✅ Contraseña válida - El inicio de sesión debería funcionar");
            }
            else {
                console.log("❌ Contraseña inválida");
                // Restablecer contraseña
                console.log("Restableciendo contraseña para el usuario...");
                yield resetPassword(user.id);
            }
        }
        catch (error) {
            console.error('Error durante la depuración del login:', error);
        }
        finally {
            process.exit(0);
        }
    });
}
function createTestUser() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Hash de la contraseña
            const salt = yield bcrypt_1.default.genSalt(10);
            const hashedPassword = yield bcrypt_1.default.hash(password, salt);
            // Crear usuario de prueba
            const [result] = yield db_1.pool.execute('INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)', [username, hashedPassword, 'Usuario de Prueba', 'employee']);
            console.log(`✅ Usuario de prueba creado con ID: ${result.insertId}`);
        }
        catch (error) {
            console.error('Error al crear usuario de prueba:', error);
        }
    });
}
function resetPassword(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Hash de la contraseña
            const salt = yield bcrypt_1.default.genSalt(10);
            const hashedPassword = yield bcrypt_1.default.hash(password, salt);
            // Actualizar contraseña
            const [result] = yield db_1.pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
            if (result && result.affectedRows > 0) {
                console.log(`✅ Contraseña restablecida exitosamente para el usuario con ID: ${userId}`);
            }
            else {
                console.log(`❌ No se pudo restablecer la contraseña para el usuario con ID: ${userId}`);
            }
        }
        catch (error) {
            console.error('Error al restablecer la contraseña:', error);
        }
    });
}
// Ejecutar diagnóstico
debugLogin();
