
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { UserRole, Budget } from '../types';
import { Plus, Edit, Trash2, PiggyBank } from 'lucide-react';
import BudgetForm from './BudgetForm';

// FIX: Define a props interface for BudgetCard and use React.FC to correctly type the component.
// This resolves the error where the 'key' prop was being incorrectly checked against the component's props.
interface BudgetCardProps {
    budget: any;
    onEdit: (b: Budget) => void;
    onDelete: (id: string) => void;
}

// BudgetCard component for clean UI
const BudgetCard: React.FC<BudgetCardProps> = ({ budget, onEdit, onDelete }) => {
    const { formatCurrency, t } = useAppContext();
    const { accountName, period, amount, actual, remaining } = budget;

    const percentage = amount > 0 ? (actual / amount) * 100 : 0;
    const progressBarColor = percentage > 100 ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500';

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-800 dark:text-white">{accountName}</h3>
                    <div className="flex items-center gap-2">
                        <button onClick={() => onEdit(budget)} className="text-blue-500 hover:text-blue-700"><Edit size={16} /></button>
                        <button onClick={() => onDelete(budget.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                    </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('budget_for_period')} {period}</p>
            </div>
            <div className="mt-4">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div className={`${progressBarColor} h-2.5 rounded-full`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                </div>
                <div className="text-sm mt-2 flex justify-between">
                    <span>{t('actual_spending')}: {formatCurrency(actual)}</span>
                    <span>{t('budget_amount')}: {formatCurrency(amount)}</span>
                </div>
                {remaining >= 0 ? (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">{t('remaining')}: {formatCurrency(remaining)}</p>
                ) : (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{t('overspent_by')}: {formatCurrency(Math.abs(remaining))}</p>
                )}
            </div>
        </div>
    );
};


const Budgets: React.FC = () => {
    const { budgets, accounts, journalEntries, deleteBudget, currentUser, t } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

    const today = new Date();
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
    
    const canEdit = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.ACCOUNTANT;
    
    const selectedPeriod = useMemo(() => `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`, [selectedYear, selectedMonth]);

    const periodBudgets = useMemo(() => {
        return budgets
            .filter(b => b.period === selectedPeriod)
            .map(budget => {
                const account = accounts.find(a => a.id === budget.accountId);
                
                const actualSpending = journalEntries
                    .filter(je => je.date.startsWith(selectedPeriod))
                    .flatMap(je => je.lines)
                    .filter(line => line.accountId === budget.accountId)
                    .reduce((sum, line) => sum + (line.debit - line.credit), 0);
                
                return {
                    ...budget,
                    accountName: account?.name || 'حساب محذوف',
                    actual: actualSpending,
                    remaining: budget.amount - actualSpending,
                };
            });
    }, [budgets, accounts, journalEntries, selectedPeriod]);

    const handleAddNew = () => {
        setEditingBudget(null);
        setIsModalOpen(true);
    };

    const handleEdit = (budget: Budget) => {
        setEditingBudget(budget);
        setIsModalOpen(true);
    };
    
    const handleDelete = (id: string) => {
        if(window.confirm('هل أنت متأكد من رغبتك في حذف هذه الميزانية؟')) {
            deleteBudget(id);
        }
    }

    const years = Array.from({ length: 5 }, (_, i) => today.getFullYear() - i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex flex-wrap items-center gap-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('budgets')}</h2>
                    <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600">
                        {months.map(m => <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('ar', { month: 'long' })}</option>)}
                    </select>
                    <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600">
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                {canEdit && (
                    <button onClick={handleAddNew} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        <Plus size={18} className="ml-2" />
                        {t('add_budget')}
                    </button>
                )}
            </div>

            {periodBudgets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {periodBudgets.map(budget => (
                        <BudgetCard key={budget.id} budget={budget} onEdit={handleEdit} onDelete={handleDelete} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                     <PiggyBank size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t('no_budgets_for_period')}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">ابدأ بإضافة ميزانية لهذا الشهر لتتبع إنفاقك.</p>
                </div>
            )}

            {isModalOpen && canEdit && (
                <BudgetForm budget={editingBudget} onClose={() => setIsModalOpen(false)} />
            )}
        </div>
    );
};

export default Budgets;
