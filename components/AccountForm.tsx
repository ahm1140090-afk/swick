
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Account, AccountType, UserRole } from '../types';
import { X, AlertCircle } from 'lucide-react';
import SearchableSelect from './SearchableSelect';

interface AccountFormProps {
  account: Account | null;
  onClose: () => void;
}

const AccountForm: React.FC<AccountFormProps> = ({ account, onClose }) => {
  const { addAccount, updateAccount, accounts, setIsEditing, currentUser } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    type: AccountType.EXPENSE,
    parentId: '',
    balance: '0',
    accountNumber: '',
  });

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  useEffect(() => {
    setIsEditing(true);
    return () => {
        setIsEditing(false);
    };
  }, [setIsEditing]);

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        type: account.type,
        parentId: account.parentId || '',
        balance: account.balance.toString(),
        accountNumber: account.accountNumber || '',
      });
    }
  }, [account]);

  useEffect(() => {
    if (!account && formData.parentId) { 
        const parentAccount = accounts.find(a => a.id === formData.parentId);
        if (!parentAccount) return;

        const siblingAccounts = accounts.filter(a => a.parentId === formData.parentId);
        
        if (siblingAccounts.length > 0) {
            const maxSiblingNumber = Math.max(
                ...siblingAccounts
                    .map(a => parseInt(a.accountNumber || '0'))
                    .filter(n => !isNaN(n))
            );
            
            if (maxSiblingNumber > 0) {
                const newNumber = maxSiblingNumber + 1;
                setFormData(prev => ({ ...prev, accountNumber: newNumber.toString() }));
                return;
            }
        }
        
        const parentNumber = parentAccount.accountNumber || '';
        setFormData(prev => ({ ...prev, accountNumber: parentNumber ? `${parentNumber}01` : '' }));
    }
  }, [formData.parentId, account, accounts]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const accountData = {
      name: formData.name,
      type: formData.type,
      parentId: formData.parentId || null,
      balance: parseFloat(formData.balance) || 0,
      accountNumber: formData.accountNumber,
    };
    if (account) {
      updateAccount({ ...account, ...accountData });
    } else {
      addAccount(accountData);
    }
    onClose();
  };
  
  const parentAccounts = accounts.filter(a => a.parentId === null)
    .map(acc => ({ value: acc.id, label: `${acc.accountNumber ? `(${acc.accountNumber}) ` : ''}${acc.name}` }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{account ? 'تعديل الحساب' : 'إضافة حساب جديد'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">اسم الحساب</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" required />
                </div>
                 <div>
                    <label htmlFor="accountNumber" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">رقم الحساب</label>
                    <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" required />
                </div>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="type" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">النوع</label>
                    <select name="type" id="type" value={formData.type} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600">
                        <option value={AccountType.ASSET}>أصل</option>
                        <option value={AccountType.LIABILITY}>إلتزام</option>
                        <option value={AccountType.EQUITY}>حقوق ملكية</option>
                        <option value={AccountType.REVENUE}>إيراد</option>
                        <option value={AccountType.EXPENSE}>مصروف</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="parentId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">الحساب الأب</label>
                    <SearchableSelect
                        name="parentId"
                        id="parentId"
                        value={formData.parentId}
                        onChange={(value) => setFormData(prev => ({...prev, parentId: value}))}
                        options={parentAccounts}
                        placeholder="-- حساب رئيسي --"
                        required={false}
                    />
                </div>
            </div>
            
            <div>
                <label htmlFor="balance" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    {account ? 'الرصيد الحالي / الافتتاحي' : 'الرصيد الافتتاحي'}
                </label>
                <input 
                    type="number" 
                    name="balance" 
                    id="balance"
                    step="any"
                    value={formData.balance} 
                    onChange={handleChange} 
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" 
                    required 
                />
                <div className="mt-2 flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800">
                    <AlertCircle size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                        محاسبياً: يفضل تعديل الأرصدة عبر <strong>قيود اليومية</strong> لضمان توازن الميزانية. التعديل هنا يغير القيمة مباشرة في سجل الحساب.
                    </p>
                </div>
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

export default AccountForm;
