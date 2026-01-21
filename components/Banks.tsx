

import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Account, AccountType } from '../types';
import { Plus, Edit, Trash2, Landmark, Download, Printer, Search, FileSpreadsheet } from 'lucide-react';
import BankForm from './BankForm';

const Banks: React.FC = () => {
  const { accounts, deleteAccount, formatCurrency, canEdit } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const bankAccounts = useMemo(() => 
    accounts.filter(acc => acc.type === AccountType.ASSET && acc.parentId),
    [accounts]
  );
  
  const filteredBankAccounts = useMemo(() => {
    if (!searchQuery) {
        return bankAccounts;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return bankAccounts.filter(acc => 
        acc.name.toLowerCase().includes(lowercasedQuery) ||
        (acc.accountNumber && acc.accountNumber.includes(lowercasedQuery)) ||
        (acc.iban && acc.iban.toLowerCase().includes(lowercasedQuery))
    );
  }, [bankAccounts, searchQuery]);

  const handleExportPDF = async () => {
    try {
      await window.ensurePdfLibsLoaded();
    } catch (error) {
      alert("فشل تحميل مكتبات التصدير. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.");
      console.error("PDF lib loading error:", error);
      return;
    }

    const tableContainer = tableContainerRef.current;
    if (!tableContainer) {
        alert("لا يمكن العثور على العنصر المراد تصديره.");
        return;
    }

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
    titleEl.innerText = 'الحسابات البنكية والنقدية';
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
    const actionHeader = clonedTable.querySelector('th:last-child');
    const actionCells = clonedTable.querySelectorAll('td:last-child');
    if (actionHeader) (actionHeader as HTMLElement).style.display = 'none';
    actionCells.forEach(td => (td as HTMLElement).style.display = 'none');
    pdfContainer.appendChild(clonedTable);
    
    document.body.appendChild(pdfContainer);

    window.html2canvas(pdfContainer, {
        scale: 2,
        useCORS: true,
    }).then((canvas: HTMLCanvasElement) => {
        document.body.removeChild(pdfContainer);

        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
        
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
        pdf.save(`Bank_Accounts_${new Date().toISOString().split('T')[0]}.pdf`);
    });
  };

  const handleExportCSV = () => {
    const headers = {
        name: 'اسم الحساب',
        accountNumber: 'رقم الحساب',
        iban: 'الآيبان',
        balance: 'الرصيد الحالي',
    };
    
    const dataToExport = filteredBankAccounts.map(acc => ({
        name: acc.name,
        accountNumber: acc.accountNumber || '',
        iban: acc.iban || '',
        balance: acc.balance,
    }));

    window.handleExportCSV(dataToExport, headers, 'Bank_Accounts');
};

  const handleAddNew = () => {
    setEditingAccount(null);
    setIsModalOpen(true);
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setIsModalOpen(true);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">الحسابات البنكية والنقدية</h2>
        <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 flex items-center ltr:pl-3 rtl:pr-3 pointer-events-none">
                <Search size={18} className="text-gray-500 dark:text-gray-400" />
            </div>
            <input
                type="text"
                placeholder="بحث بالاسم, رقم الحساب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ltr:pl-10 rtl:pr-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            />
        </div>
        <div className="flex items-center gap-2 no-print self-end sm:self-center">
          <button
            onClick={() => window.handlePrint('printable-area')}
            className="flex items-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors"
          >
            <Printer size={18} className="ltr:mr-2 rtl:ml-2" />
            طباعة
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors"
          >
            <Download size={18} className="ltr:mr-2 rtl:ml-2" />
            تصدير PDF
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors"
          >
            <FileSpreadsheet size={18} className="ltr:mr-2 rtl:ml-2" />
            تصدير Excel
          </button>
          {canEdit && (
            <button
              onClick={handleAddNew}
              className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} className="ltr:mr-2 rtl:ml-2" />
              إضافة حساب
            </button>
          )}
        </div>
      </div>

      <div id="printable-area" ref={tableContainerRef} className="overflow-x-auto">
        <table className="w-full text-sm ltr:text-left rtl:text-right text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">اسم الحساب</th>
              <th scope="col" className="px-6 py-3">رقم الحساب</th>
              <th scope="col" className="px-6 py-3">الآيبان</th>
              <th scope="col" className="px-6 py-3">الرصيد الحالي</th>
              {canEdit && <th scope="col" className="px-6 py-3 no-print">إجراءات</th>}
            </tr>
          </thead>
          <tbody>
            {filteredBankAccounts.length > 0 ? (
                filteredBankAccounts.map(acc => (
                  <tr key={acc.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{acc.name}</td>
                    <td className="px-6 py-4 font-mono">{acc.accountNumber || '—'}</td>
                    <td className="px-6 py-4 font-mono">{acc.iban || '—'}</td>
                    <td className="px-6 py-4 font-bold font-mono">
                        {formatCurrency(acc.balance)}
                    </td>
                    {canEdit && (
                      <td className="px-6 py-4 flex ltr:space-x-2 rtl:space-x-reverse no-print">
                        <button onClick={() => handleEdit(acc)} className="text-blue-500 hover:text-blue-700 p-1"><Edit size={18} /></button>
                        {/* Optional: Add logic to prevent deletion if transactions exist */}
                        <button onClick={() => deleteAccount(acc.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={18} /></button>
                      </td>
                    )}
                  </tr>
                ))
            ) : (
                <tr>
                    <td colSpan={canEdit ? 5 : 4} className="text-center py-10">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                            <Landmark size={48} className="mb-2" />
                            <h3 className="text-lg font-semibold">{searchQuery ? 'لا توجد حسابات تطابق بحثك.' : 'لا توجد حسابات بنكية أو نقدية.'}</h3>
                            <p className="text-sm">{searchQuery ? 'جرب البحث بكلمات أخرى.' : 'ابدأ بإضافة أول حساب بنكي أو نقدي.'}</p>
                        </div>
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && canEdit && (
        <BankForm
          account={editingAccount}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Banks;