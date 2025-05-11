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
 * Schedule the daily attendance check to run at midnight
 * This function marks employees as absent if they didn't submit a report for the previous day
 */
const scheduleDailyAttendanceCheck = () => {
    // Get the current date
    const now = new Date();
    // Calculate the time until midnight
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const timeUntilMidnight = midnight.getTime() - now.getTime();
    // Schedule the first check
    setTimeout(() => {
        // Run the check
        runDailyAttendanceCheck();
        // Then schedule it to run every 24 hours
        setInterval(runDailyAttendanceCheck, 24 * 60 * 60 * 1000);
    }, timeUntilMidnight);
    console.log(`Daily attendance check scheduled to run in ${Math.round(timeUntilMidnight / 1000 / 60)} minutes`);
};
exports.scheduleDailyAttendanceCheck = scheduleDailyAttendanceCheck;
/**
 * Run the daily attendance check
 * This marks employees as absent if they didn't submit a report for the previous day
 */
const runDailyAttendanceCheck = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get yesterday's date in YYYY-MM-DD format
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        // Mark absent for employees who didn't submit a report yesterday
        const absentCount = yield report_1.default.markAbsentForMissingReports(yesterdayStr);
        console.log(`Daily attendance check completed: ${absentCount} employees marked as absent for ${yesterdayStr}`);
    }
    catch (error) {
        console.error('Error running daily attendance check:', error);
    }
});
