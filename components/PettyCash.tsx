import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { AccountType } from '../types';
import { Plus, Repeat } from 'lucide-react';
import SearchableSelect from './SearchableSelect';

const PettyCash: React.FC = () => {
    const { accounts, journalEntries, addJournalEntry, t, formatCurrency } = useAppContext();
    
    const PETTY_CASH_ACCOUNT_ID = 'asset-petty-cash';

    // Expense Form State
    const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
    const [expenseDescription, setExpenseDescription] = useState('');
    const [expenseAccountId, setExpenseAccountId] = useState('');
    const [expenseAmount, setExpenseAmount] = useState('');

    // Replenish Form State
    const [replenishAmount, setReplenishAmount] = useState('');
    const [fromAccountId, setFromAccountId] = useState('');

    const { pettyCashAccount, expenseAccounts, otherAssetAccounts } = useMemo(() => {
        const pcAccount = accounts.find(a => a.id === PETTY_CASH_ACCOUNT_ID);
        const expAccounts = accounts
            .filter(a => a.type === AccountType.EXPENSE && a.parentId)
            .map(a => ({ value: a.id, label: `${a.accountNumber ? `(${a.accountNumber}) ` : ''}${a.name}` }));
        const otherAssets = accounts
            .filter(a => a.type === AccountType.ASSET && a.parentId && a.id !== PETTY_CASH_ACCOUNT_ID)
            .map(a => ({ value: a.id, label: `${a.accountNumber ? `(${a.accountNumber}) ` : ''}${a.name}` }));
            
        return {
            pettyCashAccount: pcAccount,
            expenseAccounts: expAccounts,
            otherAssetAccounts: otherAssets,
        };
    }, [accounts]);

    const pettyCashMovements = useMemo(() => {
        return journalEntries
            .flatMap(je => je.lines
                .filter(line => line.accountId === PETTY_CASH_ACCOUNT_ID)
                .map(line => ({
                    ...line,
                    date: je.date,
                    entryDescription: je.description,
                    isDebit: line.debit > 0, // Debit to petty cash is a replenishment
                }))
            )
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [journalEntries]);

    const handleAddExpense = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(expenseAmount);
        if (!expenseAccountId || !expenseDescription || isNaN(amount) || amount <= 0) {
            alert('يرجى تعبئة جميع الحقول بشكل صحيح.');
            return;
        }

        addJournalEntry({
            date: expenseDate,
            description: `مصروفات نثرية: ${expenseDescription}`,
            lines: [
                { id: '1', accountId: `account-${expenseAccountId}`, debit: amount, credit: 0, description: '' },
                { id: '2', accountId: `account-${PETTY_CASH_ACCOUNT_ID}`, debit: 0, credit: amount, description: '' },
            ]
        });

        // Reset form
        setExpenseDescription('');
        setExpenseAmount('');
    };

    const handleReplenish = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(replenishAmount);
        if (!fromAccountId || isNaN(amount) || amount <= 0) {
            alert('يرجى تعبئة جميع الحقول بشكل صحيح.');
            return;
        }

        addJournalEntry({
            date: new Date().toISOString().split('T')[0],
            description: t('replenish_petty_cash'),
            lines: [
                { id: '1', accountId: `account-${PETTY_CASH_ACCOUNT_ID}`, debit: amount, credit: 0, description: '' },
                { id: '2', accountId: `account-${fromAccountId}`, debit: 0, credit: amount, description: '' },
            ]
        });
        
        // Reset form
        setReplenishAmount('');
    };

    if (!pettyCashAccount) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
                <p className="text-red-500">لم يتم العثور على حساب المصاريف النثرية (asset-petty-cash). الرجاء إضافته من شجرة الحسابات.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div className="bg-blue-500 text-white p-6 rounded-lg shadow-lg flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold">{t('petty_cash')}</h2>
                    <p className="text-3xl font-bold">{formatCurrency(pettyCashAccount.balance)}</p>
                </div>
                 <Repeat size={48} className="opacity-20" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Add Expense Form */}
                <form onSubmit={handleAddExpense} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4">
                    <h3 className="text-lg font-bold">{t('add_expense')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">المبلغ</label>
                            <input type="number" step="any" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" required />
                        </div>
                        <div>
                             <label className="block text-sm font-medium mb-1">التاريخ</label>
                            <input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" required />
                        </div>
                    </div>
                    <div>
                         <label className="block text-sm font-medium mb-1">الوصف</label>
                        <input type="text" value={expenseDescription} onChange={e => setExpenseDescription(e.target.value)} className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">حساب المصروف</label>
                        <SearchableSelect options={expenseAccounts} value={expenseAccountId} onChange={setExpenseAccountId} required />
                    </div>
                    <button type="submit" className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 flex items-center justify-center gap-2">
                        <Plus size={18} /> {t('add_expense')}
                    </button>
                </form>

                {/* Replenish Form */}
                <form onSubmit={handleReplenish} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4">
                    <h3 className="text-lg font-bold">{t('replenish_petty_cash')}</h3>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('replenishment_amount')}</label>
                        <input type="number" step="any" value={replenishAmount} onChange={e => setReplenishAmount(e.target.value)} className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('replenish_from')}</label>
                        <SearchableSelect options={otherAssetAccounts} value={fromAccountId} onChange={setFromAccountId} required />
                    </div>
                     <div className="pt-16"></div> {/* Spacer to align buttons */}
                    <button type="submit" className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 flex items-center justify-center gap-2">
                         <Repeat size={18} /> {t('replenish')}
                    </button>
                </form>
            </div>
            
             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-bold mb-4">سجل الحركات</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                             <tr>
                                <th className="px-4 py-3">التاريخ</th>
                                <th className="px-4 py-3">الوصف</th>
                                <th className="px-4 py-3">المبلغ</th>
                                <th className="px-4 py-3">النوع</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pettyCashMovements.map(m => (
                                <tr key={m.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-4 py-3">{m.date}</td>
                                    <td className="px-4 py-3 font-medium">{m.entryDescription}</td>
                                    <td className={`px-4 py-3 font-mono font-bold ${m.isDebit ? 'text-green-500' : 'text-red-500'}`}>
                                        {formatCurrency(m.isDebit ? m.debit : m.credit)}
                                    </td>
                                    <td className="px-4 py-3">
                                        {m.isDebit ? (
                                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">{t('replenish')}</span>
                                        ) : (
                                             <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">مصروف</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {pettyCashMovements.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center py-8 text-gray-500">لا توجد حركات.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
             </div>
        </div>
    );
};

export default PettyCash;
