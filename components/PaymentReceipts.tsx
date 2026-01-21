
import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { PaymentReceipt } from '../types';
import { Plus, Edit, Trash2, Eye, Download, Printer, Search, Upload, FileSpreadsheet } from 'lucide-react';
import PaymentReceiptForm from './PaymentReceiptForm';
import PaymentReceiptDetail from './PaymentReceiptDetail';
import CSVImportModal from './CSVImportModal';

const PaymentReceipts: React.FC = () => {
  const { paymentReceipts, customers, suppliers, employees, accounts, deletePaymentReceipt, formatCurrency, canEdit } = useAppContext();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<PaymentReceipt | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<PaymentReceipt | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const processedReceipts = useMemo(() => {
    return paymentReceipts.map(r => {
      // If we already have the name stored, use it. Otherwise, look it up (fallback for old data)
      let name = r.partyName;
      if (!name) {
          if (r.partyType === 'supplier') name = suppliers.find(s => s.id === r.customerId)?.name || 'مورد غير معروف';
          else if (r.partyType === 'employee') name = employees.find(e => e.id === r.customerId)?.name || 'موظف غير معروف';
          else name = customers.find(c => c.id === r.customerId)?.name || 'طرف غير معروف';
      }
      return {
        ...r,
        displayName: name,
        accountName: accounts.find(a => a.id === r.assetAccountId)?.name || 'غير معروف',
      };
    });
  }, [paymentReceipts, customers, suppliers, employees, accounts]);

  const filteredReceipts = useMemo(() => {
    if (!searchQuery) return processedReceipts;
    const lower = searchQuery.toLowerCase();
    return processedReceipts.filter(r => 
        r.receiptNumber.toLowerCase().includes(lower) || 
        r.displayName.toLowerCase().includes(lower) || 
        r.amount.toString().includes(lower) ||
        r.description.toLowerCase().includes(lower)
    );
  }, [processedReceipts, searchQuery]);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">سندات القبض</h2>
        <div className="relative w-full sm:w-64">
            <Search size={18} className="absolute right-3 top-3 text-gray-400" />
            <input type="text" placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pr-10 p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm" />
        </div>
        <div className="flex flex-wrap items-center gap-2 no-print shrink-0">
          <button onClick={() => setIsImportModalOpen(true)} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-bold shadow-sm">
            <Upload size={18} className="ml-2" /> استيراد
          </button>
          <button onClick={() => window.handlePrint('printable-area')} className="flex items-center bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-bold">
            <Printer size={18} className="ml-2" /> طباعة
          </button>
          {canEdit && (
            <button onClick={() => { setEditingReceipt(null); setIsFormModalOpen(true); }} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-bold shadow-md">
              <Plus size={18} className="ml-2" /> إضافة سند
            </button>
          )}
        </div>
      </div>

      <div id="printable-area" ref={tableContainerRef} className="overflow-x-auto border dark:border-gray-700 rounded-lg">
        <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th className="px-6 py-3">رقم السند</th>
              <th className="px-6 py-3">التاريخ</th>
              <th className="px-6 py-3">الطرف المقابل</th>
              <th className="px-6 py-3">المبلغ</th>
              <th className="px-6 py-3 no-print">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredReceipts.map(r => (
              <tr key={r.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50">
                <td className="px-6 py-4 font-mono">{r.receiptNumber}</td>
                <td className="px-6 py-4">{r.date}</td>
                <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{r.displayName}</td>
                <td className="px-6 py-4 font-bold text-green-500">{formatCurrency(r.amount)}</td>
                <td className="px-6 py-4 flex space-x-2 space-x-reverse no-print">
                  <button onClick={() => setViewingReceipt(r)} className="text-gray-500 hover:text-gray-700 p-1"><Eye size={18} /></button>
                  {canEdit && (
                    <>
                      <button onClick={() => { setEditingReceipt(r); setIsFormModalOpen(true); }} className="text-blue-500 hover:text-blue-700 p-1"><Edit size={18} /></button>
                      <button onClick={() => deletePaymentReceipt(r.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={18} /></button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isFormModalOpen && canEdit && <PaymentReceiptForm receipt={editingReceipt} onClose={() => setIsFormModalOpen(false)} />}
      {isImportModalOpen && <CSVImportModal type="receipts" onClose={() => setIsImportModalOpen(false)} />}
      {viewingReceipt && <PaymentReceiptDetail receipt={viewingReceipt} onClose={() => setViewingReceipt(null)} />}
    </div>
  );
};

export default PaymentReceipts;
