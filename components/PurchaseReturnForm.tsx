import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { PurchaseReturn, Bill, AccountType } from '../types';
import { X } from 'lucide-react';
import SearchableSelect from './SearchableSelect';

interface PurchaseReturnFormProps {
  purchaseReturn: PurchaseReturn | null;
  onClose: () => void;
}

const PurchaseReturnForm: React.FC<PurchaseReturnFormProps> = ({ purchaseReturn, onClose }) => {
  const { addPurchaseReturn, updatePurchaseReturn, suppliers, bills, accounts, formatCurrency } = useAppContext();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    supplierId: '',
    billId: '',
    amount: '',
    assetAccountId: '',
    description: '',
  });

  const [availableBills, setAvailableBills] = useState<Bill[]>([]);

  const originalBill = useMemo(() => bills.find(b => b.id === formData.billId), [bills, formData.billId]);

  const maxReturnableAmount = useMemo(() => {
    if (!originalBill) return 0;
    return originalBill.amount - (originalBill.returnedAmount || 0);
  }, [originalBill]);

  const assetAccounts = useMemo(() =>
    accounts.filter(a => a.type === AccountType.ASSET && a.parentId).sort((a,b) => (a.accountNumber || '').localeCompare(b.accountNumber || '', 'ar-EG-u-kn-true'))
    .map(a => ({ value: a.id, label: `${a.accountNumber ? `(${a.accountNumber}) ` : ''}${a.name}` })),
    [accounts]
  );

  useEffect(() => {
    if (purchaseReturn) {
      setFormData({
        date: purchaseReturn.date,
        supplierId: purchaseReturn.supplierId,
        billId: purchaseReturn.billId,
        amount: purchaseReturn.amount.toString(),
        assetAccountId: purchaseReturn.assetAccountId || '',
        description: purchaseReturn.description,
      });
    } else {
        if(assetAccounts.length > 0) {
            setFormData(prev => ({...prev, assetAccountId: assetAccounts[0].value}));
        }
    }
  }, [purchaseReturn, assetAccounts]);
  
  useEffect(() => {
    if (formData.supplierId) {
        const supplierBills = bills.filter(b => b.supplierId === formData.supplierId && (b.amount - (b.returnedAmount || 0) > 0.001));
        setAvailableBills(supplierBills);
        // If the current billId is not for the selected supplier, reset it
        if(formData.billId && !supplierBills.some(b => b.id === formData.billId)) {
            setFormData(prev => ({...prev, billId: ''}));
        }
    } else {
        setAvailableBills([]);
        setFormData(prev => ({...prev, billId: ''}));
    }
  }, [formData.supplierId, bills, formData.billId]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBillChange = (value: string) => {
      const selectedBill = bills.find(b => b.id === value);
      const defaultReturnAmount = selectedBill 
        ? selectedBill.amount - (selectedBill.paidAmount || 0) - (selectedBill.returnedAmount || 0)
        : 0;
      setFormData(prev => ({ 
          ...prev, 
          billId: value,
          amount: Math.max(0, defaultReturnAmount).toString()
      }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountToReturn = parseFloat(formData.amount);
    if (originalBill && amountToReturn > maxReturnableAmount + 0.001) { // Add tolerance
        alert(`المبلغ المدخل (${formatCurrency(amountToReturn)}) أكبر من المبلغ القابل للإرجاع (${formatCurrency(maxReturnableAmount)}).`);
        return;
    }

    const returnData = {
      ...formData,
      amount: amountToReturn,
      assetAccountId: (originalBill && originalBill.isCash) ? formData.assetAccountId : undefined,
    };

    if (purchaseReturn) {
      updatePurchaseReturn({ ...purchaseReturn, ...returnData });
    } else {
      addPurchaseReturn(returnData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{purchaseReturn ? 'تعديل مرتجع مشتريات' : 'إضافة مرتجع مشتريات'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="supplierId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">المورد</label>
              <SearchableSelect
                name="supplierId"
                id="supplierId"
                value={formData.supplierId}
                onChange={(value) => setFormData(prev => ({ ...prev, supplierId: value }))}
                options={suppliers.map(s => ({ value: s.id, label: s.name }))}
                placeholder="-- اختر مورد --"
                required
              />
            </div>
            <div>
              <label htmlFor="billId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">فاتورة الشراء الأصلية</label>
              <SearchableSelect
                name="billId"
                id="billId"
                value={formData.billId}
                onChange={handleBillChange}
                options={availableBills.map(b => ({ value: b.id, label: `${b.billNumber || b.name} - ${formatCurrency(b.amount)}` }))}
                placeholder="-- اختر فاتورة --"
                required
                disabled={!formData.supplierId}
              />
               {originalBill && (
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                        <div className="flex justify-between">
                            <span>إجمالي الفاتورة:</span>
                            <span className="font-mono">{formatCurrency(originalBill.amount || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>المبلغ المدفوع:</span>
                            <span className="font-mono">{formatCurrency(originalBill.paidAmount || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>المرتجع سابقاً:</span>
                            <span className="font-mono">{formatCurrency(originalBill.returnedAmount || 0)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-gray-800 dark:text-gray-200 pt-1 border-t dark:border-gray-600">
                            <span>المبلغ القابل للإرجاع:</span>
                            <span className="font-mono">{formatCurrency(maxReturnableAmount)}</span>
                        </div>
                    </div>
                )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label htmlFor="date" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">تاريخ المرتجع</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" required />
            </div>
            {originalBill && originalBill.isCash && (
              <div className="sm:col-span-2">
                <label htmlFor="assetAccountId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">استرداد المبلغ في حساب</label>
                <SearchableSelect
                    name="assetAccountId"
                    id="assetAccountId"
                    value={formData.assetAccountId}
                    onChange={(value) => setFormData(prev => ({ ...prev, assetAccountId: value }))}
                    options={assetAccounts}
                    placeholder="-- اختر حساب --"
                    required
                />
              </div>
            )}
            {originalBill && !originalBill.isCash && (
                <div className="sm:col-span-2 flex items-end">
                    <p className="text-sm text-gray-500 dark:text-gray-400 p-2.5">سيتم إنشاء إشعار دائن لتخفيض رصيد المورد.</p>
                </div>
            )}
          </div>
          <div>
            <label htmlFor="amount" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">المبلغ المسترد</label>
            <input type="number" step="any" name="amount" value={formData.amount} onChange={handleChange} max={maxReturnableAmount} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" required />
          </div>
          <div>
            <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">الوصف</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={2} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" required />
          </div>
          <div className="flex justify-end pt-2">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 ml-2">إلغاء</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">حفظ</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseReturnForm;