
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { AccountType, Employee, Transaction, PaymentVoucher, Timesheet } from '../types';
import { Wallet, Users, Download, Printer, FileSpreadsheet, Edit, Trash2, Clock, DollarSign, CheckCircle2 } from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import EditPayrollModal from './EditPayrollModal';
import PayIndividualSalaryModal from './PayIndividualSalaryModal';

const Payroll: React.FC = () => {
    const { employees, accounts, processPayroll, transactions, formatCurrency, t, paymentVouchers, deletePayrollPayment, timesheets, companyInfo } = useAppContext();
    const today = new Date();
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
    const [assetAccountId, setAssetAccountId] = useState('');
    const [editingPayroll, setEditingPayroll] = useState<{ employee: Employee, voucher: PaymentVoucher } | null>(null);
    const [payingEmployee, setPayingEmployee] = useState<{ employee: Employee, amount: number } | null>(null);
    const tableContainerRef = useRef<HTMLDivElement>(null);

    const assetAccounts = useMemo(() => accounts.filter(a => a.type === AccountType.ASSET && a.parentId)
        .map(acc => ({ value: acc.id, label: `${acc.accountNumber ? `(${acc.accountNumber}) ` : ''}${acc.name}` })), [accounts]);
    
    useEffect(() => {
        if (assetAccounts.length > 0 && !assetAccountId) {
            setAssetAccountId(assetAccounts[0].value);
        }
    }, [assetAccounts, assetAccountId]);
    
    const payrollMonth = useMemo(() => `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`, [selectedYear, selectedMonth]);

    const employeePayrollData = useMemo(() => {
        const [payrollYear, payrollMonthNum] = payrollMonth.split('-').map(Number);
    
        return employees.map(emp => {
            // البحث عن معاملة صرف راتب لهذا الموظف وهذا الشهر
            const paidTransaction = transactions.find(t => 
                t.entityType === 'employee' && 
                t.entityId === emp.id && 
                t.payrollMonth === payrollMonth &&
                t.paymentVoucherId // تأكيد وجود سند صرف
            );
            
            const isPaid = !!paidTransaction;
            const paidVoucher = isPaid ? paymentVouchers.find(pv => pv.id === paidTransaction.paymentVoucherId) : undefined;

            // جلب سجلات الدوام
            const employeeTimesheets = timesheets.filter(ts => 
                ts.employeeId === emp.id && 
                ts.date.startsWith(payrollMonth)
            );

            let totalRegularHours = 0;
            let totalOvertimeHours = 0;
            const standardDailyHours = emp.standardWorkHours || companyInfo.standardWorkHours || 8;

            employeeTimesheets.forEach(ts => {
                if (ts.checkIn && ts.checkOut) {
                    const checkInTime = new Date(`1970-01-01T${ts.checkIn}:00`);
                    const checkOutTime = new Date(`1970-01-01T${ts.checkOut}:00`);
                    const hoursWorked = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

                    if (hoursWorked > 0) {
                        totalRegularHours += Math.min(hoursWorked, standardDailyHours);
                        totalOvertimeHours += Math.max(0, hoursWorked - standardDailyHours);
                    }
                }
            });

            let calculatedSalary = 0;
            let overtimePay = totalOvertimeHours * emp.hourlyRate * (companyInfo.overtimeRate || 1.5);

            if (emp.paymentType === 'Salaried') {
                calculatedSalary = emp.baseSalary + overtimePay;
            } else {
                calculatedSalary = (totalRegularHours * emp.hourlyRate) + overtimePay;
            }

            const baseDetails = {
                ...emp,
                totalSalary: isPaid ? paidTransaction.amount : calculatedSalary,
                regularHours: totalRegularHours,
                overtimeHours: totalOvertimeHours,
                overtimePay: overtimePay,
                paidTransaction,
                voucher: paidVoucher,
            };
    
            if (isPaid) {
                return {
                    ...baseDetails,
                    status: 'PAID' as const,
                    message: 'تم الدفع',
                    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                };
            }
    
            const hireDate = emp.hireDate ? new Date(emp.hireDate) : null;
            if (hireDate && (hireDate.getFullYear() > payrollYear || (hireDate.getFullYear() === payrollYear && hireDate.getMonth() + 1 > payrollMonthNum))) {
                 return { ...baseDetails, status: 'NOT_HIRED_YET' as const, message: 'لم يتم تعيينه بعد', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' };
            }
    
            const termDate = emp.terminationDate ? new Date(emp.terminationDate) : null;
             if (termDate && (termDate.getFullYear() < payrollYear || (termDate.getFullYear() === payrollYear && termDate.getMonth() + 1 < payrollMonthNum))) {
                return { ...baseDetails, status: 'TERMINATED' as const, message: 'انتهت خدمته', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' };
            }

            return {
                ...baseDetails,
                status: 'ELIGIBLE' as const,
                message: calculatedSalary > 0 ? 'جاهز للدفع' : 'لا توجد ساعات مسجلة',
                color: calculatedSalary > 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
            };
        });
    }, [employees, transactions, payrollMonth, paymentVouchers, timesheets, companyInfo]);

    const eligibleForPaymentEmployees = useMemo(() => 
        employeePayrollData.filter(emp => emp.status === 'ELIGIBLE' && emp.totalSalary > 0),
    [employeePayrollData]);
    
    useEffect(() => {
        setSelectedEmployees([]);
    }, [selectedYear, selectedMonth]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedEmployees(eligibleForPaymentEmployees.map(emp => emp.id));
        } else {
            setSelectedEmployees([]);
        }
    };

    const handleSelectEmployee = (e: React.ChangeEvent<HTMLInputElement>, employeeId: string) => {
        if (e.target.checked) {
            setSelectedEmployees(prev => [...prev, employeeId]);
        } else {
            setSelectedEmployees(prev => prev.filter(id => id !== employeeId));
        }
    };
    
    const handleDeletePaidSalary = (transaction: Transaction) => {
        if (window.confirm('هل أنت متأكد من حذف عملية دفع هذا الراتب؟ سيتم حذف السند والقيد المحاسبي المرتبط به ولن تظهر كمدفوعة.')) {
            deletePayrollPayment(transaction);
        }
    };
    
    const handlePayIndividual = (emp: any) => {
        setPayingEmployee({ employee: emp, amount: emp.totalSalary });
    };

    const handleSubmitBulk = () => {
        if (selectedEmployees.length === 0) {
            alert('الرجاء تحديد موظف واحد على الأقل.');
            return;
        }
        if (!assetAccountId) {
            alert('الرجاء اختيار حساب للدفع منه.');
            return;
        }

        if(!window.confirm(`هل أنت متأكد من صرف رواتب ${selectedEmployees.length} موظف دفعة واحدة؟`)) return;

        selectedEmployees.forEach(empId => {
            const data = employeePayrollData.find(d => d.id === empId);
            if (data) {
                useAppContext().addPaymentVoucher({
                    payeeName: data.name,
                    payeeId: data.id,
                    payeeType: 'employee',
                    date: new Date().toISOString().split('T')[0],
                    amount: data.totalSalary,
                    assetAccountId,
                    accountId: 'exp-salaries',
                    description: `راتب شهر ${payrollMonth} (عادية: ${data.regularHours}، إضافي: ${data.overtimeHours})`,
                    employeeId: empId,
                    payrollMonth,
                });
            }
        });

        setSelectedEmployees([]);
        alert('تمت معالجة الرواتب المحددة بنجاح.');
    };
    
    const years = Array.from({ length: 5 }, (_, i) => today.getFullYear() - i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Wallet className="text-blue-500" />
                    مسير الرواتب والدفع الذكي
                </h2>
                <div className="flex flex-wrap items-center gap-4 no-print">
                    <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600">
                        {months.map(m => <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('ar', { month: 'long' })}</option>)}
                    </select>
                    <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600">
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            <div id="printable-area" ref={tableContainerRef} className="overflow-x-auto">
                <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="p-4 no-print text-center">
                                <input 
                                    type="checkbox" 
                                    onChange={handleSelectAll} 
                                    checked={eligibleForPaymentEmployees.length > 0 && selectedEmployees.length === eligibleForPaymentEmployees.length}
                                    disabled={eligibleForPaymentEmployees.length === 0}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded" 
                                />
                            </th>
                            <th scope="col" className="px-6 py-3">الموظف</th>
                            <th scope="col" className="px-6 py-3">ساعات العمل</th>
                            <th scope="col" className="px-6 py-3">الإضافي</th>
                            <th scope="col" className="px-6 py-3">المبلغ المستحق</th>
                            <th scope="col" className="px-6 py-3">الحالة</th>
                            <th scope="col" className="px-6 py-3 no-print">الإجراء</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employeePayrollData.map(emp => {
                            const isPaid = emp.status === 'PAID';
                            const isEligible = emp.status === 'ELIGIBLE' && emp.totalSalary > 0;
                            return (
                                <tr key={emp.id} className={`border-b dark:border-gray-700 ${!isPaid ? 'bg-white dark:bg-gray-800' : 'bg-green-50/20 dark:bg-green-900/5'}`}>
                                    <td className="p-4 no-print text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedEmployees.includes(emp.id)} 
                                            onChange={(e) => handleSelectEmployee(e, emp.id)} 
                                            disabled={!isEligible}
                                            className="w-4 h-4 text-blue-600 rounded"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900 dark:text-white">{emp.name}</div>
                                        <div className="text-[10px] text-gray-400 font-mono">{emp.employeeNumber}</div>
                                    </td>
                                    <td className="px-6 py-4 font-mono">{emp.regularHours.toFixed(1)} ساعة</td>
                                    <td className="px-6 py-4 font-mono text-blue-600">{emp.overtimeHours.toFixed(1)} ساعة</td>
                                    <td className="px-6 py-4 font-bold font-mono text-gray-900 dark:text-white">{formatCurrency(emp.totalSalary)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-bold rounded-full flex items-center gap-1 w-fit ${emp.color}`}>
                                            {isPaid && <CheckCircle2 size={12}/>}
                                            {emp.message}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 no-print">
                                        <div className="flex gap-2">
                                            {isEligible && (
                                                <button 
                                                    onClick={() => handlePayIndividual(emp)} 
                                                    className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-1 hover:bg-blue-700 shadow-sm"
                                                >
                                                    <DollarSign size={14}/> دفع
                                                </button>
                                            )}
                                            {isPaid && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => setEditingPayroll({ employee: emp, voucher: emp.voucher! })} className="text-blue-500 hover:text-blue-700"><Edit size={18} /></button>
                                                    <button onClick={() => handleDeletePaidSalary(emp.paidTransaction!)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {selectedEmployees.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800 shadow-inner">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500 text-white rounded-full">
                            <Clock size={20} />
                        </div>
                        <div>
                             <p className="font-bold text-blue-800 dark:text-blue-200">صرف جماعي لـ {selectedEmployees.length} موظف</p>
                             <p className="text-xs text-blue-600 dark:text-blue-400">الإجمالي: {formatCurrency(eligibleForPaymentEmployees.filter(e => selectedEmployees.includes(e.id)).reduce((s, e) => s + e.totalSalary, 0))}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 mt-4 sm:mt-0">
                         <div className="w-48">
                            <SearchableSelect
                                value={assetAccountId}
                                onChange={setAssetAccountId}
                                options={assetAccounts}
                                placeholder="حساب الصرف"
                            />
                         </div>
                        <button onClick={handleSubmitBulk} className="bg-green-600 text-white px-8 py-2.5 rounded-lg hover:bg-green-700 font-bold shadow-lg transition-all">
                            تأكيد الصرف الجماعي
                        </button>
                    </div>
                </div>
            )}

            {editingPayroll && (
                <EditPayrollModal 
                    employee={editingPayroll.employee} 
                    voucher={editingPayroll.voucher} 
                    payrollMonth={payrollMonth} 
                    onClose={() => setEditingPayroll(null)} 
                />
            )}

            {payingEmployee && (
                <PayIndividualSalaryModal
                    employee={payingEmployee.employee}
                    suggestedAmount={payingEmployee.amount}
                    payrollMonth={payrollMonth}
                    onClose={() => setPayingEmployee(null)}
                />
            )}
        </div>
    );
};

export default Payroll;
