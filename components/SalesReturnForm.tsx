
import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { SalesReturn, Invoice, AccountType } from '../types';
import { X } from 'lucide-react';
import SearchableSelect from './SearchableSelect';

interface SalesReturnFormProps {
  salesReturn: SalesReturn | null;
  onClose: () => void;
}

const SalesReturnForm: React.FC<SalesReturnFormProps> = ({ salesReturn, onClose }) => {
  const { addSalesReturn, updateSalesReturn, customers, invoices, accounts, formatCurrency } = useAppContext();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    customerId: '',
    invoiceId: '',
    amount: '',
    assetAccountId: '',
    description: '',
  });

  const [availableInvoices, setAvailableInvoices] = useState<Invoice[]>([]);
  
  const originalInvoice = useMemo(() => invoices.find(i => i.id === formData.invoiceId), [invoices, formData.invoiceId]);

  const maxReturnableAmount = useMemo(() => {
    if (!originalInvoice) return 0;
    return originalInvoice.totalAmount - (originalInvoice.returnedAmount || 0);
  }, [originalInvoice]);

  const assetAccounts = useMemo(() =>
    accounts.filter(a => a.type === AccountType.ASSET && a.parentId).sort((a,b) => (a.accountNumber || '').localeCompare(b.accountNumber || '', 'ar-EG-u-kn-true'))
    .map(a => ({ value: a.id, label: `${a.accountNumber ? `(${a.accountNumber}) ` : ''}${a.name}` })),
    [accounts]
  );

  useEffect(() => {
    if (salesReturn) {
      setFormData({
        date: salesReturn.date,
        customerId: salesReturn.customerId,
        invoiceId: salesReturn.invoiceId,
        amount: salesReturn.amount.toString(),
        assetAccountId: salesReturn.assetAccountId || '',
        description: salesReturn.description,
      });
    } else {
        if(assetAccounts.length > 0) {
            setFormData(prev => ({...prev, assetAccountId: assetAccounts[0].value}));
        }
    }
  }, [salesReturn, assetAccounts]);
  
  useEffect(() => {
    if (formData.customerId) {
        const customerInvoices = invoices.filter(i => i.customerId === formData.customerId && (i.totalAmount - (i.returnedAmount || 0) > 0.001));
        setAvailableInvoices(customerInvoices);
        if(formData.invoiceId && !customerInvoices.some(i => i.id === formData.invoiceId)) {
            setFormData(prev => ({...prev, invoiceId: ''}));
        }
    } else {
        setAvailableInvoices([]);
        setFormData(prev => ({...prev, invoiceId: ''}));
    }
  }, [formData.customerId, invoices, formData.invoiceId]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleInvoiceChange = (value: string) => {
      const selectedInvoice = invoices.find(i => i.id === value);
      const defaultReturnAmount = selectedInvoice 
        ? selectedInvoice.totalAmount - (selectedInvoice.paidAmount || 0) - (selectedInvoice.returnedAmount || 0) 
        : 0;

      setFormData(prev => ({ 
          ...prev, 
          invoiceId: value,
          amount: Math.max(0, defaultReturnAmount).toString()
      }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountToReturn = parseFloat(formData.amount);
    if (originalInvoice && amountToReturn > maxReturnableAmount + 0.001) { // Add tolerance
        alert(`المبلغ المدخل (${formatCurrency(amountToReturn)}) أكبر من المبلغ القابل للإرجاع (${formatCurrency(maxReturnableAmount)}).`);
        return;
    }

    const returnData = {
      ...formData,
      amount: amountToReturn,
      assetAccountId: (originalInvoice && originalInvoice.isCash) ? formData.assetAccountId : undefined,
    };

    if (salesReturn) {
      updateSalesReturn({ ...salesReturn, ...returnData });
    } else {
      addSalesReturn(returnData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{salesReturn ? 'تعديل مرتجع مبيعات' : 'إضافة مرتجع مبيعات'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="customerId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">العميل</label>
              <SearchableSelect
                name="customerId"
                id="customerId"
                value={formData.customerId}
                onChange={(value) => setFormData(prev => ({ ...prev, customerId: value }))}
                options={customers.map(c => ({ value: c.id, label: c.name }))}
                placeholder="-- اختر عميل --"
                required
              />
            </div>
            <div>
              <label htmlFor="invoiceId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">فاتورة البيع الأصلية</label>
              <SearchableSelect
                name="invoiceId"
                id="invoiceId"
                value={formData.invoiceId}
                onChange={handleInvoiceChange}
                options={availableInvoices.map(i => ({ value: i.id, label: `${i.invoiceNumber} - ${formatCurrency(i.totalAmount)}` }))}
                placeholder="-- اختر فاتورة --"
                required
                disabled={!formData.customerId}
              />
              {originalInvoice && (
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                        <div className="flex justify-between">
                            <span>إجمالي الفاتورة:</span>
                            <span className="font-mono">{formatCurrency(originalInvoice.totalAmount || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>المدفوع:</span>
                            <span className="font-mono">{formatCurrency(originalInvoice.paidAmount || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>المرتجع سابقاً:</span>
                            <span className="font-mono">{formatCurrency(originalInvoice.returnedAmount || 0)}</span>
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
            {originalInvoice && originalInvoice.isCash && (
              <div className="sm:col-span-2">
                <label htmlFor="assetAccountId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">رد المبلغ من حساب</label>
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
            {originalInvoice && !originalInvoice.isCash && (
                <div className="sm:col-span-2 flex items-end">
                    <p className="text-sm text-gray-500 dark:text-gray-400 p-2.5">سيتم إنشاء إشعار دائن لتخفيض رصيد العميل.</p>
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

export default SalesReturnForm;
