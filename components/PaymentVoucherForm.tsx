
import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { PaymentVoucher, AccountType, Bill, EntityType } from '../types';
import { X, UserPlus, Plus } from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import SupplierForm from './SupplierForm';
import EmployeeForm from './EmployeeForm';

interface PaymentVoucherFormProps {
  voucher: PaymentVoucher | null;
  bill?: Bill | null;
  onClose: () => void;
}

const PaymentVoucherForm: React.FC<PaymentVoucherFormProps> = ({ voucher, bill, onClose }) => {
  const { addPaymentVoucher, updatePaymentVoucher, accounts, paymentVouchers, suppliers, employees, getSelectableAccountList, setIsEditing } = useAppContext();
  
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);

  const accountList = useMemo(() => getSelectableAccountList(), [getSelectableAccountList]);

  // Combined list of potential payees: Suppliers and Employees
  const payeeOptions = useMemo(() => {
    const supps = suppliers.map(s => ({ value: `supplier-${s.id}`, label: `مورد: ${s.name}`, name: s.name, type: 'supplier' }));
    const emps = employees.map(e => ({ value: `employee-${e.id}`, label: `موظف: ${e.name}`, name: e.name, type: 'employee' }));
    return [...supps, ...emps];
  }, [suppliers, employees]);

  const { assetAccounts, debitAccounts } = useMemo(() => {
    const assets = accounts.filter(a => a.type === AccountType.ASSET && a.parentId).sort((a,b) => (a.accountNumber || '').localeCompare(b.accountNumber || '', 'ar-EG-u-kn-true'))
        .map(a => ({ value: a.id, label: `${a.accountNumber ? `(${a.accountNumber}) ` : ''}${a.name}` }));
    const debits = accountList.filter(a => a.type !== AccountType.REVENUE);
    return { assetAccounts: assets, debitAccounts: debits };
  }, [accounts, accountList]);

  const [formData, setFormData] = useState({
    voucherNumber: '',
    date: new Date().toISOString().split('T')[0],
    payeeId: '', // prefixed ID
    payeeName: '',
    payeeType: 'supplier' as EntityType,
    amount: '',
    assetAccountId: '',
    accountId: 'account-exp-misc',
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
    if (bill) {
        const supplier = suppliers.find(s => s.id === bill.supplierId);
        setFormData(prev => ({
            ...prev,
            payeeId: `supplier-${bill.supplierId}`,
            payeeName: supplier?.name || '',
            payeeType: 'supplier',
            amount: (bill.amount - (bill.paidAmount || 0)).toString(),
            accountId: `supplier-${bill.supplierId}`,
            description: `دفعة من فاتورة رقم ${bill.billNumber || bill.name}`,
        }));
    } else if (voucher) {
      setFormData({
        voucherNumber: voucher.voucherNumber,
        date: voucher.date,
        payeeId: voucher.payeeId ? `${voucher.payeeType}-${voucher.payeeId}` : '',
        payeeName: voucher.payeeName,
        payeeType: voucher.payeeType || 'supplier',
        amount: voucher.amount.toString(),
        assetAccountId: voucher.assetAccountId,
        accountId: `account-${voucher.accountId}`,
        description: voucher.description,
        checkNumber: voucher.checkNumber || '',
        referenceNumber: voucher.referenceNumber || '',
      });
    } else {
        const lastVoucherNumber = paymentVouchers.reduce((max, r) => {
            const num = parseInt(r.voucherNumber.split('-')[1] || '0', 10);
            return num > max ? num : max;
        }, 0);
        const newVoucherNumber = `PAY-${(lastVoucherNumber + 1).toString().padStart(3, '0')}`;
        setFormData(prev => ({ ...prev, voucherNumber: newVoucherNumber }));
    }
    
    if (!voucher && !bill) {
        if (assetAccounts.length > 0) {
            setFormData(prev => ({...prev, assetAccountId: prev.assetAccountId || assetAccounts[0].value}));
        }
    }
  }, [voucher, bill, suppliers, employees, assetAccounts, paymentVouchers]);

  const handlePayeeChange = (value: string) => {
      const selected = payeeOptions.find(o => o.value === value);
      if (selected) {
          setFormData(prev => ({
              ...prev,
              payeeId: value,
              payeeName: selected.name,
              payeeType: selected.type as EntityType,
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
    const cleanId = formData.payeeId.split('-').pop() || '';

    const voucherData = {
      ...formData,
      payeeId: cleanId,
      amount: parseFloat(formData.amount),
      billId: bill?.id,
    };

    if (voucher) {
      updatePaymentVoucher({ ...voucher, ...voucherData });
    } else {
      addPaymentVoucher(voucherData);
    }
    onClose();
  };

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 py-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{voucher ? 'تعديل سند صرف' : 'إضافة سند صرف جديد'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="voucherNumber" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">رقم السند</label>
                    <input type="text" name="voucherNumber" value={formData.voucherNumber} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" required />
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
                    <label className="text-sm font-medium text-gray-900 dark:text-white">المستفيد</label>
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setShowAddSupplier(true)} className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 font-bold hover:underline">
                            <UserPlus size={14} /> مورد جديد
                        </button>
                        <button type="button" onClick={() => setShowAddEmployee(true)} className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 font-bold hover:underline">
                            <Plus size={14} /> موظف جديد
                        </button>
                    </div>
                </div>
                <SearchableSelect
                    options={payeeOptions}
                    value={formData.payeeId}
                    onChange={handlePayeeChange}
                    placeholder="-- اختر المورد أو الموظف --"
                    required
                    disabled={!!bill}
                />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="assetAccountId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">صرف من حساب</label>
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
                <div>
                    <label htmlFor="accountId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">مقابل (الحساب المدين)</label>
                    <SearchableSelect
                        id="accountId"
                        name="accountId"
                        value={formData.accountId}
                        onChange={(value) => setFormData(prev => ({ ...prev, accountId: value }))}
                        options={debitAccounts}
                        placeholder="-- اختر حساب --"
                        required
                        disabled={!!bill}
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

    {showAddSupplier && <SupplierForm supplier={null} onClose={() => setShowAddSupplier(false)} />}
    {showAddEmployee && <EmployeeForm employee={null} onClose={() => setShowAddEmployee(false)} />}
    </>
  );
};

export default PaymentVoucherForm;
