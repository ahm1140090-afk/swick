
import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { PaymentReceipt, AccountType, Invoice, EntityType } from '../types';
import { X, UserPlus, Plus } from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import CustomerForm from './CustomerForm';
import SupplierForm from './SupplierForm';
import EmployeeForm from './EmployeeForm';

interface PaymentReceiptFormProps {
  receipt: PaymentReceipt | null;
  invoice?: Invoice | null;
  onClose: () => void;
}

const PaymentReceiptForm: React.FC<PaymentReceiptFormProps> = ({ receipt, invoice, onClose }) => {
  const { addPaymentReceipt, updatePaymentReceipt, customers, suppliers, employees, accounts, paymentReceipts, getSelectableAccountList, setIsEditing } = useAppContext();
  
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);

  const accountList = useMemo(() => getSelectableAccountList(), [getSelectableAccountList]);

  // Comprehensive list of parties: Customers, Suppliers, and Employees
  const partyOptions = useMemo(() => {
    const custs = customers.map(c => ({ value: `customer-${c.id}`, label: `عميل: ${c.name}`, name: c.name, type: 'customer' }));
    const supps = suppliers.map(s => ({ value: `supplier-${s.id}`, label: `مورد: ${s.name}`, name: s.name, type: 'supplier' }));
    const emps = employees.map(e => ({ value: `employee-${e.id}`, label: `موظف: ${e.name}`, name: e.name, type: 'employee' }));
    return [...custs, ...supps, ...emps];
  }, [customers, suppliers, employees]);

  const { assetAccounts, creditAccounts } = useMemo(() => {
    const assets = accounts.filter(a => a.type === AccountType.ASSET && a.parentId).sort((a,b) => (a.accountNumber || '').localeCompare(b.accountNumber || '', 'ar-EG-u-kn-true'))
        .map(a => ({ value: a.id, label: `${a.accountNumber ? `(${a.accountNumber}) ` : ''}${a.name}` }));
    const credits = accountList;
    return { assetAccounts: assets, creditAccounts: credits };
  }, [accounts, accountList]);

  const [formData, setFormData] = useState({
    receiptNumber: '',
    date: new Date().toISOString().split('T')[0],
    customerId: '', // prefixed ID
    partyName: '',
    partyType: 'customer' as EntityType,
    amount: '',
    assetAccountId: '',
    accountId: 'account-rev-misc',
    description: '',
    checkNumber: '',
    referenceNumber: '',
  });

  useEffect(() => {
    setIsEditing(true);
    return () => {
        setIsEditing(false);
    };
  }, [setIsEditing]);

  useEffect(() => {
    if (invoice) {
        const cust = customers.find(c => c.id === invoice.customerId);
        setFormData(prev => ({
            ...prev,
            customerId: `customer-${invoice.customerId}`,
            partyName: cust?.name || '',
            partyType: 'customer',
            amount: (invoice.totalAmount - invoice.paidAmount).toString(),
            description: `دفعة من فاتورة رقم ${invoice.invoiceNumber}`,
            accountId: `customer-${invoice.customerId}`,
        }));
    } else if (receipt) {
      setFormData({
        receiptNumber: receipt.receiptNumber,
        date: receipt.date,
        customerId: `${receipt.partyType}-${receipt.customerId}`,
        partyName: receipt.partyName,
        partyType: receipt.partyType,
        amount: receipt.amount.toString(),
        assetAccountId: receipt.assetAccountId,
        accountId: `account-${receipt.accountId}`,
        description: receipt.description,
        checkNumber: receipt.checkNumber || '',
        referenceNumber: receipt.referenceNumber || '',
      });
    } else {
        const lastReceiptNumber = paymentReceipts.reduce((max, r) => {
            const num = parseInt(r.receiptNumber.split('-')[1] || '0', 10);
            return num > max ? num : max;
        }, 0);
        const newReceiptNumber = `RCV-${(lastReceiptNumber + 1).toString().padStart(3, '0')}`;
        setFormData(prev => ({ ...prev, receiptNumber: newReceiptNumber }));
    }
    
    if (!receipt && !invoice) {
        if (assetAccounts.length > 0) {
            setFormData(prev => ({...prev, assetAccountId: prev.assetAccountId || assetAccounts[0].value}));
        }
    }
  }, [receipt, invoice, assetAccounts, customers, suppliers, employees, paymentReceipts]);

  const handlePartyChange = (value: string) => {
      const selected = partyOptions.find(o => o.value === value);
      if (selected) {
          setFormData(prev => ({
              ...prev,
              customerId: value,
              partyName: selected.name,
              partyType: selected.type as EntityType,
              accountId: value 
          }));
      }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = formData.customerId.split('-').pop() || '';

    const receiptData = {
      ...formData,
      customerId: cleanId, // still uses this field for legacy/ID
      amount: parseFloat(formData.amount),
      invoiceId: invoice?.id,
    };

    if (receipt) {
      updatePaymentReceipt({ ...receipt, ...receiptData });
    } else {
      addPaymentReceipt(receiptData);
    }
    onClose();
  };

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 py-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{receipt ? 'تعديل سند قبض' : 'إضافة سند قبض جديد'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="receiptNumber" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">رقم السند</label>
                    <input type="text" name="receiptNumber" value={formData.receiptNumber} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" required />
                </div>
                <div>
                    <label htmlFor="date" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">التاريخ</label>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" required />
                </div>
                 <div>
                    <label htmlFor="amount" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">المبلغ</label>
                    <input type="number" name="amount" value={formData.amount} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" required />
                </div>
            </div>

            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-900 dark:text-white">الطرف المقابل</label>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setShowAddCustomer(true)} className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 flex items-center gap-0.5 font-bold hover:underline">
                            <UserPlus size={12} /> عميل
                        </button>
                        <button type="button" onClick={() => setShowAddSupplier(true)} className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 flex items-center gap-0.5 font-bold hover:underline">
                            <UserPlus size={12} /> مورد
                        </button>
                        <button type="button" onClick={() => setShowAddEmployee(true)} className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 flex items-center gap-0.5 font-bold hover:underline">
                            <Plus size={12} /> موظف
                        </button>
                    </div>
                </div>
                <SearchableSelect
                    value={formData.customerId}
                    onChange={handlePartyChange}
                    options={partyOptions}
                    placeholder="-- اختر الطرف المستلم منه --"
                    required
                    disabled={!!invoice}
                />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="assetAccountId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">إيداع في حساب</label>
                    <SearchableSelect
                        id="assetAccountId"
                        name="assetAccountId"
                        value={formData.assetAccountId}
                        onChange={(value) => setFormData(prev => ({ ...prev, assetAccountId: value }))}
                        options={assetAccounts}
                        placeholder="-- اختر حساب --"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="accountId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">مقابل (الحساب الدائن)</label>
                    <SearchableSelect
                        id="accountId"
                        name="accountId"
                        value={formData.accountId}
                        onChange={(value) => setFormData(prev => ({ ...prev, accountId: value }))}
                        options={creditAccounts}
                        placeholder="-- اختر حساب --"
                        required
                        disabled={!!invoice}
                    />
                </div>
            </div>

             <div>
                <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">الوصف</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" required />
            </div>

            <div className="flex justify-end pt-2">
                <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 ml-2">إلغاء</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">حفظ</button>
            </div>
        </form>
      </div>
    </div>

    {showAddCustomer && <CustomerForm customer={null} onClose={() => setShowAddCustomer(false)} />}
    {showAddSupplier && <SupplierForm supplier={null} onClose={() => setShowAddSupplier(false)} />}
    {showAddEmployee && <EmployeeForm employee={null} onClose={() => setShowAddEmployee(false)} />}
    </>
  );
};

export default PaymentReceiptForm;
