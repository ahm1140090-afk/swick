import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Employee, PaymentVoucher } from '../types';
import { X } from 'lucide-react';

interface EditPayrollModalProps {
  employee: Employee;
  voucher: PaymentVoucher;
  payrollMonth: string;
  onClose: () => void;
}

const EditPayrollModal: React.FC<EditPayrollModalProps> = ({ employee, voucher, payrollMonth, onClose }) => {
  const { updatePaymentVoucher, formatCurrency, setIsEditing } = useAppContext();
  const [newSalary, setNewSalary] = useState(voucher.amount.toString());

  useEffect(() => {
    setIsEditing(true);
    return () => {
        setIsEditing(false);
    };
  }, [setIsEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newSalary);
    if (!isNaN(amount) && amount >= 0) {
      updatePaymentVoucher({
        ...voucher,
        amount: amount,
        description: `تعديل راتب ${payrollMonth} - ${employee.name}`,
      });
      onClose();
    } else {
      alert('الرجاء إدخال مبلغ صحيح.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">تعديل راتب: {employee.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p>تعديل راتب شهر: <span className="font-bold">{payrollMonth}</span></p>
          <div>
            <label htmlFor="currentSalary" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">الراتب المدفوع حالياً</label>
            <input
              type="text"
              id="currentSalary"
              value={formatCurrency(voucher.amount)}
              className="bg-gray-200 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500"
              disabled
            />
          </div>
          <div>
            <label htmlFor="newSalary" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">الراتب الجديد</label>
            <input
              type="number"
              step="any"
              id="newSalary"
              value={newSalary}
              onChange={(e) => setNewSalary(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              required
              autoFocus
            />
          </div>
          <div className="flex justify-end pt-2">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 ltr:mr-2 rtl:ml-2">إلغاء</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">حفظ التعديل</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPayrollModal;