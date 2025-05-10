import reportModel from '../models/report';

/**
 * Schedule the daily attendance check to run at midnight
 * This function marks employees as absent if they didn't submit a report for the previous day
 */
export const scheduleDailyAttendanceCheck = () => {
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

/**
 * Run the daily attendance check
 * This marks employees as absent if they didn't submit a report for the previous day
 */
const runDailyAttendanceCheck = async () => {
  try {
    // Get yesterday's date in YYYY-MM-DD format
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // Mark absent for employees who didn't submit a report yesterday
    const absentCount = await reportModel.markAbsentForMissingReports(yesterdayStr);
    
    console.log(`Daily attendance check completed: ${absentCount} employees marked as absent for ${yesterdayStr}`);
  } catch (error) {
    console.error('Error running daily attendance check:', error);
  }
}; 