
import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Employee, Timesheet } from '../types';
import { Plus, Edit, Upload, FileSpreadsheet } from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import TimesheetForm from './TimesheetForm';
import CSVImportModal from './CSVImportModal';

const TimeTracking: React.FC = () => {
    const { employees, timesheets, companyInfo, t, timeTrackingInitialFilter, setTimeTrackingInitialFilter } = useAppContext();
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    
    const today = new Date();
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingData, setEditingData] = useState<{ employee: Employee, date: string, timesheet: Timesheet | null } | null>(null);

    useEffect(() => {
        if (timeTrackingInitialFilter) {
            setSelectedEmployeeId(timeTrackingInitialFilter.employeeId);
            setSelectedYear(timeTrackingInitialFilter.year);
            setSelectedMonth(timeTrackingInitialFilter.month);
            setTimeTrackingInitialFilter(null); // Clear the filter
        }
    }, [timeTrackingInitialFilter, setTimeTrackingInitialFilter]);

    const employeeOptions = useMemo(() => employees.map(e => ({ value: e.id, label: e.name })), [employees]);

    const daysInMonth = useMemo(() => new Date(selectedYear, selectedMonth, 0).getDate(), [selectedYear, selectedMonth]);

    const monthData = useMemo(() => {
        if (!selectedEmployeeId) return [];
        const employee = employees.find(e => e.id === selectedEmployeeId);
        if (!employee) return [];

        const employeeTimesheets = timesheets.filter(ts => 
            ts.employeeId === selectedEmployeeId && 
            ts.date.startsWith(`${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`)
        );
        
        const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        const standardHours = employee.standardWorkHours || companyInfo.standardWorkHours;

        return daysArray.map(day => {
            const dateStr = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const date = new Date(dateStr);
            const timesheet = employeeTimesheets.find(ts => ts.date === dateStr);

            let status = t('workDay');
            let regular = 0, overtime = 0, total = 0;

            if (timesheet?.isHoliday) {
                status = t('holiday');
            } else if (timesheet?.isLeave) {
                status = t('leave');
            } else if (timesheet?.checkIn && timesheet?.checkOut) {
                const checkInTime = new Date(`1970-01-01T${timesheet.checkIn}:00`);
                const checkOutTime = new Date(`1970-01-01T${timesheet.checkOut}:00`);
                const hoursWorked = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

                if (hoursWorked > 0) {
                    regular = Math.min(hoursWorked, standardHours);
                    overtime = Math.max(0, hoursWorked - standardHours);
                    total = hoursWorked;
                }
            }

            return {
                date: dateStr,
                dayName: date.toLocaleString('ar-EG', { weekday: 'long' }),
                timesheet,
                status,
                checkIn: timesheet?.checkIn || '—',
                checkOut: timesheet?.checkOut || '—',
                regularHours: regular,
                overtimeHours: overtime,
                totalHours: total,
            };
        });
    }, [selectedEmployeeId, selectedYear, selectedMonth, daysInMonth, timesheets, companyInfo.standardWorkHours, t, employees]);
    
    const summary = useMemo(() => {
        let totalRegular = 0, totalOvertime = 0, workDays = 0, leaveDays = 0, holidayDays = 0;
        monthData.forEach(d => {
            totalRegular += d.regularHours;
            totalOvertime += d.overtimeHours;
            if (d.status === t('workDay') && d.totalHours > 0) workDays++;
            if (d.status === t('leave')) leaveDays++;
            if (d.status === t('holiday')) holidayDays++;
        });
        return { totalRegular, totalOvertime, workDays, leaveDays, holidayDays };
    }, [monthData, t]);


    const handleEdit = (date: string, timesheet: Timesheet | null) => {
        const employee = employees.find(e => e.id === selectedEmployeeId);
        if (employee) {
            setEditingData({ employee, date, timesheet });
            setIsFormOpen(true);
        }
    };

    const years = Array.from({ length: 5 }, (_, i) => today.getFullYear() - i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('time_tracking')}</h2>
                 <div className="flex flex-wrap items-center gap-4 no-print">
                    <SearchableSelect options={employeeOptions} value={selectedEmployeeId} onChange={setSelectedEmployeeId} placeholder="-- اختر موظف --" />
                    <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600">
                        {months.map(m => <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('ar', { month: 'long' })}</option>)}
                    </select>
                    <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600">
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <button onClick={() => setIsImportModalOpen(true)} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-bold shadow-sm">
                        <Upload size={18} className="ml-2" /> استيراد سجل الدوام
                    </button>
                </div>
            </div>

            {selectedEmployeeId ? (
                <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow"><p className="text-sm text-gray-500">أيام العمل</p><p className="font-bold text-lg">{summary.workDays}</p></div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow"><p className="text-sm text-gray-500">أيام الإجازة</p><p className="font-bold text-lg">{summary.leaveDays}</p></div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow"><p className="text-sm text-gray-500">أيام العطل</p><p className="font-bold text-lg">{summary.holidayDays}</p></div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow"><p className="text-sm text-gray-500">ساعات عادية</p><p className="font-bold text-lg">{summary.totalRegular.toFixed(1)}</p></div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow"><p className="text-sm text-gray-500">ساعات إضافية</p><p className="font-bold text-lg text-blue-600">{summary.totalOvertime.toFixed(1)}</p></div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md overflow-x-auto">
                    <table className="w-full min-w-[800px] text-sm text-right">
                        <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th className="px-4 py-3">التاريخ</th>
                                <th className="px-4 py-3">اليوم</th>
                                <th className="px-4 py-3">{t('checkIn')}</th>
                                <th className="px-4 py-3">{t('checkOut')}</th>
                                <th className="px-4 py-3">{t('status')}</th>
                                <th className="px-4 py-3 text-center">عادية</th>
                                <th className="px-4 py-3 text-center">إضافي</th>
                                <th className="px-4 py-3 text-center">الإجمالي</th>
                                <th className="px-4 py-3 no-print"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthData.map(day => (
                                <tr key={day.date} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-4 py-3">{day.date}</td>
                                    <td className="px-4 py-3 font-medium">{day.dayName}</td>
                                    <td className="px-4 py-3 font-mono">{day.checkIn}</td>
                                    <td className="px-4 py-3 font-mono">{day.checkOut}</td>
                                    <td className="px-4 py-3">{day.status}</td>
                                    <td className="px-4 py-3 font-mono text-center">{day.regularHours.toFixed(1)}</td>
                                    <td className="px-4 py-3 font-mono text-center text-blue-600">{day.overtimeHours.toFixed(1)}</td>
                                    <td className="px-4 py-3 font-mono font-bold text-center">{day.totalHours.toFixed(1)}</td>
                                    <td className="px-4 py-3 no-print">
                                        <button onClick={() => handleEdit(day.date, day.timesheet)} className="text-blue-500 hover:text-blue-700">
                                            <Edit size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                </>
            ) : (
                <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <p className="text-gray-500">الرجاء اختيار موظف لعرض سجل الدوام.</p>
                </div>
            )}
            
            {isFormOpen && editingData && (
                <TimesheetForm
                    employee={editingData.employee}
                    date={editingData.date}
                    timesheet={editingData.timesheet}
                    onClose={() => setIsFormOpen(false)}
                />
            )}
            {isImportModalOpen && <CSVImportModal type="timesheets" onClose={() => setIsImportModalOpen(false)} />}
        </div>
    );
};

export default TimeTracking;
