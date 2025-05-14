// أداة للتحقق من هيكل قاعدة البيانات
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function checkDatabaseSchema() {
  console.log('بدء التحقق من هيكل قاعدة البيانات...');
  
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

  console.log('تم الاتصال بقاعدة البيانات');
  
  try {
    // التحقق من هيكل جدول التقارير
    console.log('فحص هيكل جدول daily_reports...');
    const [tableColumns] = await pool.execute('SHOW COLUMNS FROM daily_reports');
    
    console.log('أعمدة جدول التقارير:');
    tableColumns.forEach(column => {
      console.log(`${column.Field} (${column.Type})`);
    });
    
    // البحث عن الأعمدة المطلوبة
    const requiredColumns = [
      'lesson1_beneficiaries',
      'lesson1_time',
      'lesson1_completed',
      'lesson2_beneficiaries',
      'lesson2_time',
      'lesson2_completed',
      'quran_session_beneficiaries',
      'quran_session_time',
      'quran_session_completed'
    ];
    
    const missingColumns = requiredColumns.filter(
      col => !tableColumns.some(dbCol => dbCol.Field === col)
    );
    
    if (missingColumns.length > 0) {
      console.error('أعمدة مفقودة في جدول التقارير:', missingColumns);
      
      // يمكننا محاولة إضافة الأعمدة المفقودة تلقائيًا
      console.log('محاولة إضافة الأعمدة المفقودة...');
      
      const alterQueries = missingColumns.map(col => {
        let type = 'INT DEFAULT 0';
        if (col.endsWith('_time')) {
          type = 'VARCHAR(10) DEFAULT NULL';
        } else if (col.endsWith('_completed')) {
          type = 'TINYINT(1) DEFAULT 0';
        }
        
        return `ALTER TABLE daily_reports ADD COLUMN ${col} ${type}`;
      });
      
      for (const query of alterQueries) {
        console.log(`تنفيذ: ${query}`);
        try {
          await pool.execute(query);
          console.log('تم تنفيذ الاستعلام بنجاح');
        } catch (error) {
          console.error('خطأ في تنفيذ استعلام إضافة العمود:', error.message);
        }
      }
      
      // التحقق مرة أخرى من هيكل الجدول
      console.log('إعادة فحص هيكل جدول التقارير بعد التعديلات...');
      const [updatedColumns] = await pool.execute('SHOW COLUMNS FROM daily_reports');
      console.log('أعمدة الجدول المحدثة:');
      updatedColumns.forEach(column => {
        console.log(`${column.Field} (${column.Type})`);
      });
    } else {
      console.log('جميع الأعمدة المطلوبة موجودة في جدول التقارير!');
    }
    
    // الآن، دعنا نتحقق من بيانات التقارير الحالية
    console.log('فحص بيانات التقارير الموجودة...');
    const [reports] = await pool.execute('SELECT * FROM daily_reports LIMIT 10');
    
    if (reports.length === 0) {
      console.log('لا توجد تقارير في قاعدة البيانات.');
    } else {
      console.log(`وجدنا ${reports.length} تقارير في قاعدة البيانات.`);
      
      // فحص قيم حقول الدروس والمستفيدين
      reports.forEach((report, index) => {
        console.log(`\nالتقرير #${index + 1} (ID: ${report.id}):`);
        console.log(`- الدرس الأول: ${report.lesson1_beneficiaries || 0} مستفيد، مكتمل: ${report.lesson1_completed ? 'نعم' : 'لا'}`);
        console.log(`- الدرس الثاني: ${report.lesson2_beneficiaries || 0} مستفيد، مكتمل: ${report.lesson2_completed ? 'نعم' : 'لا'}`);
        console.log(`- حلقة القرآن: ${report.quran_session_beneficiaries || 0} مستفيد، مكتمل: ${report.quran_session_completed ? 'نعم' : 'لا'}`);
        
        // التحقق من تناسق البيانات
        const l1_consistent = (report.lesson1_beneficiaries > 0) === Boolean(report.lesson1_completed);
        const l2_consistent = (report.lesson2_beneficiaries > 0) === Boolean(report.lesson2_completed);
        const qs_consistent = (report.quran_session_beneficiaries > 0) === Boolean(report.quran_session_completed);
        
        if (!l1_consistent || !l2_consistent || !qs_consistent) {
          console.warn('هناك تناقض في بيانات هذا التقرير!');
          // يمكن تصحيح البيانات تلقائيًا هنا إذا لزم الأمر
        }
      });
      
      // اقتراح تحديث البيانات للحفاظ على التناسق
      console.log('\nمحاولة تحديث بيانات التقارير للتأكد من تناسقها...');
      await pool.execute(`
        UPDATE daily_reports
        SET 
          lesson1_completed = IF(lesson1_beneficiaries > 0, 1, 0),
          lesson2_completed = IF(lesson2_beneficiaries > 0, 1, 0),
          quran_session_completed = IF(quran_session_beneficiaries > 0, 1, 0)
        WHERE 1
      `);
      console.log('تم تحديث بيانات التقارير للمحافظة على التناسق بين عدد المستفيدين وحالة الإكمال.');
    }
    
  } catch (err) {
    console.error('حدث خطأ أثناء التحقق من هيكل قاعدة البيانات:', err);
  } finally {
    console.log('إغلاق الاتصال بقاعدة البيانات');
    await pool.end();
  }
}

// تنفيذ التحقق
checkDatabaseSchema().then(() => {
  console.log('اكتملت عملية التحقق');
}).catch(err => {
  console.error('فشلت عملية التحقق:', err);
});
