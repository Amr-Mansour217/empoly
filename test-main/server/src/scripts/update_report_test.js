// أداة بسيطة لتحديث معلومات التقرير وضبط قيم المستفيدين
const axios = require('axios');

// تقرير للاختبار
const reportId = 1; // استخدم معرف التقرير المناسب
const reportData = {
  lesson1_beneficiaries: 10, // عدد مستفيدين أكبر من الصفر للدرس الأول
  lesson2_beneficiaries: 15, // عدد مستفيدين أكبر من الصفر للدرس الثاني
  quran_session_beneficiaries: 20, // عدد مستفيدين أكبر من الصفر لحلقة القرآن
  beneficiaries_count: 45, // إجمالي عدد المستفيدين
  // القيم التالية سيتم تحديدها تلقائيًا بناءً على عدد المستفيدين
  lesson1_completed: true,
  lesson2_completed: true, 
  quran_session_completed: true
};

// تحديث التقرير باستخدام بيانات الاختبار
async function updateReport() {
  try {
    console.log('محاولة تحديث التقرير بالبيانات:', reportData);
    
    // استخدام API للتحديث
    const response = await axios.post(`https://elmanafea.online/api/reports/today/${reportId}`, reportData);
    
    console.log('استجابة التحديث:', response.data);
    console.log('تم تحديث التقرير بنجاح!');
    
    // استرجاع بيانات التقرير بعد التحديث للتحقق من النتيجة
    const getResponse = await axios.get(`https://elmanafea.online/api/reports/${reportId}`);
    console.log('بيانات التقرير بعد التحديث:', getResponse.data);
    
  } catch (error) {
    console.error('خطأ في تحديث التقرير:', error.message);
    if (error.response) {
      console.error('استجابة الخطأ:', error.response.data);
    }
  }
}

// تنفيذ التحديث
updateReport();
