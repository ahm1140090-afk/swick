
import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Employee, AccountType } from '../types';
import { X, DollarSign } from 'lucide-react';
import SearchableSelect from './SearchableSelect';

interface PayIndividualSalaryModalProps {
  employee: Employee;
  suggestedAmount: number;
  payrollMonth: string;
  onClose: () => void;
}

const PayIndividualSalaryModal: React.FC<PayIndividualSalaryModalProps> = ({ employee, suggestedAmount, payrollMonth, onClose }) => {
  const { addPaymentVoucher, accounts, formatCurrency, setIsEditing } = useAppContext();
  const [amount, setAmount] = useState(suggestedAmount.toString());
  const [assetAccountId, setAssetAccountId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const assetAccounts = useMemo(() => 
    accounts.filter(a => a.type === AccountType.ASSET && a.parentId)
    .map(a => ({ value: a.id, label: a.name })), [accounts]);

  useEffect(() => {
    setIsEditing(true);
    if (assetAccounts.length > 0) setAssetAccountId(assetAccounts[0].value);
    return () => setIsEditing(false);
  }, [setIsEditing, assetAccounts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = parseFloat(amount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
        alert("يرجى إدخال مبلغ صحيح.");
        return;
    }
    if (!assetAccountId) {
        alert("يرجى اختيار حساب الدفع.");
        return;
    }

    addPaymentVoucher({
        payeeName: employee.name,
        payeeId: employee.id,
        payeeType: 'employee',
        date,
        amount: finalAmount,
        assetAccountId,
        accountId: 'exp-salaries',
        description: `صرف راتب شهر ${payrollMonth} للموظف ${employee.name}`,
        employeeId: employee.id,
        payrollMonth,
    });

    alert(`تم صرف الراتب للموظف ${employee.name} بنجاح.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">دفع راتب: {employee.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 text-center">
                <p className="text-sm text-blue-600 dark:text-blue-300">الشهر المستحق</p>
                <p className="font-bold text-lg">{payrollMonth}</p>
            </div>

            <div>
                <label className="block mb-1 text-sm font-bold">المبلغ النهائي للصرف (قابل للتعديل)</label>
                <input 
                    type="number" 
                    step="any"
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                    className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg font-bold text-lg text-green-600" 
                    required 
                />
            </div>

            <div>
                <label className="block mb-1 text-sm font-bold">حساب الصرف</label>
                <SearchableSelect options={assetAccounts} value={assetAccountId} onChange={setAssetAccountId} required />
            </div>

            <div>
                <label className="block mb-1 text-sm font-bold">تاريخ العملية</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border rounded-lg" required />
            </div>

            <div className="pt-4 flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 bg-gray-100 py-3 rounded-lg font-bold">إلغاء</button>
                <button type="submit" className="flex-[2] bg-green-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2">
                    <DollarSign size={20} /> تأكيد وصرف الراتب
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default PayIndividualSalaryModal;
