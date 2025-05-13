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
exports.scheduleDailyAttendanceCheck = void 0;
const report_1 = __importDefault(require("../models/report"));
/**
 * Schedule the daily attendance check to run at 12:00 PM (noon) Saudi Arabia time
 * This function marks employees as absent if they didn't submit a report by noon
 */
const scheduleDailyAttendanceCheck = () => {
    // Get the current date
    const now = new Date();
    // Calculate the time until 12:00 PM (noon) Saudi Arabia time
    const noon = new Date(now);
    noon.setHours(12, 0, 0, 0);
    // If noon has already passed today, schedule for tomorrow
    if (now.getHours() >= 12) {
        noon.setDate(noon.getDate() + 1);
    }
    const timeUntilNoon = noon.getTime() - now.getTime();
    // Schedule the first check
    setTimeout(() => {
        // Run the check
        runDailyAttendanceCheck();
        // Then schedule it to run every 24 hours
        setInterval(runDailyAttendanceCheck, 24 * 60 * 60 * 1000);
    }, timeUntilNoon);
    console.log(`Daily attendance check scheduled to run at 12:00 PM Saudi Arabia time (in ${Math.round(timeUntilNoon / 1000 / 60)} minutes)`);
};
exports.scheduleDailyAttendanceCheck = scheduleDailyAttendanceCheck;
/**
 * Run the daily attendance check
 * This marks employees as absent if they didn't submit a report for the current day by noon
 */
const runDailyAttendanceCheck = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        // Mark absent for employees who didn't submit a report today by noon
        const absentCount = yield report_1.default.markAbsentForMissingReports(today);
        console.log(`Daily attendance check completed at 12:00 PM: ${absentCount} employees marked as absent for ${today}`);
    }
    catch (error) {
        console.error('Error running daily attendance check:', error);
    }
});
