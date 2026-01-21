
import React, { useState, useRef, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { JournalEntry, JournalEntryLine } from '../types';
import { Plus, Edit, Trash2, Download, Printer, Search, FileSpreadsheet, Eye } from 'lucide-react';
import JournalEntryForm from './JournalEntryForm';
import JournalEntryDetail from './JournalEntryDetail';

const JournalEntries: React.FC = () => {
  const { journalEntries, deleteJournalEntry, formatCurrency, accounts, customers, suppliers, employees, canEdit } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const getTotalAmount = (entry: JournalEntry) => {
    return entry.lines.reduce((sum, line) => sum + line.debit, 0);
  };
  
  const filteredEntries = useMemo(() => {
    if (!searchQuery) {
        return journalEntries;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return journalEntries.filter(entry => 
        entry.entryNumber.toLowerCase().includes(lowercasedQuery) ||
        entry.date.includes(lowercasedQuery) ||
        entry.description.toLowerCase().includes(lowercasedQuery) ||
        getTotalAmount(entry).toString().includes(lowercasedQuery)
    );
  }, [journalEntries, searchQuery]);

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
    titleEl.innerText = 'قيود اليومية';
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
        const y = 20;

        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        pdf.save(`JournalEntries_${new Date().toISOString().split('T')[0]}.pdf`);
      });
  };

  const handleExportCSV = () => {
    const headers = {
        entryNumber: 'رقم القيد',
        date: 'التاريخ',
        entryDescription: 'وصف القيد',
        accountName: 'اسم الحساب',
        lineDescription: 'وصف السطر',
        debit: 'مدين',
        credit: 'دائن',
    };

    const getJELineAccountName = (line: JournalEntryLine): string => {
        if (line.entityId && line.entityType) {
            if (line.entityType === 'customer') {
                return customers.find(c => c.id === line.entityId)?.name || 'عميل غير معروف';
            }
            if (line.entityType === 'supplier') {
                return suppliers.find(s => s.id === line.entityId)?.name || 'مورد غير معروف';
            }
            if (line.entityType === 'employee') {
                return employees.find(e => e.id === line.entityId)?.name || 'موظف غير معروف';
            }
        }
        return accounts.find(a => a.id === line.accountId)?.name || 'غير معروف';
    };

    const dataToExport = filteredEntries.flatMap(entry =>
        entry.lines.map(line => ({
            entryNumber: entry.entryNumber,
            date: entry.date,
            entryDescription: entry.description,
            accountName: getJELineAccountName(line),
            lineDescription: line.description,
            debit: line.debit,
            credit: line.credit,
        }))
    );

    window.handleExportCSV(dataToExport, headers, 'JournalEntries_Detailed');
};

  const handleAddNew = () => {
    setEditingEntry(null);
    setIsModalOpen(true);
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">قيود اليومية</h2>
        <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Search size={18} className="text-gray-500 dark:text-gray-400" />
            </div>
            <input
                type="text"
                placeholder="بحث بالرقم, التاريخ, الوصف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pr-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            />
        </div>
        <div className="flex items-center gap-2 no-print self-end sm:self-center">
          <button
            onClick={() => window.handlePrint('printable-area')}
            className="flex items-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors"
          >
            <Printer size={18} className="ml-2" />
            طباعة
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors"
          >
            <Download size={18} className="ml-2" />
            تصدير PDF
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors"
          >
            <FileSpreadsheet size={18} className="ml-2" />
            تصدير Excel
          </button>
          {canEdit && (
            <button
              onClick={handleAddNew}
              className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} className="ml-2" />
              إضافة قيد
            </button>
          )}
        </div>
      </div>

      <div id="printable-area" ref={tableContainerRef} className="overflow-x-auto">
        <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">رقم القيد</th>
              <th scope="col" className="px-6 py-3">التاريخ</th>
              <th scope="col" className="px-6 py-3">الوصف</th>
              <th scope="col" className="px-6 py-3">المبلغ</th>
              <th scope="col" className="px-6 py-3 no-print">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.length > 0 ? filteredEntries.map(entry => (
                <tr key={entry.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                    <td className="px-6 py-4 font-mono">{entry.entryNumber}</td>
                    <td className="px-6 py-4">{entry.date}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{entry.description}</td>
                    <td className="px-6 py-4 font-bold">
                        {formatCurrency(getTotalAmount(entry))}
                    </td>
                    <td className="px-6 py-4 flex space-x-2 space-x-reverse no-print">
                        <button onClick={() => setViewingEntry(entry)} className="text-gray-500 hover:text-gray-700 p-1" title="معاينة وطباعة"><Eye size={18} /></button>
                        {canEdit && (
                            <>
                                <button onClick={() => handleEdit(entry)} className="text-blue-500 hover:text-blue-700 p-1"><Edit size={18} /></button>
                                <button onClick={() => deleteJournalEntry(entry.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={18} /></button>
                            </>
                        )}
                    </td>
                </tr>
            )) : (
              <tr>
                <td colSpan={canEdit ? 5 : 4} className="text-center py-10 text-gray-500 dark:text-gray-400">
                  <p>{searchQuery ? 'لا توجد قيود تطابق بحثك.' : 'لا توجد قيود يومية لعرضها.'}</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && canEdit && (
        <JournalEntryForm
          entry={editingEntry}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      
      {viewingEntry && (
        <JournalEntryDetail 
          entry={viewingEntry} 
          onClose={() => setViewingEntry(null)} 
        />
      )}
    </div>
  );
};

export default JournalEntries;
