
// FIX: Imported the 'useEffect' hook to resolve a 'Cannot find name' error.
import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { AccruedExpense, UserRole, AccountType } from '../types';
import { Plus, Edit, DollarSign, Search } from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import { X } from 'lucide-react';

// Form for adding a new Accrued Expense
const AccruedExpenseForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { addAccruedExpense, accounts, t } = useAppContext();
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        expenseAccountId: '',
    });

    const expenseAccounts = useMemo(() =>
        accounts.filter(a => a.type === AccountType.EXPENSE && a.parentId)
            .map(a => ({ value: a.id, label: a.name })),
        [accounts]
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(formData.amount);
        if (isNaN(amount) || amount <= 0 || !formData.expenseAccountId) {
            alert('Please fill all fields correctly.');
            return;
        }
        addAccruedExpense({ ...formData, amount, liabilityAccountId: 'lia-accrued-exp' });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{t('add_accrued_expense')}</h2>
                    <button onClick={onClose}><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium">{t('accrual_date')}</label>
                        <input type="date" value={formData.date} onChange={e => setFormData(p => ({ ...p, date: e.target.value }))} className="w-full p-2.5 bg-gray-50 border rounded-lg" required />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium">الوصف</label>
                        <input type="text" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} className="w-full p-2.5 bg-gray-50 border rounded-lg" required />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium">المبلغ</label>
                        <input type="number" step="any" value={formData.amount} onChange={e => setFormData(p => ({ ...p, amount: e.target.value }))} className="w-full p-2.5 bg-gray-50 border rounded-lg" required />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium">حساب المصروف</label>
                        <SearchableSelect options={expenseAccounts} value={formData.expenseAccountId} onChange={v => setFormData(p => ({ ...p, expenseAccountId: v }))} required />
                    </div>
                    <div className="flex justify-end pt-2">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg ml-2">{t('cancel')}</button>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg">{t('save_changes')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Modal for paying an Accrued Expense
const PayAccruedExpenseModal: React.FC<{ item: AccruedExpense, onClose: () => void }> = ({ item, onClose }) => {
    const { payAccruedExpense, accounts, formatCurrency, t } = useAppContext();
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [assetAccountId, setAssetAccountId] = useState('');

    const assetAccounts = useMemo(() =>
        accounts.filter(a => a.type === AccountType.ASSET && a.parentId)
            .map(a => ({ value: a.id, label: a.name })),
        [accounts]
    );

    useEffect(() => {
        if (assetAccounts.length > 0) {
            setAssetAccountId(assetAccounts[0].value);
        }
    }, [assetAccounts]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!assetAccountId) {
            alert('Please select a payment account.');
            return;
        }
        payAccruedExpense(item.id, { assetAccountId, date: paymentDate, payeeName: item.description });
        onClose();
    };

    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">دفع مصروف مستحق</h2>
                    <button onClick={onClose}><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <p><strong>الوصف:</strong> {item.description}</p>
                    <p><strong>المبلغ:</strong> <span className="font-bold text-red-500">{formatCurrency(item.amount)}</span></p>
                    <div>
                        <label className="block mb-2 text-sm font-medium">تاريخ الدفع</label>
                        <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="w-full p-2.5 bg-gray-50 border rounded-lg" required />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium">الدفع من حساب</label>
                        <SearchableSelect options={assetAccounts} value={assetAccountId} onChange={setAssetAccountId} required />
                    </div>
                     <div className="flex justify-end pt-2">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg ml-2">{t('cancel')}</button>
                        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><DollarSign size={18}/>{t('pay')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const AccruedExpenses: React.FC = () => {
    const { accruedExpenses, accounts, currentUser, formatCurrency, t } = useAppContext();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [payingItem, setPayingItem] = useState<AccruedExpense | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const canEdit = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.ACCOUNTANT;

    const processedItems = useMemo(() => {
        return accruedExpenses.map(item => ({
            ...item,
            expenseAccountName: accounts.find(a => a.id === item.expenseAccountId)?.name || 'N/A',
        })).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [accruedExpenses, accounts]);

    const filteredItems = useMemo(() => {
        if (!searchQuery) {
            return processedItems;
        }
        const lowercasedQuery = searchQuery.toLowerCase();
        return processedItems.filter(item =>
            item.description.toLowerCase().includes(lowercasedQuery) ||
            item.expenseAccountName.toLowerCase().includes(lowercasedQuery) ||
            item.amount.toString().includes(lowercasedQuery)
        );
    }, [processedItems, searchQuery]);

    const handleAddNew = () => {
        setIsFormOpen(true);
    };

    const handlePay = (item: AccruedExpense) => {
        setPayingItem(item);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('accrued_expenses')}</h2>
                <div className="relative w-full sm:w-64">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Search size={18} className="text-gray-500 dark:text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="بحث بالوصف, الحساب..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full pr-10 p-2.5 dark:bg-gray-700 dark:border-gray-600"
                    />
                </div>
                {canEdit && (
                    <button onClick={handleAddNew} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        <Plus size={18} className="ml-2" />
                        {t('add_accrued_expense')}
                    </button>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('accrual_date')}</th>
                            <th scope="col" className="px-6 py-3">الوصف</th>
                            <th scope="col" className="px-6 py-3">حساب المصروف</th>
                            <th scope="col" className="px-6 py-3">المبلغ</th>
                            <th scope="col" className="px-6 py-3">{t('status')}</th>
                            {canEdit && <th scope="col" className="px-6 py-3 no-print">إجراءات</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.map(item => (
                            <tr key={item.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                <td className="px-6 py-4">{item.date}</td>
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{item.description}</td>
                                <td className="px-6 py-4">{item.expenseAccountName}</td>
                                <td className="px-6 py-4 font-bold font-mono">{formatCurrency(item.amount)}</td>
                                <td className="px-6 py-4">
                                    {item.status === 'Accrued' ? (
                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">{t('accrued')}</span>
                                    ) : (
                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">{t('paid')}</span>
                                    )}
                                </td>
                                {canEdit && (
                                    <td className="px-6 py-4 flex space-x-2 space-x-reverse no-print">
                                        {item.status === 'Accrued' && (
                                            <button onClick={() => handlePay(item)} className="text-green-500 hover:text-green-700 p-1" title={t('pay')}>
                                                <DollarSign size={18} />
                                            </button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                         {filteredItems.length === 0 && (
                            <tr>
                                <td colSpan={canEdit ? 6: 5} className="text-center py-10 text-gray-500">
                                    لا توجد مصاريف مستحقة لعرضها.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isFormOpen && canEdit && <AccruedExpenseForm onClose={() => setIsFormOpen(false)} />}
            {payingItem && canEdit && <PayAccruedExpenseModal item={payingItem} onClose={() => setPayingItem(null)} />}
        </div>
    );
};

export default AccruedExpenses;
