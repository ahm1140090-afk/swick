
import React, { useState, useRef, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Transaction, JournalEntryLine } from '../types';
import { Plus, Edit, Trash2, Download, Printer, Search, Paperclip, FileSpreadsheet, Upload } from 'lucide-react';
import TransactionForm from './TransactionForm';
import SearchableSelect from './SearchableSelect';
import AttachmentViewerModal from './AttachmentViewerModal';
import CSVImportModal from './CSVImportModal';

const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    if (date.getTime() === today.getTime()) return 'اليوم';
    if (date.getTime() === yesterday.getTime()) return 'الأمس';
    return new Intl.DateTimeFormat('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(dateString));
};

const Transactions: React.FC = () => {
  const { transactions, deleteTransaction, accounts, getSelectableAccountList, customers, suppliers, employees, journalEntries, costCenters, formatCurrency, canEdit, t } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [viewingAttachments, setViewingAttachments] = useState<Transaction['attachments'] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const selectableAccounts = useMemo(() => [
    { value: '', label: 'كل الحسابات' },
    ...getSelectableAccountList()
  ], [getSelectableAccountList]);

  const getJELineAccountName = (line: JournalEntryLine): string => {
    if (line.entityId && line.entityType) {
        if (line.entityType === 'customer') return customers.find(c => c.id === line.entityId)?.name || 'عميل غير معروف';
        if (line.entityType === 'supplier') return suppliers.find(s => s.id === line.entityId)?.name || 'مورد غير معروف';
        if (line.entityType === 'employee') return employees.find(e => e.id === line.entityId)?.name || 'موظف غير معروف';
    }
    return accounts.find(a => a.id === line.accountId)?.name || 'غير معروف';
  };

  const filteredTransactions = useMemo(() => {
    let intermediate = transactions;
    if (selectedAccountId) {
        const [type, ...idParts] = selectedAccountId.split('-');
        const id = idParts.join('-');
        intermediate = intermediate.filter(t => {
            const je = journalEntries.find(je => je.id === t.journalEntryId);
            return je?.lines.some(line => {
                if (type === 'account') return line.accountId === id;
                return line.entityType === type && line.entityId === id;
            });
        });
    }
    if (searchQuery) {
        const lower = searchQuery.toLowerCase();
        intermediate = intermediate.filter(t => {
            const je = journalEntries.find(je => je.id === t.journalEntryId);
            const accountNames = je?.lines.map(l => getJELineAccountName(l).toLowerCase()).join(' ') || '';
            return t.description.toLowerCase().includes(lower) || t.date.includes(lower) || t.amount.toString().includes(lower) || accountNames.includes(lower);
        });
    }
    return intermediate;
  }, [transactions, searchQuery, selectedAccountId, journalEntries, accounts, customers, suppliers, employees]);

  const groupedTransactions = useMemo(() => {
    return filteredTransactions.reduce((acc, tx) => {
        if (!acc[tx.date]) acc[tx.date] = [];
        acc[tx.date].push(tx);
        return acc;
    }, {} as { [date: string]: Transaction[] });
  }, [filteredTransactions]);

  const sortedDates = useMemo(() => Object.keys(groupedTransactions).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()), [groupedTransactions]);

  const handleExportCSV = () => {
    const headers = { date: 'التاريخ', description: 'الوصف', debitAcc: 'مدين (حساب)', debitAmt: 'مدين (مبلغ)', creditAcc: 'دائن (حساب)', creditAmt: 'دائن (مبلغ)' };
    const data = filteredTransactions.map(t => {
        const je = journalEntries.find(j => j.id === t.journalEntryId);
        const dl = je?.lines.find(l => l.debit > 0);
        const cl = je?.lines.find(l => l.credit > 0);
        return {
            date: t.date,
            description: t.description,
            debitAcc: dl ? getJELineAccountName(dl) : '',
            debitAmt: dl?.debit || 0,
            creditAcc: cl ? getJELineAccountName(cl) : '',
            creditAmt: cl?.credit || 0
        };
    });
    window.handleExportCSV(data, headers, 'Transactions');
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex flex-col xl:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white shrink-0">المعاملات المالية</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full">
            <div className="w-full sm:w-64">
                <SearchableSelect options={selectableAccounts} value={selectedAccountId} onChange={setSelectedAccountId} placeholder="تصفية بالحساب" />
            </div>
            <div className="relative flex-1">
                <Search size={18} className="absolute right-3 top-3 text-gray-400" />
                <input type="text" placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pr-10 p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm" />
            </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 no-print shrink-0">
          <button onClick={() => setIsImportModalOpen(true)} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-bold transition-all shadow-sm">
            <Upload size={18} className="ml-2" /> استيراد
          </button>
          <button onClick={handleExportCSV} className="flex items-center bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-bold">
            <FileSpreadsheet size={18} className="ml-2" /> تصدير
          </button>
          <button onClick={() => window.handlePrint('printable-area')} className="flex items-center bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-bold">
            <Printer size={18} className="ml-2" /> طباعة
          </button>
          {canEdit && (
            <button onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-bold shadow-md">
              <Plus size={18} className="ml-2" /> إضافة معاملة
            </button>
          )}
        </div>
      </div>

      <div id="printable-area" ref={tableContainerRef} className="overflow-x-auto">
        <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                    <th scope="col" className="px-6 py-3">الوصف</th>
                    <th scope="col" className="px-6 py-3">الحساب</th>
                    <th scope="col" className="px-6 py-3">مدين</th>
                    <th scope="col" className="px-6 py-3">دائن</th>
                    {canEdit && <th scope="col" className="px-6 py-3 no-print">إجراءات</th>}
                </tr>
            </thead>
            {sortedDates.map(date => (
                <React.Fragment key={date}>
                    <thead className="sticky top-0 z-10"><tr className="bg-gray-100 dark:bg-gray-700/50"><th colSpan={canEdit ? 5 : 4} className="px-6 py-2 text-right text-base font-bold text-gray-700 dark:text-gray-300">{formatDateHeader(date)}</th></tr></thead>
                    {groupedTransactions[date].map(t => {
                        const je = journalEntries.find(e => e.id === t.journalEntryId);
                        if (!je) return null;
                        const dl = je.lines.find(l => l.debit > 0);
                        const cl = je.lines.find(l => l.credit > 0);
                        if (!dl || !cl) return null;
                        return (
                            <tbody key={t.id} className="group/transaction border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/40">
                                <tr>
                                    <td rowSpan={2} className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                        <div className="flex items-center gap-2">
                                            <span>{t.description}</span>
                                            {t.attachments && t.attachments.length > 0 && <button onClick={() => setViewingAttachments(t.attachments)} className="text-blue-500"><Paperclip size={14} /></button>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{getJELineAccountName(dl)}</td>
                                    <td className="px-6 py-4 font-mono font-bold text-blue-600">{formatCurrency(dl.debit)}</td>
                                    <td className="px-6 py-4">-</td>
                                    {canEdit && (
                                        <td rowSpan={2} className="px-6 py-4 no-print text-center">
                                            <div className="flex flex-col gap-2 items-center">
                                                <button onClick={() => { setEditingTransaction(t); setIsModalOpen(true); }} className="text-blue-500 hover:scale-110 transition-transform"><Edit size={18} /></button>
                                                <button onClick={() => deleteTransaction(t.id)} className="text-red-500 hover:scale-110 transition-transform"><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                                <tr><td className="px-6 py-4 pr-10">{getJELineAccountName(cl)}</td><td className="px-6 py-4">-</td><td className="px-6 py-4 font-mono font-bold text-red-600">{formatCurrency(cl.credit)}</td></tr>
                            </tbody>
                        );
                    })}
                </React.Fragment>
            ))}
        </table>
      </div>

      {isModalOpen && canEdit && <TransactionForm transaction={editingTransaction} onClose={() => setIsModalOpen(false)} />}
      {isImportModalOpen && <CSVImportModal type="transactions" onClose={() => setIsImportModalOpen(false)} />}
      {viewingAttachments && <AttachmentViewerModal attachments={viewingAttachments} onClose={() => setViewingAttachments(null)} />}
    </div>
  );
};

export default Transactions;
