// تطبيق ترحيل قاعدة البيانات لإضافة حقول الدروس
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function applyMigration() {
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
    // قراءة ملف الترحيل (SQL)
    const migrationPath = path.join(__dirname, '..', '..', '..', 'db', 'add_lessons_to_reports.sql');
    console.log('مسار ملف الترحيل:', migrationPath);
    
    let migrationSql;
    try {
      migrationSql = await fs.readFile(migrationPath, 'utf8');
      console.log('تم قراءة ملف الترحيل SQL:');
      console.log(migrationSql);
    } catch (readError) {
      console.error('فشل في قراءة ملف الترحيل:', readError);
      
      // إنشاء SQL الترحيل مباشرة إذا لم يتم العثور على الملف
      console.log('يتم إنشاء استعلام الترحيل مباشرة...');
      migrationSql = `
      -- Add missing lesson fields to daily_reports table
      ALTER TABLE daily_reports 
      ADD COLUMN IF NOT EXISTS lesson1_beneficiaries INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS lesson1_time VARCHAR(10) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS lesson1_completed TINYINT(1) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS lesson2_beneficiaries INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS lesson2_time VARCHAR(10) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS lesson2_completed TINYINT(1) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS quran_session_beneficiaries INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS quran_session_time VARCHAR(10) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS quran_session_completed TINYINT(1) DEFAULT 0;
      `;
    }
    
    // تنفيذ الاستعلام
    const statements = migrationSql
      .split(';')
      .filter(stmt => stmt.trim())
      .map(stmt => stmt.trim() + ';');
    
    for (const stmt of statements) {
      if (!stmt.trim() || stmt === ';') continue;
      
      console.log(`جاري تنفيذ الاستعلام:`, stmt);
      try {
        await pool.execute(stmt);
        console.log('تم تنفيذ الاستعلام بنجاح');
      } catch (sqlError) {
        // تجاهل أخطاء التكرار (DUPLICATE COLUMN)
        if (sqlError.code === 'ER_DUP_FIELDNAME') {
          console.log('تم تجاهل الخطأ: العمود موجود بالفعل');
        } else {
          console.error('خطأ في تنفيذ الاستعلام:', sqlError);
        }
      }
    }
    
    // التحقق من هيكل الجدول بعد التعديل
    try {
      const [fields] = await pool.execute('DESCRIBE daily_reports');
      console.log('هيكل الجدول بعد التعديل:');
      console.log(fields.map(f => f.Field));
    } catch (describeError) {
      console.error('خطأ في الحصول على وصف الجدول:', describeError);
    }
    
    console.log('تم إكمال الترحيل بنجاح');
    
  } catch (err) {
    console.error('حدث خطأ أثناء تطبيق الترحيل:', err);
  } finally {
    console.log('إغلاق الاتصال بقاعدة البيانات');
    await pool.end();
  }
}

// تنفيذ الترحيل
console.log('بدء تنفيذ ترحيل قاعدة البيانات...');
applyMigration().then(() => {
  console.log('اكتمل تنفيذ الترحيل');
}).catch(err => {
  console.error('فشل تنفيذ الترحيل:', err);
});
