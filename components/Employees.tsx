
import React, { useState, useRef, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Employee } from '../types';
import { Plus, Edit, Trash2, Briefcase, Download, Printer, Search, FileSpreadsheet, Upload } from 'lucide-react';
import EmployeeForm from './EmployeeForm';
import CSVImportModal from './CSVImportModal';

const Employees: React.FC = () => {
  const { employees, deleteEmployee, accounts, formatCurrency, t, canEdit } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const tableContainerRef = useRef<HTMLDivElement>(null);
  
  const filteredEmployees = useMemo(() => {
    if (!searchQuery) {
        return employees;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return employees.filter(e => 
        e.employeeNumber.toLowerCase().includes(lowercasedQuery) ||
        e.name.toLowerCase().includes(lowercasedQuery) ||
        e.position.toLowerCase().includes(lowercasedQuery)
    );
  }, [employees, searchQuery]);


  const handleExportPDF = async () => {
    try {
      await window.ensurePdfLibsLoaded();
    } catch (error) {
      alert("فشل تحميل مكتبات التصدير.");
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
    titleEl.innerText = 'قائمة الموظفين';
    titleEl.style.textAlign = 'center';
    titleEl.style.fontSize = '24px';
    titleEl.style.marginBottom = '20px';
    pdfContainer.appendChild(titleEl);

    const clonedTable = table.cloneNode(true) as HTMLTableElement;
    clonedTable.querySelectorAll('th:last-child, td:last-child').forEach(el => (el as HTMLElement).style.display = 'none');
    pdfContainer.appendChild(clonedTable);
    document.body.appendChild(pdfContainer);

    window.html2canvas(pdfContainer, { scale: 2, useCORS: true }).then((canvas: HTMLCanvasElement) => {
        document.body.removeChild(pdfContainer);
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'l', unit: 'pt', format: 'a4' });
        pdf.addImage(imgData, 'PNG', 20, 20, pdf.internal.pageSize.getWidth() - 40, (pdf.internal.pageSize.getWidth() - 40) / (canvas.width / canvas.height));
        pdf.save(`Employees_${new Date().toISOString().split('T')[0]}.pdf`);
    });
  };

  const handleExportCSV = () => {
    const headers = { employeeNumber: 'رقم الموظف', name: 'الاسم', position: 'المنصب', baseSalary: 'الراتب الأساسي', phone: 'الهاتف' };
    window.handleExportCSV(filteredEmployees, headers, 'Employees');
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex flex-col xl:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">قائمة الموظفين</h2>
        <div className="relative w-full xl:w-72">
            <Search size={18} className="absolute right-3 top-3 text-gray-400" />
            <input type="text" placeholder="بحث بالرقم, الاسم..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pr-10 p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm shadow-sm" />
        </div>
        <div className="flex flex-wrap items-center gap-2 no-print shrink-0">
          <button onClick={() => setIsImportModalOpen(true)} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-bold shadow-sm">
            <Upload size={18} className="ml-2" /> استيراد
          </button>
          <button onClick={handleExportCSV} className="flex items-center bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-bold">
            <FileSpreadsheet size={18} className="ml-2" /> تصدير
          </button>
          <button onClick={() => window.handlePrint('printable-area')} className="flex items-center bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-bold">
            <Printer size={18} className="ml-2" /> طباعة
          </button>
          {canEdit && (
            <button onClick={() => { setEditingEmployee(null); setIsModalOpen(true); }} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-bold shadow-md">
              <Plus size={18} className="ml-2" /> إضافة موظف
            </button>
          )}
        </div>
      </div>

      <div id="printable-area" ref={tableContainerRef} className="overflow-x-auto border dark:border-gray-700 rounded-lg">
        <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">رقم الموظف</th>
              <th scope="col" className="px-6 py-3">الاسم</th>
              <th scope="col" className="px-6 py-3">المنصب</th>
              <th scope="col" className="px-6 py-3">{t('baseSalary')}</th>
              <th scope="col" className="px-6 py-3">تاريخ التعيين</th>
              {canEdit && <th scope="col" className="px-6 py-3 no-print">إجراءات</th>}
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map(e => (
              <tr key={e.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50">
                <td className="px-6 py-4 font-mono">{e.employeeNumber}</td>
                <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{e.name}</td>
                <td className="px-6 py-4">{e.position}</td>
                <td className="px-6 py-4 font-bold">{formatCurrency(e.baseSalary)}</td>
                <td className="px-6 py-4">{e.hireDate || '—'}</td>
                {canEdit && (
                  <td className="px-6 py-4 flex gap-2 no-print">
                    <button onClick={() => { setEditingEmployee(e); setIsModalOpen(true); }} className="text-blue-500"><Edit size={18} /></button>
                    <button onClick={() => deleteEmployee(e.id)} className="text-red-500"><Trash2 size={18} /></button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && canEdit && <EmployeeForm employee={editingEmployee} onClose={() => setIsModalOpen(false)} />}
      {isImportModalOpen && <CSVImportModal type="employees" onClose={() => setIsImportModalOpen(false)} />}
    </div>
  );
};

export default Employees;
