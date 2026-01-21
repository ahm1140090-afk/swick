

import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { RecurringTransaction, UserRole } from '../types';
import { Plus, Edit, Trash2, Search, Printer, Download, FileSpreadsheet } from 'lucide-react';
import RecurringTransactionForm from './RecurringTransactionForm';

const RecurringTransactions: React.FC = () => {
    const { recurringTransactions, deleteRecurringTransaction, currentUser, formatCurrency, t } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<RecurringTransaction | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const tableContainerRef = useRef<HTMLDivElement>(null);

    const canEdit = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.ACCOUNTANT;

    const filteredTransactions = useMemo(() => {
        if (!searchQuery) {
            return recurringTransactions;
        }
        const lowercasedQuery = searchQuery.toLowerCase();
        return recurringTransactions.filter(rt =>
            rt.name.toLowerCase().includes(lowercasedQuery) ||
            rt.transactionDetails.description.toLowerCase().includes(lowercasedQuery) ||
            rt.transactionDetails.amount.toString().includes(lowercasedQuery)
        );
    }, [recurringTransactions, searchQuery]);

    const getStatus = (rt: RecurringTransaction) => {
        const today = new Date();
        today.setHours(0,0,0,0);
        if (rt.endDate && new Date(rt.endDate) < today) {
            return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300">{t('ended')}</span>;
        }
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">{t('active')}</span>;
    };

    const handleAddNew = () => {
        setEditingTransaction(null);
        setIsModalOpen(true);
    };

    const handleEdit = (transaction: RecurringTransaction) => {
        setEditingTransaction(transaction);
        setIsModalOpen(true);
    };

    const handleExportPDF = async () => {
        try {
            await window.ensurePdfLibsLoaded();
        } catch (error) {
            alert("فشل تحميل مكتبات التصدير. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.");
            return;
        }

        const tableContainer = tableContainerRef.current;
        if (!tableContainer) return;

        const table = tableContainer.querySelector('table');
        if (!table) return;

        const isDarkMode = document.documentElement.classList.contains('dark');
        const pdfContainer = document.createElement('div');
        pdfContainer.style.position = 'absolute';
        pdfContainer.style.left = '-9999px';
        pdfContainer.style.padding = '20px';
        pdfContainer.style.fontFamily = "'Cairo', sans-serif";
        pdfContainer.style.direction = 'rtl';
        pdfContainer.style.background = isDarkMode ? '#1f2937' : '#ffffff';
        pdfContainer.style.color = isDarkMode ? '#f3f4f6' : '#111827';
        
        const titleEl = document.createElement('h1');
        titleEl.innerText = t('recurring_transactions');
        titleEl.style.textAlign = 'center';
        titleEl.style.fontSize = '24px';
        titleEl.style.marginBottom = '10px';
        pdfContainer.appendChild(titleEl);
        
        const dateEl = document.createElement('p');
        dateEl.innerText = `تاريخ التصدير: ${new Date().toLocaleDateString('ar-EG')}`;
        dateEl.style.textAlign = 'center';
        dateEl.style.fontSize = '12px';
        dateEl.style.marginBottom = '20px';
        pdfContainer.appendChild(dateEl);

        const clonedTable = table.cloneNode(true) as HTMLTableElement;
        clonedTable.querySelectorAll('th:last-child, td:last-child').forEach(el => (el as HTMLElement).style.display = 'none');
        pdfContainer.appendChild(clonedTable);
        
        document.body.appendChild(pdfContainer);

        window.html2canvas(pdfContainer, { scale: 2, useCORS: true })
        .then((canvas: HTMLCanvasElement) => {
            document.body.removeChild(pdfContainer);
            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ orientation: 'l', unit: 'pt', format: 'a4' });
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const ratio = canvas.width / canvas.height;
            let imgWidth = pdfWidth - 40;
            let imgHeight = imgWidth / ratio;
            if (imgHeight > pdfHeight - 40) {
                imgHeight = pdfHeight - 40;
                imgWidth = imgHeight * ratio;
            }
            const x = (pdfWidth - imgWidth) / 2;
            const y = 20; // Position at the top with a margin

            pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
            pdf.save(`Recurring_Transactions_${new Date().toISOString().split('T')[0]}.pdf`);
        });
    };

    const handleExportCSV = () => {
        const getStatusText = (rt: RecurringTransaction) => {
            const today = new Date();
            today.setHours(0,0,0,0);
            if (rt.endDate && new Date(rt.endDate) < today) {
                return t('ended');
            }
            return t('active');
        };

        const headers = {
            name: 'الاسم',
            description: 'الوصف',
            amount: 'المبلغ',
            type: 'النوع',
            frequency: t('frequency'),
            nextDueDate: t('next_due_date'),
            status: t('status'),
        };

        const dataToExport = filteredTransactions.map(rt => {
            const typeText = rt.transactionDetails.type === 'income' ? 'دخل' : rt.transactionDetails.type === 'expense' ? 'مصروف' : 'تحويل';
            return {
                name: rt.name,
                description: rt.transactionDetails.description,
                amount: rt.transactionDetails.amount,
                type: typeText,
                frequency: t(rt.frequency),
                nextDueDate: rt.nextDueDate,
                status: getStatusText(rt),
            };
        });

        window.handleExportCSV(dataToExport, headers, 'Recurring_Transactions');
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('recurring_transactions')}</h2>
                <div className="relative w-full sm:w-64">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Search size={18} className="text-gray-500 dark:text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="بحث بالاسم, الوصف, المبلغ..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pr-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    />
                </div>
                <div className="flex items-center gap-2 no-print self-end sm:self-center">
                    <button onClick={() => window.print()} className="flex items-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors">
                        <Printer size={18} className="ml-2" /> طباعة
                    </button>
                    <button onClick={handleExportPDF} className="flex items-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors">
                        <Download size={18} className="ml-2" /> تصدير PDF
                    </button>
                    <button onClick={handleExportCSV} className="flex items-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors">
                        <FileSpreadsheet size={18} className="ml-2" /> تصدير Excel
                    </button>
                    {canEdit && (
                        <button
                            onClick={handleAddNew}
                            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus size={18} className="ml-2" />
                            {t('add_recurring_transaction')}
                        </button>
                    )}
                </div>
            </div>

            <div ref={tableContainerRef} className="overflow-x-auto">
                <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">الاسم</th>
                            <th scope="col" className="px-6 py-3">المبلغ</th>
                            <th scope="col" className="px-6 py-3">{t('frequency')}</th>
                            <th scope="col" className="px-6 py-3">{t('next_due_date')}</th>
                            <th scope="col" className="px-6 py-3">{t('status')}</th>
                            {canEdit && <th scope="col" className="px-6 py-3 no-print">إجراءات</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTransactions.length > 0 ? filteredTransactions.map(rt => (
                            <tr key={rt.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                    <p>{rt.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{rt.transactionDetails.description}</p>
                                </td>
                                <td className={`px-6 py-4 font-bold ${rt.transactionDetails.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                    {formatCurrency(rt.transactionDetails.amount)}
                                </td>
                                <td className="px-6 py-4">{t(rt.frequency)}</td>
                                <td className="px-6 py-4">{rt.nextDueDate}</td>
                                <td className="px-6 py-4">{getStatus(rt)}</td>
                                {canEdit && (
                                    <td className="px-6 py-4 flex space-x-2 space-x-reverse no-print">
                                        <button onClick={() => handleEdit(rt)} className="text-blue-500 hover:text-blue-700"><Edit size={18} /></button>
                                        <button onClick={() => deleteRecurringTransaction(rt.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                                    </td>
                                )}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={canEdit ? 6 : 5} className="text-center py-10 text-gray-500 dark:text-gray-400">
                                    <p>{searchQuery ? 'لا توجد معاملات متكررة تطابق بحثك.' : 'لا توجد معاملات متكررة لعرضها.'}</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && canEdit && (
                <RecurringTransactionForm
                    transaction={editingTransaction}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
};

export default RecurringTransactions;
