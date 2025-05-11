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
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../config/db");
class ActivityModel {
    // Get all activity types
    getAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield db_1.pool.execute('SELECT * FROM activity_types');
            return rows;
        });
    }
    // Get activity type by ID
    getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield db_1.pool.execute('SELECT * FROM activity_types WHERE id = ?', [id]);
            return rows.length ? rows[0] : null;
        });
    }
    // Create a new activity type
    create(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const [result] = yield db_1.pool.execute('INSERT INTO activity_types (name) VALUES (?)', [name]);
            return result.insertId;
        });
    }
    // Update an activity type
    update(id, name) {
        return __awaiter(this, void 0, void 0, function* () {
            const [result] = yield db_1.pool.execute('UPDATE activity_types SET name = ? WHERE id = ?', [name, id]);
            return result.affectedRows > 0;
        });
    }
    // Delete an activity type
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const [result] = yield db_1.pool.execute('DELETE FROM activity_types WHERE id = ?', [id]);
            return result.affectedRows > 0;
        });
    }
}
exports.default = new ActivityModel();
