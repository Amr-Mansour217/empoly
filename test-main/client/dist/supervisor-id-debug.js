// هذا الملف يساعد في استكشاف وإصلاح أخطاء تعيين المشرف

// دالة لاختبار صلاحية معرّفات المستخدمين والمشرفين
function testUserIds() {
    console.log("===== اختبار معرّفات المستخدمين =====");
    
    // الحصول على جميع المستخدمين في النظام
    fetch('/api/users')
        .then(response => response.json())
        .then(data => {
            if (data && data.users && Array.isArray(data.users)) {
                console.log(`عدد المستخدمين الكلي: ${data.users.length}`);
                
                // اختبار معرّفات المستخدمين
                data.users.forEach(user => {
                    console.log(`المستخدم: ${user.full_name}, المعرّف: ${user.id}, النوع: ${typeof user.id}`);
                    
                    // التحقق من صحة المعرّف
                    const parsedId = parseInt(String(user.id));
                    if (isNaN(parsedId)) {
                        console.error(`خطأ: معرّف المستخدم ${user.full_name} غير صالح`);
                    }
                });
                
                // اختبار تعيين المشرف
                const employees = data.users.filter(u => u.role === 'employee');
                const supervisors = data.users.filter(u => u.role === 'supervisor' || u.role === 'admin');
                
                if (employees.length > 0 && supervisors.length > 0) {
                    console.log("\n===== اختبار تعيين المشرف =====");
                    const testEmployee = employees[0];
                    const testSupervisor = supervisors[0];
                    
                    console.log(`محاولة تعيين المشرف ${testSupervisor.full_name} (${testSupervisor.id}) للموظف ${testEmployee.full_name} (${testEmployee.id})`);
                    
                    // إنشاء بيانات التعيين
                    const assignmentData = {
                        employeeId: parseInt(String(testEmployee.id)),
                        supervisorId: parseInt(String(testSupervisor.id))
                    };
                    
                    console.log("بيانات التعيين:", assignmentData);
                    
                    // إرسال طلب التعيين
                    fetch('/api/users/assign-supervisor', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(assignmentData)
                    })
                    .then(response => response.json())
                    .then(result => {
                        console.log("نتيجة التعيين:", result);
                    })
                    .catch(error => {
                        console.error("خطأ في تعيين المشرف:", error);
                    });
                }
            }
        })
        .catch(error => {
            console.error("خطأ في الحصول على المستخدمين:", error);
        });
}

// اختبار الاتصال بنقطة نهاية تعيين المشرف
function testSupervisorEndpoint() {
    console.log("===== اختبار نقطة نهاية تعيين المشرف =====");
    
    // محاولة الوصول إلى نقطة النهاية
    fetch('/api/users/assign-supervisor', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            employeeId: 1,
            supervisorId: 1
        })
    })
    .then(response => {
        console.log("رمز الاستجابة:", response.status);
        return response.json();
    })
    .then(data => {
        console.log("بيانات الاستجابة:", data);
    })
    .catch(error => {
        console.error("خطأ في اختبار نقطة النهاية:", error);
    });
}

// دالة للحصول على تعيينات المشرفين الحالية
function getCurrentAssignments() {
    console.log("===== الحصول على تعيينات المشرفين الحالية =====");
    
    fetch('/api/users/all-supervisor-assignments')
        .then(response => response.json())
        .then(data => {
            if (data && data.assignments) {
                console.log("تعيينات المشرفين:", data.assignments);
                
                // الحصول على تفاصيل المستخدمين لعرض الأسماء بدل المعرّفات
                fetch('/api/users')
                    .then(response => response.json())
                    .then(userData => {
                        if (userData && userData.users) {
                            const usersMap = {};
                            userData.users.forEach(user => {
                                usersMap[user.id] = user;
                            });
                            
                            data.assignments.forEach(assignment => {
                                const employee = usersMap[assignment.employee_id];
                                const supervisor = usersMap[assignment.supervisor_id];
                                
                                console.log(
                                    `الموظف: ${employee ? employee.full_name : 'غير معروف'} (${assignment.employee_id}) -> ` +
                                    `المشرف: ${supervisor ? supervisor.full_name : 'غير معروف'} (${assignment.supervisor_id})`
                                );
                            });
                        }
                    });
            }
        })
        .catch(error => {
            console.error("خطأ في الحصول على تعيينات المشرفين:", error);
        });
}

// تصدير الدوال لاستخدامها في وحدة تحكم المتصفح
window.testUserIds = testUserIds;
window.testSupervisorEndpoint = testSupervisorEndpoint;
window.getCurrentAssignments = getCurrentAssignments;
