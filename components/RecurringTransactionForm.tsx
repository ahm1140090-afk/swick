import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { RecurringTransaction, TransactionType, AccountType, SelectableAccount } from '../types';
import { X } from 'lucide-react';
import SearchableSelect from './SearchableSelect';

interface RecurringTransactionFormProps {
  transaction: RecurringTransaction | null;
  onClose: () => void;
}

const RecurringTransactionForm: React.FC<RecurringTransactionFormProps> = ({ transaction, onClose }) => {
  const { addRecurringTransaction, updateRecurringTransaction, accounts, getSelectableAccountList, t } = useAppContext();
  
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string | null>(null);

  const [details, setDetails] = useState({
    description: '',
    accountId: '',
    amount: '',
    type: TransactionType.EXPENSE,
    assetAccountId: '',
    toAssetAccountId: '',
  });

  useEffect(() => {
    if (transaction) {
      setName(transaction.name);
      setFrequency(transaction.frequency);
      setStartDate(transaction.startDate);
      setEndDate(transaction.endDate || null);
      setDetails({
        description: transaction.transactionDetails.description,
        accountId: transaction.transactionDetails.accountId || '',
        amount: transaction.transactionDetails.amount.toString(),
        type: transaction.transactionDetails.type,
        assetAccountId: transaction.transactionDetails.assetAccountId || '',
        toAssetAccountId: transaction.transactionDetails.toAssetAccountId || '',
      });
    }
  }, [transaction]);

  const allAccountsList = useMemo(() => getSelectableAccountList(), [getSelectableAccountList]);

  const { filteredAccounts, assetAccounts } = useMemo(() => {
    const assets = accounts.filter(a => a.type === AccountType.ASSET && a.parentId !== null).sort((a,b) => (a.accountNumber || '').localeCompare(b.accountNumber || '', 'ar-EG-u-kn-true'));
    let filtered: SelectableAccount[] = [];
    if (details.type === TransactionType.INCOME) {
        filtered = allAccountsList.filter(a => a.type !== AccountType.EXPENSE);
    } else if (details.type === TransactionType.EXPENSE) {
        filtered = allAccountsList.filter(a => a.type !== AccountType.REVENUE);
    }
    return {
        filteredAccounts: filtered,
        assetAccounts: assets.map(a => ({ value: a.id, label: `${a.accountNumber ? `(${a.accountNumber}) ` : ''}${a.name}` })),
    }
  }, [accounts, allAccountsList, details.type]);

  const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDetails(prev => ({ ...prev, [name]: value }));
  };
  
  const handleTypeChange = (type: TransactionType) => {
    setDetails(prev => ({ ...prev, type, accountId: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (endDate && new Date(endDate) < new Date(startDate)) {
        alert("تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء.");
        return;
    }

    const transactionData = {
      name,
      frequency,
      startDate,
      endDate,
      transactionDetails: {
        description: details.description,
        amount: parseFloat(details.amount),
        type: details.type,
        accountId: details.type !== TransactionType.TRANSFER ? details.accountId : undefined,
        assetAccountId: details.assetAccountId || undefined,
        toAssetAccountId: details.type === TransactionType.TRANSFER ? details.toAssetAccountId : undefined,
      }
    };
    if (transaction) {
      updateRecurringTransaction({ ...transaction, ...transactionData });
    } else {
      addRecurringTransaction(transactionData);
    }
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 py-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{transaction ? t('edit_recurring_transaction') : t('add_recurring_transaction')}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">اسم المعاملة (مثال: إيجار شهري)</label>
                <input type="text" name="name" value={name} onChange={(e) => setName(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" required />
            </div>

            <fieldset className="border p-4 rounded-lg dark:border-gray-600">
                <legend className="px-2 font-semibold">{t('transaction_template')}</legend>
                <div className="space-y-4">
                     <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">النوع</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button type="button" onClick={() => handleTypeChange(TransactionType.EXPENSE)} className={`p-2.5 rounded-lg border text-sm ${details.type === TransactionType.EXPENSE ? 'bg-red-500 text-white border-red-500' : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600'}`}>مصروف</button>
                            <button type="button" onClick={() => handleTypeChange(TransactionType.INCOME)} className={`p-2.5 rounded-lg border text-sm ${details.type === TransactionType.INCOME ? 'bg-green-500 text-white border-green-500' : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600'}`}>دخل</button>
                            <button type="button" onClick={() => handleTypeChange(TransactionType.TRANSFER)} className={`p-2.5 rounded-lg border text-sm ${details.type === TransactionType.TRANSFER ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600'}`}>تحويل</button>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">الوصف</label>
                        <input type="text" name="description" value={details.description} onChange={handleDetailChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" required />
                    </div>
                    <div>
                        <label htmlFor="amount" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">المبلغ</label>
                        <input type="number" step="any" name="amount" value={details.amount} onChange={handleDetailChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" required />
                    </div>
                    {details.type === TransactionType.TRANSFER ? (
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">من حساب</label>
                              <SearchableSelect options={assetAccounts} value={details.assetAccountId} onChange={(v) => setDetails(p => ({...p, assetAccountId: v}))} required />
                          </div>
                          <div>
                              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">إلى حساب</label>
                              <SearchableSelect options={assetAccounts} value={details.toAssetAccountId} onChange={(v) => setDetails(p => ({...p, toAssetAccountId: v}))} required />
                          </div>
                      </div>
                    ) : (
                       <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">الحساب</label>
                             <SearchableSelect options={filteredAccounts} value={details.accountId} onChange={(v) => setDetails(p => ({...p, accountId: v}))} required />
                        </div>
                         <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{details.type === TransactionType.INCOME ? 'إلى حساب' : 'من حساب'}</label>
                             <SearchableSelect options={assetAccounts} value={details.assetAccountId} onChange={(v) => setDetails(p => ({...p, assetAccountId: v}))} required />
                        </div>
                      </div>
                    )}
                </div>
            </fieldset>

            <fieldset className="border p-4 rounded-lg dark:border-gray-600">
                <legend className="px-2 font-semibold">الجدول الزمني</legend>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     <div>
                        <label htmlFor="frequency" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{t('frequency')}</label>
                        <select name="frequency" value={frequency} onChange={(e) => setFrequency(e.target.value as any)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600">
                            <option value="daily">{t('daily')}</option>
                            <option value="weekly">{t('weekly')}</option>
                            <option value="monthly">{t('monthly')}</option>
                            <option value="yearly">{t('yearly')}</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="startDate" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{t('start_date')}</label>
                        <input type="date" name="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" required />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{t('end_date')}</label>
                        <input type="date" name="endDate" value={endDate || ''} onChange={(e) => setEndDate(e.target.value || null)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                </div>
            </fieldset>

            <div className="flex justify-end pt-2">
                <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 ml-2">إلغاء</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">{t('save_changes')}</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default RecurringTransactionForm;