
import React, { useState, useRef, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { PaymentVoucher } from '../types';
import { Plus, Edit, Trash2, Eye, Download, Printer, Search, Upload, FileSpreadsheet } from 'lucide-react';
import PaymentVoucherForm from './PaymentVoucherForm';
import PaymentVoucherDetail from './PaymentVoucherDetail';
import CSVImportModal from './CSVImportModal';

const PaymentVouchers: React.FC = () => {
  const { paymentVouchers, accounts, deletePaymentVoucher, formatCurrency, canEdit } = useAppContext();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<PaymentVoucher | null>(null);
  const [viewingVoucher, setViewingVoucher] = useState<PaymentVoucher | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const filteredVouchers = useMemo(() => {
    const vouchersWithNames = paymentVouchers.map(v => ({
      ...v,
      accountName: accounts.find(a => a.id === v.assetAccountId)?.name || 'غير معروف',
    }));
    if (!searchQuery) return vouchersWithNames;
    const lower = searchQuery.toLowerCase();
    return vouchersWithNames.filter(v => v.voucherNumber.toLowerCase().includes(lower) || v.payeeName.toLowerCase().includes(lower) || v.amount.toString().includes(lower));
  }, [paymentVouchers, searchQuery, accounts]);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">سندات الصرف</h2>
        <div className="relative w-full sm:w-64">
            <Search size={18} className="absolute right-3 top-3 text-gray-400" />
            <input type="text" placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pr-10 p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm" />
        </div>
        <div className="flex flex-wrap items-center gap-2 no-print shrink-0">
          <button onClick={() => setIsImportModalOpen(true)} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-bold shadow-sm transition-all">
            <Upload size={18} className="ml-2" /> استيراد
          </button>
          <button onClick={() => window.handlePrint('printable-area')} className="flex items-center bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-bold">
            <Printer size={18} className="ml-2" /> طباعة
          </button>
          {canEdit && (
            <button onClick={() => { setEditingVoucher(null); setIsFormModalOpen(true); }} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-bold shadow-md">
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
              <th className="px-6 py-3">المستفيد</th>
              <th className="px-6 py-3">المبلغ</th>
              <th className="px-6 py-3 no-print">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredVouchers.map(v => (
              <tr key={v.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50">
                <td className="px-6 py-4 font-mono">{v.voucherNumber}</td>
                <td className="px-6 py-4">{v.date}</td>
                <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{v.payeeName}</td>
                <td className="px-6 py-4 font-bold text-red-500">{formatCurrency(v.amount)}</td>
                <td className="px-6 py-4 flex space-x-2 space-x-reverse no-print">
                  <button onClick={() => setViewingVoucher(v)} className="text-gray-500 hover:text-gray-700 p-1"><Eye size={18} /></button>
                  {canEdit && (
                    <>
                      <button onClick={() => { setEditingVoucher(v); setIsFormModalOpen(true); }} className="text-blue-500 hover:text-blue-700 p-1"><Edit size={18} /></button>
                      <button onClick={() => deletePaymentVoucher(v.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={18} /></button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isFormModalOpen && canEdit && <PaymentVoucherForm voucher={editingVoucher} onClose={() => setIsFormModalOpen(false)} />}
      {isImportModalOpen && <CSVImportModal type="vouchers" onClose={() => setIsImportModalOpen(false)} />}
      {viewingVoucher && <PaymentVoucherDetail voucher={viewingVoucher} onClose={() => setViewingVoucher(null)} />}
    </div>
  );
};

export default PaymentVouchers;
