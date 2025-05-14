// سكريبت بسيط للتحقق من إصلاح مشكلة عرض تفاصيل التقارير
const axios = require('axios');

async function testReportDisplay() {
  try {
    console.log('اختبار عرض تفاصيل التقارير...');
    
    // إنشاء تقرير جديد للتجربة
    const testReportData = {
      activity_type_id: 1, 
      beneficiaries_count: 109, // إجمالي المستفيدين
      location: 'اختبار',
      lesson1_beneficiaries: 21, // عدد مستفيدين الدرس الأول
      lesson1_time: '09:00',
      lesson1_completed: true, // سيتم تجاهل هذه القيمة وسيتم تحديدها بناءً على عدد المستفيدين
      lesson2_beneficiaries: 23, // عدد مستفيدين الدرس الثاني
      lesson2_time: '10:30',
      lesson2_completed: true, // سيتم تجاهل هذه القيمة وسيتم تحديدها بناءً على عدد المستفيدين
      quran_session_beneficiaries: 65, // عدد مستفيدين حلقة القرآن
      quran_session_time: '12:00',
      quran_session_completed: true // سيتم تجاهل هذه القيمة وسيتم تحديدها بناءً على عدد المستفيدين
    };
    
    console.log('البيانات المستخدمة في إنشاء التقرير:', testReportData);
    
    // استدعاء API لإنشاء التقرير
    const createResponse = await axios.post(
      'https://elmanafea.online/api/reports',
      testReportData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'البيرر تحتاج لإضافة رمز الوصول هنا'
        }
      }
    ).catch(error => {
      console.error('خطأ في إنشاء التقرير:', error.message);
      if (error.response) {
        console.error('تفاصيل الخطأ:', error.response.data);
      }
      return { data: null };
    });
    
    if (!createResponse.data) {
      console.log('لم نتمكن من إنشاء تقرير جديد للاختبار');
      return;
    }
    
    console.log('تم إنشاء التقرير بنجاح:', createResponse.data);
    
    // جلب التقرير للتحقق
    const reportId = createResponse.data.reportId;
    const getResponse = await axios.get(
      `https://elmanafea.online/api/reports/${reportId}`,
      {
        headers: {
          'Authorization': 'البيرر تحتاج لإضافة رمز الوصول هنا'
        }
      }
    ).catch(error => {
      console.error('خطأ في جلب التقرير:', error.message);
      return { data: null };
    });
    
    if (!getResponse.data) {
      console.log('لم نتمكن من جلب التقرير بعد الإنشاء');
      return;
    }
    
    const report = getResponse.data.report;
    
    console.log('\nبيانات التقرير المسترجعة:');
    console.log('- إجمالي المستفيدين:', report.beneficiaries_count);
    console.log('- الدرس الأول:', {
      beneficiaries: report.lesson1_beneficiaries,
      time: report.lesson1_time,
      completed: report.lesson1_completed ? 'نعم' : 'لا'
    });
    console.log('- الدرس الثاني:', {
      beneficiaries: report.lesson2_beneficiaries,
      time: report.lesson2_time,
      completed: report.lesson2_completed ? 'نعم' : 'لا'
    });
    console.log('- حلقة القرآن:', {
      beneficiaries: report.quran_session_beneficiaries,
      time: report.quran_session_time,
      completed: report.quran_session_completed ? 'نعم' : 'لا'
    });
    
    // التحقق من صحة البيانات
    const isCorrect = (
      report.lesson1_beneficiaries == testReportData.lesson1_beneficiaries &&
      report.lesson1_completed === (testReportData.lesson1_beneficiaries > 0) &&
      report.lesson2_beneficiaries == testReportData.lesson2_beneficiaries &&
      report.lesson2_completed === (testReportData.lesson2_beneficiaries > 0) &&
      report.quran_session_beneficiaries == testReportData.quran_session_beneficiaries &&
      report.quran_session_completed === (testReportData.quran_session_beneficiaries > 0)
    );
    
    if (isCorrect) {
      console.log('\n✅ تم تخزين واسترجاع بيانات التقرير بشكل صحيح!');
    } else {
      console.log('\n❌ هناك تناقض بين البيانات المرسلة والبيانات المسترجعة!');
    }
    
  } catch (error) {
    console.error('خطأ في اختبار عرض التقارير:', error.message);
  }
}

console.log('ملاحظة: هذا السكريبت يتطلب توفير رمز وصول للتمكن من استخدامه للاختبار. يرجى تعديله قبل التنفيذ.');
//testReportDisplay();
