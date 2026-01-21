import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Budget, AccountType } from '../types';
import { X } from 'lucide-react';
import SearchableSelect from './SearchableSelect';

interface BudgetFormProps {
  budget: Budget | null;
  onClose: () => void;
}

const BudgetForm: React.FC<BudgetFormProps> = ({ budget, onClose }) => {
    const { addBudget, updateBudget, accounts, budgets, t, setIsEditing } = useAppContext();

    const today = new Date();
    const [formData, setFormData] = useState({
        accountId: '',
        periodYear: today.getFullYear().toString(),
        periodMonth: (today.getMonth() + 1).toString().padStart(2, '0'),
        amount: '',
    });
    const [error, setError] = useState('');

    useEffect(() => {
        setIsEditing(true);
        return () => {
            setIsEditing(false);
        };
    }, [setIsEditing]);

    const expenseAccounts = useMemo(() =>
        accounts
            .filter(a => a.type === AccountType.EXPENSE && a.parentId)
            .map(a => ({ value: a.id, label: `${a.accountNumber ? `(${a.accountNumber}) ` : ''}${a.name}` })),
        [accounts]
    );

    useEffect(() => {
        if (budget) {
            const [year, month] = budget.period.split('-');
            setFormData({
                accountId: budget.accountId,
                periodYear: year,
                periodMonth: month,
                amount: budget.amount.toString(),
            });
        }
    }, [budget]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const period = `${formData.periodYear}-${formData.periodMonth}`;
        const amount = parseFloat(formData.amount);
        
        if (isNaN(amount) || amount <= 0) {
            setError('الرجاء إدخال مبلغ صحيح للميزانية.');
            return;
        }

        const budgetExists = budgets.some(b => b.accountId === formData.accountId && b.period === period && b.id !== budget?.id);
        if (budgetExists) {
            setError('توجد ميزانية بالفعل لهذا الحساب في نفس الفترة.');
            return;
        }
        
        const budgetData = {
            accountId: formData.accountId,
            period,
            amount,
        };

        if (budget) {
            updateBudget({ ...budget, ...budgetData });
        } else {
            addBudget(budgetData);
        }
        onClose();
    };
    
    const years = Array.from({ length: 5 }, (_, i) => today.getFullYear() - i + 2);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">{budget ? t('edit_budget') : t('add_budget')}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">حساب المصروف</label>
                        <SearchableSelect
                            options={expenseAccounts}
                            value={formData.accountId}
                            onChange={(value) => setFormData(prev => ({ ...prev, accountId: value }))}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="periodMonth" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">الشهر</label>
                            <select name="periodMonth" value={formData.periodMonth} onChange={(e) => setFormData(p => ({...p, periodMonth: e.target.value}))} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600">
                                {months.map(m => <option key={m} value={m.toString().padStart(2, '0')}>{new Date(0, m - 1).toLocaleString('ar', { month: 'long' })}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="periodYear" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">السنة</label>
                            <select name="periodYear" value={formData.periodYear} onChange={(e) => setFormData(p => ({...p, periodYear: e.target.value}))} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600">
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="amount" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{t('budget_amount')}</label>
                        <input type="number" step="any" name="amount" value={formData.amount} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" required />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <div className="flex justify-end pt-2">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 ml-2">إلغاء</button>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">{t('save_changes')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BudgetForm;