
import React, { useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { JournalEntry, JournalEntryLine } from '../types';
import { X, Download, Printer, BookOpen } from 'lucide-react';

interface JournalEntryDetailProps {
    entry: JournalEntry;
    onClose: () => void;
}

const JournalEntryDetail: React.FC<JournalEntryDetailProps> = ({ entry, onClose }) => {
    const { accounts, customers, suppliers, employees, companyInfo, formatCurrency } = useAppContext();
    const entryRef = useRef<HTMLDivElement>(null);

    const getJELineAccountName = (line: JournalEntryLine): string => {
        if (line.entityId && line.entityType) {
            if (line.entityType === 'customer') return customers.find(c => c.id === line.entityId)?.name || 'عميل غير معروف';
            if (line.entityType === 'supplier') return suppliers.find(s => s.id === line.entityId)?.name || 'مورد غير معروف';
            if (line.entityType === 'employee') return employees.find(e => e.id === line.entityId)?.name || 'موظف غير معروف';
        }
        return accounts.find(a => a.id === line.accountId)?.name || 'غير معروف';
    };

    const totalDebit = useMemo(() => entry.lines.reduce((sum, l) => sum + (l.debit || 0), 0), [entry]);
    const totalCredit = useMemo(() => entry.lines.reduce((sum, l) => sum + (l.credit || 0), 0), [entry]);

    const handleExportPDF = async () => {
        try {
          await window.ensurePdfLibsLoaded();
        } catch (error) {
          alert("فشل تحميل مكتبات التصدير.");
          return;
        }
        
        const element = entryRef.current;
        if (!element) return;

        window.html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        }).then((canvas: HTMLCanvasElement) => {
            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const ratio = canvas.width / canvas.height;
            let imgWidth = pdfWidth - 40;
            let imgHeight = imgWidth / ratio;
            
            pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
            pdf.save(`JournalEntry_${entry.entryNumber}.pdf`);
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 p-4 sm:p-10 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl">
                <div className="p-4 flex justify-between items-center border-b dark:border-gray-700 no-print">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <BookOpen size={20} className="text-blue-500" />
                        معاينة القيد رقم {entry.entryNumber}
                    </h2>
                    <div className="flex items-center gap-2">
                         <button onClick={() => window.handlePrint('printable-entry-detail')} className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm font-bold">
                            <Printer size={18} />
                            طباعة القيد
                        </button>
                        <button onClick={handleExportPDF} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-bold">
                            <Download size={18} />
                            PDF
                        </button>
                         <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                            <X size={24} />
                        </button>
                    </div>
                </div>
                
                <div id="printable-entry-detail" ref={entryRef} className="p-8 sm:p-12 text-gray-800 dark:text-gray-200">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-8 pb-6 border-b-2 dark:border-gray-700">
                        <div className="flex items-center">
                            {companyInfo.logo && <img src={companyInfo.logo} alt="Logo" className="h-16 w-16 object-contain ml-4" />}
                            <div>
                                <h1 className="text-2xl font-bold">{companyInfo.name}</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{companyInfo.address}</p>
                            </div>
                        </div>
                        <div className="text-right">
                             <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400 uppercase mb-1">سند قيد يومية</h2>
                             <div className="space-y-1 font-mono text-sm">
                                <p><span className="font-bold">رقم القيد:</span> {entry.entryNumber}</p>
                                <p><span className="font-bold">تاريخ القيد:</span> {entry.date}</p>
                             </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
                        <span className="text-sm text-gray-500 block mb-1">البيان العام:</span>
                        <p className="font-bold">{entry.description}</p>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto border rounded-lg dark:border-gray-600">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-gray-100 dark:bg-gray-700 font-bold">
                                <tr>
                                    <th className="p-3 border-l dark:border-gray-600">اسم الحساب / البيان</th>
                                    <th className="p-3 border-l dark:border-gray-600 text-center w-32">مدين</th>
                                    <th className="p-3 text-center w-32">دائن</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entry.lines.map((line, index) => (
                                    <tr key={line.id} className={`border-t dark:border-gray-600 ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/30'}`}>
                                        <td className="p-3">
                                            <div className="font-bold">{getJELineAccountName(line)}</div>
                                            {line.description && <div className="text-xs text-gray-500 italic mt-1">{line.description}</div>}
                                        </td>
                                        <td className="p-3 border-l dark:border-gray-600 text-center font-mono font-bold text-blue-600">
                                            {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                                        </td>
                                        <td className="p-3 text-center font-mono font-bold text-red-600">
                                            {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-100 dark:bg-gray-700 font-bold border-t-2 dark:border-gray-500">
                                <tr>
                                    <td className="p-3 text-left">الإجمالي</td>
                                    <td className="p-3 border-l dark:border-gray-600 text-center font-mono">{formatCurrency(totalDebit)}</td>
                                    <td className="p-3 text-center font-mono">{formatCurrency(totalCredit)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Footer Signature */}
                    <div className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t dark:border-gray-700 text-center">
                        <div className="space-y-12">
                            <p className="font-bold">المحاسب</p>
                            <div className="border-b dark:border-gray-600 w-3/4 mx-auto"></div>
                        </div>
                        <div className="space-y-12">
                             <p className="font-bold">المراجع</p>
                             <div className="border-b dark:border-gray-600 w-3/4 mx-auto"></div>
                        </div>
                        <div className="space-y-12">
                             <p className="font-bold">المدير المالي</p>
                             <div className="border-b dark:border-gray-600 w-3/4 mx-auto"></div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default JournalEntryDetail;
