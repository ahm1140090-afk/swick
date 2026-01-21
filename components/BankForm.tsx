import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Account, AccountType } from '../types';
import { X } from 'lucide-react';

interface BankFormProps {
  account: Account | null;
  onClose: () => void;
}

const BankForm: React.FC<BankFormProps> = ({ account, onClose }) => {
  const { addAccount, updateAccount, setIsEditing } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    balance: '0',
    accountNumber: '',
    iban: '',
  });

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
        balance: account.balance.toString(),
        accountNumber: account.accountNumber || '',
        iban: account.iban || '',
      });
    }
  }, [account]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (account) {
      // Update name, accountNumber, and IBAN for existing accounts
      updateAccount({
        ...account,
        name: formData.name,
        accountNumber: formData.accountNumber,
        iban: formData.iban,
       });
    } else {
      const accountData: Omit<Account, 'id'> = {
        name: formData.name,
        type: AccountType.ASSET,
        parentId: 'asset-1', // Hardcoded parent for assets
        balance: parseFloat(formData.balance) || 0,
        accountNumber: formData.accountNumber || undefined,
        iban: formData.iban || undefined,
      };
      addAccount(accountData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{account ? 'تعديل الحساب' : 'إضافة حساب بنكي/نقدي'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">اسم الحساب</label>
                <input 
                    type="text" 
                    name="name" 
                    id="name"
                    value={formData.name} 
                    onChange={handleChange} 
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" 
                    required 
                />
            </div>
             <div>
                <label htmlFor="accountNumber" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">رقم الحساب (اختياري)</label>
                <input 
                    type="text" 
                    name="accountNumber" 
                    id="accountNumber"
                    value={formData.accountNumber} 
                    onChange={handleChange} 
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" 
                />
            </div>
             <div>
                <label htmlFor="iban" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">الآيبان (اختياري)</label>
                <input 
                    type="text" 
                    name="iban" 
                    id="iban"
                    value={formData.iban} 
                    onChange={handleChange} 
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" 
                />
            </div>
             <div>
                <label htmlFor="balance" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    {account ? 'الرصيد الحالي' : 'الرصيد الافتتاحي'}
                </label>
                <input 
                    type="number" 
                    name="balance" 
                    id="balance"
                    value={formData.balance} 
                    onChange={handleChange} 
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 disabled:bg-gray-200 dark:disabled:bg-gray-600" 
                    required 
                    disabled={!!account} // Disable for existing accounts
                />
                 {account && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">لا يمكن تعديل الرصيد مباشرة. يتم تحديثه تلقائياً من خلال المعاملات.</p>}
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

export default BankForm;