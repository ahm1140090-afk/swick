
import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Transaction, TransactionType, AccountType, SelectableAccount } from '../types';
import { X } from 'lucide-react';
import SearchableSelect from './SearchableSelect';

interface TransactionFormProps {
  transaction: Transaction | null;
  onClose: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ transaction, onClose }) => {
  const { addTransaction, updateTransaction, accounts, getSelectableAccountList, costCenters, setIsEditing } = useAppContext();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    accountId: '',
    amount: '',
    type: TransactionType.EXPENSE,
    assetAccountId: '',
    toAssetAccountId: '',
    costCenterId: '',
  });
  
  useEffect(() => {
    setIsEditing(true);
    return () => {
        setIsEditing(false);
    };
  }, [setIsEditing]);

  useEffect(() => {
    if (transaction) {
      let formAccountId = transaction.accountId ? `account-${transaction.accountId}` : '';
      if (transaction.entityType && transaction.entityId) {
        formAccountId = `${transaction.entityType}-${transaction.entityId}`;
      }
      setFormData({
        date: transaction.date,
        description: transaction.description,
        accountId: formAccountId,
        amount: transaction.amount.toString(),
        type: transaction.type,
        assetAccountId: transaction.assetAccountId || '',
        toAssetAccountId: transaction.toAssetAccountId || '',
        costCenterId: transaction.costCenterId || '',
      });
    }
  }, [transaction]);

  const allAccountsList = useMemo(() => getSelectableAccountList(), [getSelectableAccountList]);
  const costCenterOptions = useMemo(() => costCenters.map(cc => ({ value: cc.id, label: cc.name })), [costCenters]);

  const { filteredAccounts, assetAccounts } = useMemo(() => {
    const assets = accounts.filter(a => a.type === AccountType.ASSET && a.parentId !== null).sort((a,b) => (a.accountNumber || '').localeCompare(b.accountNumber || '', 'ar-EG-u-kn-true'));
    let filtered: SelectableAccount[] = [];
    if (formData.type === TransactionType.INCOME) {
        // Show all accounts except Expenses
        filtered = allAccountsList.filter(a => a.type !== AccountType.EXPENSE);
    } else if (formData.type === TransactionType.EXPENSE) {
        // Show all accounts except Revenues
        filtered = allAccountsList.filter(a => a.type !== AccountType.REVENUE);
    }
    return {
        filteredAccounts: filtered,
        assetAccounts: assets.map(a => ({ value: a.id, label: `${a.accountNumber ? `(${a.accountNumber}) ` : ''}${a.name}` })),
    }
  }, [accounts, allAccountsList, formData.type]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleTypeChange = (type: TransactionType) => {
    setFormData(prev => ({ ...prev, type, accountId: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.type === TransactionType.TRANSFER && formData.assetAccountId === formData.toAssetAccountId) {
        alert("لا يمكن التحويل من وإلى نفس الحساب.");
        return;
    }

    const transactionData = {
      date: formData.date,
      description: formData.description,
      amount: parseFloat(formData.amount),
      type: formData.type,
      accountId: formData.type !== TransactionType.TRANSFER ? formData.accountId : undefined,
      assetAccountId: formData.assetAccountId || undefined,
      toAssetAccountId: formData.type === TransactionType.TRANSFER ? formData.toAssetAccountId : undefined,
      costCenterId: formData.costCenterId || undefined,
    };
    if (transaction) {
      updateTransaction({ ...transactionData, id: transaction.id });
    } else {
      addTransaction(transactionData);
    }
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{transaction ? 'تعديل المعاملة' : 'إضافة معاملة جديدة'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">النوع</label>
                <div className="grid grid-cols-3 gap-2">
                    <button type="button" onClick={() => handleTypeChange(TransactionType.EXPENSE)} className={`p-2.5 rounded-lg border text-sm ${formData.type === TransactionType.EXPENSE ? 'bg-red-500 text-white border-red-500' : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600'}`}>مصروف</button>
                    <button type="button" onClick={() => handleTypeChange(TransactionType.INCOME)} className={`p-2.5 rounded-lg border text-sm ${formData.type === TransactionType.INCOME ? 'bg-green-500 text-white border-green-500' : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600'}`}>دخل</button>
                    <button type="button" onClick={() => handleTypeChange(TransactionType.TRANSFER)} className={`p-2.5 rounded-lg border text-sm ${formData.type === TransactionType.TRANSFER ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600'}`}>تحويل</button>
                </div>
            </div>
            <div>
                <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">الوصف</label>
                <input type="text" name="description" value={formData.description} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="amount" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">المبلغ</label>
                    <input type="number" step="any" name="amount" value={formData.amount} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" required />
                </div>
                <div>
                    <label htmlFor="date" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">التاريخ</label>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" required />
                </div>
            </div>
            {formData.type === TransactionType.TRANSFER ? (
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label htmlFor="assetAccountId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">من حساب (دائن)</label>
                      <SearchableSelect
                          options={assetAccounts}
                          value={formData.assetAccountId}
                          onChange={(value) => setFormData(prev => ({...prev, assetAccountId: value}))}
                          placeholder="-- اختر --"
                          required
                      />
                  </div>
                  <div>
                      <label htmlFor="toAssetAccountId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">إلى حساب (مدين)</label>
                      <SearchableSelect
                          options={assetAccounts}
                          value={formData.toAssetAccountId}
                          onChange={(value) => setFormData(prev => ({...prev, toAssetAccountId: value}))}
                          placeholder="-- اختر --"
                          required
                      />
                  </div>
              </div>
            ) : formData.type === TransactionType.INCOME ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="assetAccountId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      حساب الإيداع (مدين)
                    </label>
                     <SearchableSelect
                          options={assetAccounts}
                          value={formData.assetAccountId}
                          onChange={(value) => setFormData(prev => ({...prev, assetAccountId: value}))}
                          placeholder="-- اختر حساب بنك/صندوق --"
                          required
                      />
                </div>
                <div>
                   <label htmlFor="accountId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                     مصدر الإيراد (دائن)
                   </label>
                    <SearchableSelect
                         options={filteredAccounts}
                         value={formData.accountId}
                         onChange={(value) => setFormData(prev => ({...prev, accountId: value}))}
                         placeholder="-- اختر حساب إيراد أو عميل --"
                         required
                     />
               </div>
              </div>
            ) : ( // For Expense
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="accountId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      بند المصروف (مدين)
                    </label>
                     <SearchableSelect
                          options={filteredAccounts}
                          value={formData.accountId}
                          onChange={(value) => setFormData(prev => ({...prev, accountId: value}))}
                          placeholder="-- اختر حساب مصروف أو مورد --"
                          required
                      />
                </div>
                 <div>
                    <label htmlFor="assetAccountId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      حساب الدفع (دائن)
                    </label>
                     <SearchableSelect
                          options={assetAccounts}
                          value={formData.assetAccountId}
                          onChange={(value) => setFormData(prev => ({...prev, assetAccountId: value}))}
                          placeholder="-- اختر حساب بنك/صندوق --"
                          required
                      />
                </div>
              </div>
            )}
            
            {formData.type !== TransactionType.TRANSFER && (
                 <div>
                    <label htmlFor="costCenterId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">مركز التكلفة (اختياري)</label>
                    <SearchableSelect
                        options={costCenterOptions}
                        value={formData.costCenterId}
                        onChange={(value) => setFormData(prev => ({...prev, costCenterId: value}))}
                        placeholder="-- اختر مركز تكلفة --"
                        required={false}
                    />
                </div>
            )}

            <div className="flex justify-end pt-2">
                <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 ml-2">إلغاء</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">حفظ</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
