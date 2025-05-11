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
const user_1 = __importDefault(require("../models/user"));
function debugUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Fetching all users for debugging...');
            const users = yield user_1.default.getAll();
            console.log(`Total users found: ${users.length}`);
            if (users.length > 0) {
                console.log('First user:', {
                    id: users[0].id,
                    username: users[0].username,
                    role: users[0].role
                });
            }
            else {
                console.log('No users found in database.');
            }
            console.log('Fetching all supervisors...');
            const supervisors = yield user_1.default.getAllSupervisors();
            console.log(`Total supervisors found: ${supervisors.length}`);
            if (supervisors.length > 0) {
                console.log('First supervisor:', {
                    id: supervisors[0].id,
                    username: supervisors[0].username,
                    role: supervisors[0].role
                });
            }
            else {
                console.log('No supervisors found in database.');
            }
        }
        catch (error) {
            console.error('Error in debug script:', error);
        }
    });
}
// Run the debug function
debugUsers().then(() => {
    console.log('Debug complete');
    process.exit(0);
}).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
