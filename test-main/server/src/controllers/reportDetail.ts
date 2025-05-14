import express from 'express';
import { Request, Response } from 'express';
import { pool } from '../config/db';

class ReportDetailController {
  // Get report details by employee ID and date
  async getReportByEmployeeAndDate(req: Request, res: Response) {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const date = req.params.date;
      
      if (isNaN(employeeId) || !date) {
        return res.status(400).json({ message: 'Invalid employee ID or date' });
      }
        // Check if user has permission to view this report
      if (req.user.role === 'employee' && employeeId !== req.user.id) {
        return res.status(403).json({ message: 'You do not have permission to view this report' });
      }
      
      // جلب بيانات التقرير من قاعدة البيانات
      const [rows]: any = await pool.execute(
        `SELECT 
          dr.*, u.full_name, at.name as activity_name 
         FROM daily_reports dr
         JOIN users u ON dr.employee_id = u.id
         JOIN activity_types at ON dr.activity_type_id = at.id
         WHERE dr.employee_id = ? AND dr.report_date = ?`,
        [employeeId, date]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Report not found' });
      }
        // معالجة وتحسين البيانات قبل إرسالها
      const report = rows[0];
      
      // تحويل عدد المستفيدين إلى أرقام للتأكد
      report.lesson1_beneficiaries = Number(report.lesson1_beneficiaries) || 0;
      report.lesson2_beneficiaries = Number(report.lesson2_beneficiaries) || 0;
      report.quran_session_beneficiaries = Number(report.quran_session_beneficiaries) || 0;
      
      // تحديد حالة اكتمال الدرس بناءً على عدد المستفيدين
      // إذا كان هناك عدد مستفيدين أكبر من 0، فهذا يعني أن الدرس تم إكماله
      report.lesson1_completed = report.lesson1_beneficiaries > 0;
      report.lesson2_completed = report.lesson2_beneficiaries > 0;
      report.quran_session_completed = report.quran_session_beneficiaries > 0;
      
      console.log('تقرير مع بيانات محسنة:', {
        lesson1_completed: report.lesson1_completed,
        lesson2_completed: report.lesson2_completed,
        quran_session_completed: report.quran_session_completed,
        lesson1_beneficiaries: report.lesson1_beneficiaries,
        lesson2_beneficiaries: report.lesson2_beneficiaries,
        quran_session_beneficiaries: report.quran_session_beneficiaries
      });
      
      return res.status(200).json({ report });
    } catch (error) {
      console.error('Error getting report by employee and date:', error);
      return res.status(500).json({ message: 'An error occurred while getting the report' });
    }
  }
}

export default new ReportDetailController();
