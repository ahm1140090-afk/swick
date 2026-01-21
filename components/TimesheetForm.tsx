import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Employee, Timesheet } from '../types';
import { X } from 'lucide-react';

interface TimesheetFormProps {
  employee: Employee;
  date: string;
  timesheet: Timesheet | null;
  onClose: () => void;
}

const TimesheetForm: React.FC<TimesheetFormProps> = ({ employee, date, timesheet, onClose }) => {
  const { addTimesheet, updateTimesheet, t } = useAppContext();
  
  const [formData, setFormData] = useState({
    checkIn: '',
    checkOut: '',
    isHoliday: false,
    isLeave: false,
    notes: '',
  });

  useEffect(() => {
    if (timesheet) {
      setFormData({
        checkIn: timesheet.checkIn || '',
        checkOut: timesheet.checkOut || '',
        isHoliday: timesheet.isHoliday,
        isLeave: timesheet.isLeave,
        notes: timesheet.notes || '',
      });
    }
  }, [timesheet]);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => {
        const newState = { ...prev, [name]: checked };
        if (checked) {
            if (name === 'isHoliday') newState.isLeave = false;
            if (name === 'isLeave') newState.isHoliday = false;
        }
        return newState;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isSpecialDay = formData.isHoliday || formData.isLeave;
    
    const timesheetData = {
        employeeId: employee.id,
        date,
        checkIn: isSpecialDay ? null : formData.checkIn || null,
        checkOut: isSpecialDay ? null : formData.checkOut || null,
        isHoliday: formData.isHoliday,
        isLeave: formData.isLeave,
        notes: formData.notes,
    };

    if (timesheet) {
        updateTimesheet({ ...timesheet, ...timesheetData });
    } else {
        addTimesheet(timesheetData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('add_edit_timesheet')}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X size={24} />
          </button>
        </div>
        <p className="mb-4 text-center font-semibold">{employee.name} - {date}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="isHoliday" checked={formData.isHoliday} onChange={handleCheckboxChange} className="w-4 h-4 text-blue-600 rounded" />
                    <span>{t('holiday')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="isLeave" checked={formData.isLeave} onChange={handleCheckboxChange} className="w-4 h-4 text-blue-600 rounded" />
                    <span>{t('leave')}</span>
                </label>
            </div>

            <div className={`grid grid-cols-2 gap-4 ${formData.isHoliday || formData.isLeave ? 'opacity-50' : ''}`}>
                <div>
                    <label htmlFor="checkIn" className="block mb-2 text-sm font-medium">{t('checkIn')}</label>
                    <input type="time" name="checkIn" value={formData.checkIn} onChange={e => setFormData(p => ({...p, checkIn: e.target.value}))} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" disabled={formData.isHoliday || formData.isLeave} />
                </div>
                 <div>
                    <label htmlFor="checkOut" className="block mb-2 text-sm font-medium">{t('checkOut')}</label>
                    <input type="time" name="checkOut" value={formData.checkOut} onChange={e => setFormData(p => ({...p, checkOut: e.target.value}))} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" disabled={formData.isHoliday || formData.isLeave} />
                </div>
            </div>

            <div>
                 <label htmlFor="notes" className="block mb-2 text-sm font-medium">ملاحظات</label>
                 <textarea name="notes" value={formData.notes} onChange={e => setFormData(p => ({...p, notes: e.target.value}))} rows={3} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600"></textarea>
            </div>

            <div className="flex justify-end pt-2">
                <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 ml-2">إلغاء</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">{t('save_changes')}</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default TimesheetForm;
