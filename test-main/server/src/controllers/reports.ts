import { Request, Response } from 'express';
import reportModel from '../models/report';

class ReportController {
  // Create a new report
  async createReport(req: Request, res: Response) {
    try {
      const { 
        activity_type_id, 
        beneficiaries_count, 
        location,
        lesson1_beneficiaries,
        lesson1_time,
        lesson1_completed,
        lesson2_beneficiaries,
        lesson2_time,
        lesson2_completed,
        quran_session_beneficiaries,
        quran_session_time,
        quran_session_completed
      } = req.body;
      
      const employee_id = req.user.id;
      
      // Get current date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Validate input
      if (!activity_type_id || !beneficiaries_count) {
        return res.status(400).json({ message: 'Activity type and beneficiaries count are required' });
      }
      
      console.log('Processing report with lesson data:', {
        lesson1: {
          beneficiaries: lesson1_beneficiaries || 0,
          completed: lesson1_completed || false
        },
        lesson2: {
          beneficiaries: lesson2_beneficiaries || 0,
          completed: lesson2_completed || false
        },
        quranSession: {
          beneficiaries: quran_session_beneficiaries || 0,
          completed: quran_session_completed || false
        }
      });
      
      // تحويل قيم المستفيدين إلى أرقام وتحديد حالة الاكتمال اعتماداً عليها
      const l1_beneficiaries = Number(lesson1_beneficiaries || 0);
      const l2_beneficiaries = Number(lesson2_beneficiaries || 0);
      const qs_beneficiaries = Number(quran_session_beneficiaries || 0);
      
      // Create report
      const reportId = await reportModel.create({
        employee_id,
        activity_type_id,
        beneficiaries_count,
        location,
        report_date: today,
        lesson1_beneficiaries: l1_beneficiaries,
        lesson1_time,
        lesson1_completed: l1_beneficiaries > 0, // تحديد حالة الاكتمال بناءً على عدد المستفيدين
        lesson2_beneficiaries: l2_beneficiaries,
        lesson2_time,
        lesson2_completed: l2_beneficiaries > 0, // تحديد حالة الاكتمال بناءً على عدد المستفيدين
        quran_session_beneficiaries: qs_beneficiaries,
        quran_session_time,
        quran_session_completed: qs_beneficiaries > 0 // تحديد حالة الاكتمال بناءً على عدد المستفيدين
      });
      
      return res.status(201).json({
        message: 'Report submitted successfully',
        reportId
      });
    } catch (error) {
      console.error('Create report error:', error);
      return res.status(500).json({ message: 'An error occurred while submitting report' });
    }
  }
  
  // Update an existing report
  async updateReport(req: Request, res: Response) {
    try {
      const reportId = parseInt(req.params.id);
      const { 
        activity_type_id, 
        beneficiaries_count, 
        location,
        lesson1_beneficiaries,
        lesson1_time,
        lesson1_completed,
        lesson2_beneficiaries,
        lesson2_time,
        lesson2_completed,
        quran_session_beneficiaries,
        quran_session_time,
        quran_session_completed
      } = req.body;
      
      if (isNaN(reportId)) {
        return res.status(400).json({ message: 'معرف التقرير غير صالح' });
      }
      
      // تحقق من وجود التقرير
      const existingReport = await reportModel.getById(reportId);
      if (!existingReport) {
        return res.status(404).json({ message: 'لم يتم العثور على التقرير' });
      }
      
      // التحقق من الصلاحيات - يمكن فقط للمالك أو المشرف تحديث التقرير
      if (req.user.role === 'employee' && existingReport.employee_id !== req.user.id) {
        return res.status(403).json({ message: 'ليس لديك صلاحية لتحديث هذا التقرير' });
      }
      
      console.log('تحديث التقرير بالبيانات التالية:', {
        lesson1: {
          beneficiaries: lesson1_beneficiaries || 0,
          completed: lesson1_completed || false,
          time: lesson1_time
        },
        lesson2: {
          beneficiaries: lesson2_beneficiaries || 0,
          completed: lesson2_completed || false,
          time: lesson2_time
        },
        quranSession: {
          beneficiaries: quran_session_beneficiaries || 0,
          completed: quran_session_completed || false,
          time: quran_session_time
        }
      });
      
      // تحويل قيم المستفيدين إلى أرقام
      const l1_beneficiaries = Number(lesson1_beneficiaries ?? existingReport.lesson1_beneficiaries ?? 0);
      const l2_beneficiaries = Number(lesson2_beneficiaries ?? existingReport.lesson2_beneficiaries ?? 0);
      const qs_beneficiaries = Number(quran_session_beneficiaries ?? existingReport.quran_session_beneficiaries ?? 0);
      
      // إعداد البيانات للتحديث
      const updateData = {
        id: reportId,
        employee_id: existingReport.employee_id,
        activity_type_id: activity_type_id || existingReport.activity_type_id,
        beneficiaries_count: beneficiaries_count || existingReport.beneficiaries_count,
        location: location || existingReport.location,
        report_date: existingReport.report_date,
        lesson1_beneficiaries: l1_beneficiaries,
        lesson1_time: lesson1_time || existingReport.lesson1_time,
        lesson1_completed: l1_beneficiaries > 0, // تحديد حالة الاكتمال بناءً على عدد المستفيدين
        lesson2_beneficiaries: l2_beneficiaries,
        lesson2_time: lesson2_time || existingReport.lesson2_time,
        lesson2_completed: l2_beneficiaries > 0, // تحديد حالة الاكتمال بناءً على عدد المستفيدين
        quran_session_beneficiaries: qs_beneficiaries,
        quran_session_time: quran_session_time || existingReport.quran_session_time,
        quran_session_completed: qs_beneficiaries > 0 // تحديد حالة الاكتمال بناءً على عدد المستفيدين
      };
      
      // تحديث التقرير
      const updated = await reportModel.update(updateData);
      
      if (!updated) {
        return res.status(500).json({ message: 'فشل تحديث التقرير' });
      }
      
      return res.status(200).json({
        message: 'تم تحديث التقرير بنجاح',
        reportId
      });
    } catch (error) {
      console.error('خطأ في تحديث التقرير:', error);
      return res.status(500).json({ message: 'حدث خطأ أثناء تحديث التقرير' });
    }
  }
  
  // Get report by ID
  async getReportById(req: Request, res: Response) {
    try {
      const reportId = parseInt(req.params.id);
      
      if (isNaN(reportId)) {
        return res.status(400).json({ message: 'Invalid report ID' });
      }
      
      const report = await reportModel.getById(reportId);
      
      if (!report) {
        return res.status(404).json({ message: 'Report not found' });
      }
      
      // Check if user has permission to view this report
      if (req.user.role === 'employee' && report.employee_id !== req.user.id) {
        return res.status(403).json({ message: 'You do not have permission to view this report' });
      }
      
      console.log('تقرير بالعرض (ID):', {
        lesson1: { beneficiaries: report.lesson1_beneficiaries, completed: report.lesson1_completed },
        lesson2: { beneficiaries: report.lesson2_beneficiaries, completed: report.lesson2_completed },
        quranSession: { beneficiaries: report.quran_session_beneficiaries, completed: report.quran_session_completed }
      });
      
      return res.status(200).json({ report });
    } catch (error) {
      console.error('Get report by ID error:', error);
      return res.status(500).json({ message: 'An error occurred while getting report' });
    }
  }
  
  // Get reports by employee ID
  async getReportsByEmployeeId(req: Request, res: Response) {
    try {
      const employeeId = parseInt(req.params.id);
      
      if (isNaN(employeeId)) {
        return res.status(400).json({ message: 'Invalid employee ID' });
      }
      
      // Check if user has permission to view these reports
      if (req.user.role === 'employee' && employeeId !== req.user.id) {
        return res.status(403).json({ message: 'You do not have permission to view these reports' });
      }
      
      const reports = await reportModel.getByEmployeeId(employeeId);
      
      return res.status(200).json({ reports });
    } catch (error) {
      console.error('Get reports by employee ID error:', error);
      return res.status(500).json({ message: 'An error occurred while getting reports' });
    }
  }
  
  // Get report for current employee and date
  async getCurrentEmployeeReport(req: Request, res: Response) {
    try {
      const employeeId = req.user.id;
      const date = req.query.date as string || new Date().toISOString().split('T')[0];
      
      const report = await reportModel.getByEmployeeAndDate(employeeId, date);
      
      return res.status(200).json({
        report: report || null,
        hasSubmitted: !!report
      });
    } catch (error) {
      console.error('Get current employee report error:', error);
      return res.status(500).json({ message: 'An error occurred while getting report' });
    }
  }
  
  // Get all reports (admin/supervisor)
  async getAllReports(req: Request, res: Response) {
    try {
      // Filter by date range if provided
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const supervisorId = req.query.supervisorId ? parseInt(req.query.supervisorId as string) : null;
      
      let reports;
      
      if (req.user.role === 'admin') {
        // Admin can see all reports or filter by supervisor
        if (supervisorId) {
          // Admin requesting reports for a specific supervisor's employees
          if (startDate && endDate) {
            reports = await reportModel.getBySupervisorAndDateRange(supervisorId, startDate, endDate);
          } else {
            reports = await reportModel.getBySupervisorId(supervisorId);
          }
        } else {
          // Admin requesting all reports
          if (startDate && endDate) {
            reports = await reportModel.getByDateRange(startDate, endDate);
          } else {
            reports = await reportModel.getAll();
          }
        }
      } else if (req.user.role === 'supervisor') {
        // Supervisor can only see reports from their employees
        if (startDate && endDate) {
          reports = await reportModel.getBySupervisorAndDateRange(req.user.id, startDate, endDate);
        } else {
          reports = await reportModel.getBySupervisorId(req.user.id);
        }
      } else {
        return res.status(403).json({ message: 'You do not have permission to view all reports' });
      }
      
      return res.status(200).json({ reports });
    } catch (error) {
      console.error('Get all reports error:', error);
      return res.status(500).json({ message: 'An error occurred while getting reports' });
    }
  }
  
  // Get summary statistics
  async getSummaryStats(req: Request, res: Response) {
    try {
      const startDate = req.query.startDate as string || new Date().toISOString().split('T')[0];
      const endDate = req.query.endDate as string || new Date().toISOString().split('T')[0];
      
      let stats;
      
      if (req.user.role === 'admin') {
        // Admin can see all stats
        stats = await reportModel.getSummaryStats(startDate, endDate);
      } else if (req.user.role === 'supervisor') {
        // Supervisor can only see stats from their employees
        stats = await reportModel.getSummaryStats(startDate, endDate, req.user.id);
      } else {
        return res.status(403).json({ message: 'You do not have permission to view summary statistics' });
      }
      
      return res.status(200).json({ stats });
    } catch (error) {
      console.error('Get summary stats error:', error);
      return res.status(500).json({ message: 'An error occurred while getting statistics' });
    }
  }
}

export default new ReportController();