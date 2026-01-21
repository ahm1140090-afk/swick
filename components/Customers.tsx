
import React, { useState, useRef, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Customer } from '../types';
import { Plus, Edit, Trash2, Download, Printer, Search, FileSpreadsheet, Upload } from 'lucide-react';
import CustomerForm from './CustomerForm';
import CSVImportModal from './CSVImportModal';

const Customers: React.FC = () => {
  const { customers, deleteCustomer, invoices, paymentReceipts, salesReturns, formatCurrency, canEdit, t } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const customersWithBalance = useMemo(() => {
    return customers.map(customer => {
      const customerInvoices = invoices.filter(inv => inv.customerId === customer.id && !inv.isCash);
      const customerPayments = paymentReceipts.filter(p => p.customerId === customer.id);
      const customerReturns = salesReturns.filter(sr => sr.customerId === customer.id);
      const totalInvoiced = customerInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const totalPaid = customerPayments.reduce((sum, p) => sum + p.amount, 0);
      const totalReturned = customerReturns.reduce((sum, sr) => sum + sr.amount, 0);
      const balance = totalInvoiced - totalPaid - totalReturned;
      return { ...customer, balance };
    });
  }, [customers, invoices, paymentReceipts, salesReturns]);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customersWithBalance;
    const lower = searchQuery.toLowerCase();
    return customersWithBalance.filter(c => 
      c.name.toLowerCase().includes(lower) || c.phone.includes(lower) || (c.address && c.address.toLowerCase().includes(lower))
    );
  }, [customersWithBalance, searchQuery]);

  const handleExportCSV = () => {
    const headers = { customerNumber: 'رقم العميل', name: 'الاسم', phone: 'الهاتف', email: 'البريد', balance: 'الرصيد المستحق', address: 'العنوان' };
    window.handleExportCSV(filteredCustomers, headers, 'Customers');
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">قائمة العملاء</h2>
        <div className="relative w-full lg:w-72">
            <Search size={18} className="absolute right-3 top-3 text-gray-400" />
            <input type="text" placeholder="بحث بالاسم أو الهاتف..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pr-10 p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm shadow-sm" />
        </div>
        <div className="flex flex-wrap items-center gap-2 no-print shrink-0">
          <button onClick={() => setIsImportModalOpen(true)} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-bold shadow-sm transition-all">
            <Upload size={18} className="ml-2" /> استيراد
          </button>
          <button onClick={handleExportCSV} className="flex items-center bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-bold">
            <FileSpreadsheet size={18} className="ml-2" /> تصدير
          </button>
          <button onClick={() => window.handlePrint('printable-area')} className="flex items-center bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-bold">
            <Printer size={18} className="ml-2" /> طباعة
          </button>
          {canEdit && (
            <button onClick={() => { setEditingCustomer(null); setIsModalOpen(true); }} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-bold shadow-md">
              <Plus size={18} className="ml-2" /> إضافة عميل
            </button>
          )}
        </div>
      </div>

      <div id="printable-area" ref={tableContainerRef} className="overflow-x-auto border dark:border-gray-700 rounded-lg">
        <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">رقم العميل</th>
              <th scope="col" className="px-6 py-3">الاسم</th>
              <th scope="col" className="px-6 py-3">الهاتف</th>
              <th scope="col" className="px-6 py-3">الرصيد</th>
              <th scope="col" className="px-6 py-3">العنوان</th>
              {canEdit && <th scope="col" className="px-6 py-3 no-print">إجراءات</th>}
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map(c => (
              <tr key={c.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50">
                <td className="px-6 py-4 font-mono">{c.customerNumber || '—'}</td>
                <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{c.name}</td>
                <td className="px-6 py-4">{c.phone}</td>
                <td className={`px-6 py-4 font-bold font-mono ${c.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>{formatCurrency(c.balance)}</td>
                <td className="px-6 py-4 truncate max-w-xs">{c.address || '—'}</td>
                {canEdit && (
                  <td className="px-6 py-4 flex gap-2 no-print">
                    <button onClick={() => { setEditingCustomer(c); setIsModalOpen(true); }} className="text-blue-500"><Edit size={18} /></button>
                    <button onClick={() => deleteCustomer(c.id)} className="text-red-500"><Trash2 size={18} /></button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && canEdit && <CustomerForm customer={editingCustomer} onClose={() => setIsModalOpen(false)} />}
      {isImportModalOpen && <CSVImportModal type="customers" onClose={() => setIsImportModalOpen(false)} />}
    </div>
  );
};

export default Customers;
