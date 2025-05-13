import reportModel from '../models/report';

/**
 * Schedule the daily attendance check to run at 12:00 PM (noon) Saudi Arabia time
 * This function marks employees as absent if they didn't submit a report by noon
 */
export const scheduleDailyAttendanceCheck = () => {
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

/**
 * Run the daily attendance check
 * This marks employees as absent if they didn't submit a report for the current day by noon
 */
const runDailyAttendanceCheck = async () => {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Mark absent for employees who didn't submit a report today by noon
    const absentCount = await reportModel.markAbsentForMissingReports(today);
    
    console.log(`Daily attendance check completed at 12:00 PM: ${absentCount} employees marked as absent for ${today}`);
  } catch (error) {
    console.error('Error running daily attendance check:', error);
  }
}; 