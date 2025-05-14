/**
 * سكريبت لإصلاح مشكلة عرض تفاصيل التقارير
 * هذا السكريبت يقوم بمزامنة حقول إكمال الدروس مع عدد المستفيدين
 * في جميع التقارير الموجودة في قاعدة البيانات
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixReports() {
  console.log('بدء إصلاح بيانات التقارير...');
  
  let pool;
  try {
    // إنشاء اتصال بقاعدة البيانات
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'employee_tracker',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    console.log('تم الاتصال بقاعدة البيانات بنجاح.');

    // 1. التحقق من وجود جميع الأعمدة المطلوبة
    console.log('فحص هيكل جدول التقارير...');
    const [columns] = await pool.execute('SHOW COLUMNS FROM daily_reports');
    const columnNames = columns.map(col => col.Field);
    
    const requiredColumns = [
      'lesson1_beneficiaries', 'lesson1_time', 'lesson1_completed',
      'lesson2_beneficiaries', 'lesson2_time', 'lesson2_completed',
      'quran_session_beneficiaries', 'quran_session_time', 'quran_session_completed'
    ];
    
    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
    
    // إذا كانت هناك أعمدة مفقودة، أضفها
    if (missingColumns.length > 0) {
      console.log(`هناك ${missingColumns.length} عمود مفقود. جاري إضافة الأعمدة المفقودة...`);
      
      for (const column of missingColumns) {
        let dataType;
        if (column.includes('beneficiaries')) {
          dataType = 'INT DEFAULT 0';
        } else if (column.includes('time')) {
          dataType = 'VARCHAR(10) DEFAULT NULL';
        } else if (column.includes('completed')) {
          dataType = 'TINYINT(1) DEFAULT 0';
        }
        
        try {
          await pool.execute(`ALTER TABLE daily_reports ADD COLUMN ${column} ${dataType}`);
          console.log(`تمت إضافة العمود ${column} بنجاح.`);
        } catch (error) {
          console.error(`فشل في إضافة العمود ${column}:`, error.message);
        }
      }
      
      console.log('تم إضافة جميع الأعمدة المطلوبة.');
    } else {
      console.log('جميع الأعمدة المطلوبة موجودة في الجدول.');
    }
    
    // 2. جلب جميع التقارير وتحديث حقول الإكمال بناءً على عدد المستفيدين
    console.log('جاري تحديث حالة إكمال الدروس بناءً على عدد المستفيدين...');
    
    // استخراج التقارير من قاعدة البيانات
    const [reports] = await pool.execute('SELECT * FROM daily_reports');
    console.log(`تم العثور على ${reports.length} تقرير.`);
    
    if (reports.length === 0) {
      console.log('لا توجد تقارير للتحديث.');
      return;
    }
    
    // تحديث كل تقرير فردي للتأكد من أن حالة الإكمال تعتمد على عدد المستفيدين
    let updatedCount = 0;
    let inconsistentCount = 0;
    
    for (const report of reports) {
      const l1_beneficiaries = Number(report.lesson1_beneficiaries || 0);
      const l2_beneficiaries = Number(report.lesson2_beneficiaries || 0);
      const qs_beneficiaries = Number(report.quran_session_beneficiaries || 0);
      
      const l1_completed = report.lesson1_completed ? 1 : 0;
      const l2_completed = report.lesson2_completed ? 1 : 0;
      const qs_completed = report.quran_session_completed ? 1 : 0;
      
      // التحقق مما إذا كانت حالة الإكمال متسقة مع عدد المستفيدين
      const l1_should_be_completed = l1_beneficiaries > 0 ? 1 : 0;
      const l2_should_be_completed = l2_beneficiaries > 0 ? 1 : 0;
      const qs_should_be_completed = qs_beneficiaries > 0 ? 1 : 0;
      
      // إذا كانت هناك تناقضات، قم بتحديث التقرير
      if (l1_completed !== l1_should_be_completed || 
          l2_completed !== l2_should_be_completed || 
          qs_completed !== qs_should_be_completed) {
        
        inconsistentCount++;
        console.log(`تقرير ID ${report.id} به تناقضات في بيانات الإكمال:`);
        
        if (l1_completed !== l1_should_be_completed) {
          console.log(` - الدرس الأول: ${l1_beneficiaries} مستفيد، الإكمال الحالي: ${l1_completed}, يجب أن يكون: ${l1_should_be_completed}`);
        }
        if (l2_completed !== l2_should_be_completed) {
          console.log(` - الدرس الثاني: ${l2_beneficiaries} مستفيد، الإكمال الحالي: ${l2_completed}, يجب أن يكون: ${l2_should_be_completed}`);
        }
        if (qs_completed !== qs_should_be_completed) {
          console.log(` - حلقة التلاوة: ${qs_beneficiaries} مستفيد، الإكمال الحالي: ${qs_completed}, يجب أن يكون: ${qs_should_be_completed}`);
        }
        
        // تحديث التقرير
        try {
          await pool.execute(`
            UPDATE daily_reports
            SET 
              lesson1_completed = ?,
              lesson2_completed = ?,
              quran_session_completed = ?
            WHERE id = ?
          `, [
            l1_should_be_completed,
            l2_should_be_completed,
            qs_should_be_completed,
            report.id
          ]);
          
          updatedCount++;
          console.log(`تم تحديث التقرير ID ${report.id} بنجاح.`);
        } catch (error) {
          console.error(`فشل في تحديث التقرير ID ${report.id}:`, error.message);
        }
      }
    }
    
    console.log(`الإحصائيات النهائية:`);
    console.log(`- إجمالي التقارير: ${reports.length}`);
    console.log(`- تقارير بها تناقضات: ${inconsistentCount}`);
    console.log(`- تقارير تم تحديثها: ${updatedCount}`);
    
    // 3. التحقق من أن التقارير الآن متسقة
    if (updatedCount > 0) {
      console.log('التحقق من التقارير بعد التحديث...');
      const [updatedReports] = await pool.execute(`
        SELECT id, 
          lesson1_beneficiaries, lesson1_completed, 
          lesson2_beneficiaries, lesson2_completed, 
          quran_session_beneficiaries, quran_session_completed 
        FROM daily_reports
        WHERE id IN (${reports.filter(r => 
          Number(r.lesson1_beneficiaries || 0) > 0 && !r.lesson1_completed || 
          Number(r.lesson2_beneficiaries || 0) > 0 && !r.lesson2_completed ||
          Number(r.quran_session_beneficiaries || 0) > 0 && !r.quran_session_completed
        ).map(r => r.id).join(',')})
      `);
      
      if (updatedReports.length > 0) {
        console.log(`⚠️ هناك ${updatedReports.length} تقرير لا يزال به تناقضات!`);
      } else {
        console.log('✅ تم التحقق من جميع التقارير، لا توجد تناقضات.');
      }
    }
    
    console.log('اكتمل تنفيذ السكريبت.');
  } catch (error) {
    console.error('حدث خطأ أثناء تنفيذ السكريبت:', error);
  } finally {
    if (pool) {
      await pool.end();
      console.log('تم إغلاق الاتصال بقاعدة البيانات.');
    }
  }
}

// تنفيذ السكريبت
fixReports().catch(console.error);
