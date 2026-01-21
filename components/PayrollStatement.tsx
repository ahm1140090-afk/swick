
import React, { useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Download, Printer, Clock } from 'lucide-react';

interface PayrollStatementProps {
    startDate: string;
    endDate: string;
}

const PayrollStatement: React.FC<PayrollStatementProps> = ({ startDate, endDate }) => {
    const { employees, timesheets, transactions, companyInfo, formatCurrency, t } = useAppContext();
    const reportRef = useRef<HTMLDivElement>(null);

    const { reportData, totals } = useMemo(() => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const processedEmployees = employees.map(emp => {
            // Find payments within the period
            const paymentsInPeriod = transactions.filter(t => 
                t.entityType === 'employee' && 
                t.entityId === emp.id && 
                new Date(t.date) >= start && 
                new Date(t.date) <= end
            );
            
            const paidAmount = paymentsInPeriod.reduce((sum, p) => sum + p.amount, 0);

            // Fetch timesheets within the period
            const employeeTimesheets = timesheets.filter(ts => {
                const tsDate = new Date(ts.date);
                return ts.employeeId === emp.id && tsDate >= start && tsDate <= end;
            });

            const standardDailyHours = emp.standardWorkHours || companyInfo.standardWorkHours || 8;
            let totalRegularHours = 0;
            let totalOvertimeHours = 0;

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

            const overtimePay = totalOvertimeHours * emp.hourlyRate * (companyInfo.overtimeRate || 1.5);
            let estimatedSalary = 0;
            if (emp.paymentType === 'Salaried') {
                estimatedSalary = emp.baseSalary + overtimePay;
            } else {
                estimatedSalary = (totalRegularHours * emp.hourlyRate) + overtimePay;
            }

            return {
                ...emp,
                totalRegularHours,
                totalOvertimeHours,
                overtimePay,
                estimatedSalary,
                actualPaid: paidAmount
            };
        });

        const totalEstimated = processedEmployees.reduce((sum, e) => sum + e.estimatedSalary, 0);
        const totalPaid = processedEmployees.reduce((sum, e) => sum + e.actualPaid, 0);

        return { reportData: processedEmployees, totals: { totalEstimated, totalPaid } };
    }, [employees, timesheets, transactions, startDate, endDate, companyInfo]);

    const handleExportPDF = async () => {
        try {
            await window.ensurePdfLibsLoaded();
        } catch (error) {
            alert("فشل تحميل مكتبات التصدير.");
            return;
        }

        const element = reportRef.current;
        if (!element) return;

        window.html2canvas(element, { scale: 2, useCORS: true, backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff' })
        .then((canvas: HTMLCanvasElement) => {
            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ orientation: 'l', unit: 'pt', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const ratio = canvas.width / canvas.height;
            let imgWidth = pdfWidth - 40;
            let imgHeight = imgWidth / ratio;
            pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
            pdf.save(`Payroll_Statement_${startDate}_to_${endDate}.pdf`);
        });
    };

    return (
        <div id="payroll-report-area" ref={reportRef} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-6">
            <div className="flex justify-between items-start mb-6">
                <div className="text-right flex-grow">
                    <h2 className="text-2xl font-bold">{t('payroll_statement')}</h2>
                    <p className="text-gray-500 dark:text-gray-400">للفترة من {startDate} إلى {endDate}</p>
                </div>
                <div className="flex gap-2 no-print">
                    <button onClick={() => window.handlePrint('payroll-report-area')} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200"><Printer size={18}/></button>
                    <button onClick={handleExportPDF} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 text-blue-600"><Download size={18}/></button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100">
                    <p className="text-sm text-blue-600 dark:text-blue-400">إجمالي الرواتب المستحقة (تقديري)</p>
                    <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{formatCurrency(totals.totalEstimated)}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100">
                    <p className="text-sm text-green-600 dark:text-green-400">إجمالي المدفوع فعلياً</p>
                    <p className="text-2xl font-bold text-green-800 dark:text-green-200">{formatCurrency(totals.totalPaid)}</p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                    <thead className="bg-gray-50 dark:bg-gray-700 text-xs font-bold uppercase">
                        <tr>
                            <th className="px-4 py-3">الموظف</th>
                            <th className="px-4 py-3">ساعات عادية</th>
                            <th className="px-4 py-3">ساعات إضافية</th>
                            <th className="px-4 py-3">أجر الإضافي</th>
                            <th className="px-4 py-3">المستحق للفترة</th>
                            <th className="px-4 py-3">المدفوع فعلياً</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.map(emp => (
                            <tr key={emp.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-4 py-3">
                                    <p className="font-bold">{emp.name}</p>
                                    <p className="text-xs text-gray-500">{emp.position}</p>
                                </td>
                                <td className="px-4 py-3 font-mono">{emp.totalRegularHours.toFixed(1)} س</td>
                                <td className="px-4 py-3 font-mono text-blue-600">{emp.totalOvertimeHours.toFixed(1)} س</td>
                                <td className="px-4 py-3 font-mono">{formatCurrency(emp.overtimePay)}</td>
                                <td className="px-4 py-3 font-bold font-mono">{formatCurrency(emp.estimatedSalary)}</td>
                                <td className="px-4 py-3 font-bold font-mono text-green-600">{formatCurrency(emp.actualPaid)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PayrollStatement;
