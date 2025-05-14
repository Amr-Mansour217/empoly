import { Request, Response } from 'express';
import reportModel from '../models/report';

class ReportController {
  // Create a new report
  async createReport(req: Request, res: Response) {
    try {
      const { activity_type_id, beneficiaries_count, location } = req.body;
      const employee_id = req.user.id;
      
      // Get current date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Validate input
      if (!activity_type_id || !beneficiaries_count) {
        return res.status(400).json({ message: 'Activity type and beneficiaries count are required' });
      }
      
      // Create report
      const reportId = await reportModel.create({
        employee_id,
        activity_type_id,
        beneficiaries_count,
        location,
        report_date: today
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
  
  // Get detailed report info by employee ID
  async getEmployeeReportDetails(req: Request, res: Response) {
    try {
      const employeeId = parseInt(req.params.id);
      // التعامل مع كلا المعلمتين: report_date أو date
      const reportDate = req.query.report_date as string || req.query.date as string || new Date().toISOString().split('T')[0];
      
      console.log('طلب تفاصيل التقرير:', { employeeId, reportDate, params: req.params, query: req.query });
      
      if (isNaN(employeeId)) {
        return res.status(400).json({ message: 'Invalid employee ID' });
      }
      
      // Check if user has permission to view these reports
      if (req.user.role === 'employee' && employeeId !== req.user.id) {
        return res.status(403).json({ message: 'You do not have permission to view these report details' });
      }
      
      // Get report with detailed activity breakdown
      const report = await reportModel.getDetailedReportByEmployeeAndDate(employeeId, reportDate);
      
      if (!report) {
        return res.status(404).json({ message: 'Report details not found' });
      }
      
      console.log('تم العثور على تفاصيل التقرير:', report);
      
      return res.status(200).json({ 
        success: true,
        report 
      });
    } catch (error) {
      console.error('Get employee report details error:', error);
      return res.status(500).json({ message: 'An error occurred while getting report details' });
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
  
  // الحصول على تفاصيل تقرير موظف محدد
  async getEmployeeReportDetails(req: Request, res: Response) {
    try {
      const employeeId = parseInt(req.params.id);
      
      if (isNaN(employeeId)) {
        return res.status(400).json({ message: 'معرف الموظف غير صالح' });
      }
      
      // الحصول على التاريخ من الاستعلام (أو التاريخ الحالي إذا لم يُحدد)
      const date = req.query.date as string || new Date().toISOString().split('T')[0];
      
      // الحصول على تفاصيل التقرير من قاعدة البيانات
      const reportDetails = await reportModel.getDetailedReportByEmployeeAndDate(employeeId, date);
      
      if (!reportDetails) {
        return res.status(404).json({ message: 'لم يتم العثور على تقرير لهذا الموظف في هذا التاريخ' });
      }
      
      return res.status(200).json({ 
        success: true,
        report: reportDetails 
      });
    } catch (error) {
      console.error('الخطأ في الحصول على تفاصيل تقرير الموظف:', error);
      return res.status(500).json({ message: 'حدث خطأ أثناء الحصول على تفاصيل التقرير' });
    }
  }
}

export default new ReportController(); 