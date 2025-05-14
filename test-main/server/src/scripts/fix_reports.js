// سكريبت لتصحيح بيانات التقارير التي لا تعرض المستفيدين أو حالة التنفيذ بشكل صحيح
const mysql = require('mysql2/promise');
require('dotenv').config(); // للوصول إلى متغيرات البيئة

async function fixReports() {
  console.log('بدء إصلاح بيانات التقارير...');
  
  // إنشاء اتصال بقاعدة البيانات
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'employee_tracker',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    console.log('تم الاتصال بقاعدة البيانات');
    
    // التحقق من وجود الأعمدة المطلوبة
    console.log('التحقق من وجود الأعمدة المطلوبة في جدول التقارير...');
    const [columns] = await pool.execute('SHOW COLUMNS FROM daily_reports');
    
    const columnNames = columns.map(col => col.Field);
    console.log('الأعمدة الموجودة في الجدول:', columnNames.join(', '));
    
    // التحقق من وجود الأعمدة المطلوبة للدروس
    const requiredColumns = [
      'lesson1_beneficiaries', 'lesson1_time', 'lesson1_completed',
      'lesson2_beneficiaries', 'lesson2_time', 'lesson2_completed',
      'quran_session_beneficiaries', 'quran_session_time', 'quran_session_completed'
    ];
    
    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('الأعمدة المفقودة:', missingColumns.join(', '));
      
      // إضافة الأعمدة المفقودة
      console.log('إضافة الأعمدة المفقودة...');
      
      for (const column of missingColumns) {
        let dataType = 'INT DEFAULT 0';
        if (column.endsWith('_time')) {
          dataType = 'VARCHAR(10) DEFAULT NULL';
        } else if (column.endsWith('_completed')) {
          dataType = 'TINYINT(1) DEFAULT 0';
        }
        
        try {
          console.log(`إضافة العمود ${column} بنوع بيانات ${dataType}`);
          await pool.execute(`ALTER TABLE daily_reports ADD COLUMN ${column} ${dataType}`);
          console.log(`تمت إضافة العمود ${column} بنجاح`);
        } catch (error) {
          console.error(`خطأ في إضافة العمود ${column}:`, error.message);
        }
      }
    } else {
      console.log('جميع الأعمدة المطلوبة موجودة في جدول التقارير');
    }
    
    // التحقق من بيانات التقارير وإصلاحها
    console.log('التحقق من بيانات التقارير وإصلاحها...');
    
    // جلب جميع التقارير
    const [reports] = await pool.execute('SELECT * FROM daily_reports');
    console.log(`تم العثور على ${reports.length} تقرير`);
    
    if (reports.length > 0) {
      console.log('تحديث حالة اكتمال الدروس بناءً على عدد المستفيدين لجميع التقارير...');
      
      // تحديث حالة اكتمال الدروس بناءً على عدد المستفيدين
      await pool.execute(`
        UPDATE daily_reports
        SET 
          lesson1_completed = IF(lesson1_beneficiaries > 0, 1, 0),
          lesson2_completed = IF(lesson2_beneficiaries > 0, 1, 0),
          quran_session_completed = IF(quran_session_beneficiaries > 0, 1, 0)
        WHERE 1
      `);
      
      console.log('تم تحديث حالة اكتمال الدروس بنجاح');
      
      // عرض بعض التقارير المحدثة للتحقق
      const [updatedReports] = await pool.execute('SELECT * FROM daily_reports LIMIT 5');
      console.log('\nعينة من التقارير المحدثة:');
      updatedReports.forEach((report, index) => {
        console.log(`\nالتقرير ${index + 1} (ID: ${report.id}):`);
        console.log(`- الدرس الأول: ${report.lesson1_beneficiaries || 0} مستفيد، اكتمال: ${report.lesson1_completed ? 'نعم' : 'لا'}`);
        console.log(`- الدرس الثاني: ${report.lesson2_beneficiaries || 0} مستفيد، اكتمال: ${report.lesson2_completed ? 'نعم' : 'لا'}`);
        console.log(`- حلقة القرآن: ${report.quran_session_beneficiaries || 0} مستفيد، اكتمال: ${report.quran_session_completed ? 'نعم' : 'لا'}`);
      });
    }

  } catch (error) {
    console.error('خطأ في إصلاح التقارير:', error);
  } finally {
    console.log('إغلاق الاتصال بقاعدة البيانات');
    await pool.end();
  }
}

fixReports()
  .then(() => console.log('تم الانتهاء من عملية الإصلاح'))
  .catch(err => console.error('فشلت عملية الإصلاح:', err));
