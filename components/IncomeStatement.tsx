
import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Account, AccountType, JournalEntry } from '../types';
import { Download, Printer, Filter } from 'lucide-react';

interface IncomeStatementProps {
    startDate: string;
    endDate: string;
}

const ReportRow: React.FC<{ label: string, amount: string, isTotal?: boolean, level?: number }> = ({ label, amount, isTotal = false, level = 0 }) => (
    <div className={`flex justify-between py-2 border-b dark:border-gray-700 ${isTotal ? 'font-bold text-lg' : 'text-sm'}`}>
        <span style={{ paddingRight: `${level * 20}px` }}>{label}</span>
        <span className="font-mono">{amount}</span>
    </div>
);

const IncomeStatement: React.FC<IncomeStatementProps> = ({ startDate, endDate }) => {
    const { transactions, accounts, journalEntries, formatCurrency } = useAppContext();
    const [filterType, setFilterType] = useState<'all' | 'revenue' | 'expense'>('all');
    const reportRef = useRef<HTMLDivElement>(null);

    const handleExportPDF = async () => {
        try {
          await window.ensurePdfLibsLoaded();
        } catch (error) {
          alert("فشل تحميل مكتبات التصدير. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.");
          console.error("PDF lib loading error:", error);
          return;
        }

        const reportElement = reportRef.current;
        if (!reportElement) {
            alert("لا يمكن العثور على العنصر المراد تصديره.");
            return;
        }

        const buttons = reportElement.querySelectorAll('button');
        buttons.forEach(btn => btn.style.display = 'none');

        window.html2canvas(reportElement, {
            scale: 2,
            useCORS: true,
            backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        }).then((canvas: HTMLCanvasElement) => {
            buttons.forEach(btn => btn.style.display = 'inline-flex');

            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const ratio = canvas.width / canvas.height;
            let imgWidth = pdfWidth - 40; // with margin
            let imgHeight = imgWidth / ratio;
            
            if (imgHeight > pdfHeight - 40) {
                imgHeight = pdfHeight - 40;
                imgWidth = imgHeight * ratio;
            }

            const x = (pdfWidth - imgWidth) / 2;
            const y = 20; // Position at the top with a margin

            pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
            pdf.save(`Income-Statement_${startDate}_to_${endDate}.pdf`);
        });
    };

    const reportData = useMemo(() => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include the whole end day

        const periodTotals = new Map<string, number>();

        // Process Transactions
        transactions
            .filter(t => {
                const tDate = new Date(t.date);
                return tDate >= start && tDate <= end;
            })
            .forEach(t => {
                if (t.accountId) {
                    const current = periodTotals.get(t.accountId) || 0;
                    periodTotals.set(t.accountId, current + t.amount);
                }
            });

        // Process Journal Entries
        journalEntries
            .filter(je => {
                const jeDate = new Date(je.date);
                return jeDate >= start && jeDate <= end;
            })
            .forEach(je => {
                je.lines.forEach(line => {
                    const acc = accounts.find(a => a.id === line.accountId);
                    if (!acc || (acc.type !== AccountType.REVENUE && acc.type !== AccountType.EXPENSE)) {
                        return;
                    }
                    
                    const change = acc.type === AccountType.EXPENSE 
                        ? line.debit - line.credit 
                        : line.credit - line.debit;
                        
                    const current = periodTotals.get(line.accountId) || 0;
                    periodTotals.set(line.accountId, current + change);
                });
            });
        
        const revenues = { details: [] as { name: string, total: number }[], total: 0 };
        const expenses = { details: [] as { name: string, total: number }[], total: 0 };
        
        accounts.forEach(acc => {
            if (acc.parentId && periodTotals.has(acc.id)) {
                const total = periodTotals.get(acc.id) || 0;
                if (Math.abs(total) < 0.01) return;
                
                if (acc.type === AccountType.REVENUE) {
                    revenues.details.push({ name: acc.name, total });
                    revenues.total += total;
                } else if (acc.type === AccountType.EXPENSE) {
                    expenses.details.push({ name: acc.name, total });
                    expenses.total += total;
                }
            }
        });

        const netIncome = revenues.total - expenses.total;
        
        return { revenues, expenses, netIncome };

    }, [startDate, endDate, transactions, accounts, journalEntries]);

    const { revenues, expenses, netIncome } = reportData;

    return (
        <div id="printable-area" ref={reportRef} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                <div className="text-right flex-grow">
                    <h2 className="text-2xl font-bold">قائمة الدخل</h2>
                    <p className="text-gray-500 dark:text-gray-400">للفترة من {startDate} إلى {endDate}</p>
                </div>
                 <div className="flex flex-wrap items-center gap-2 no-print">
                    <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg ml-4">
                        <button 
                            onClick={() => setFilterType('all')} 
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${filterType === 'all' ? 'bg-white dark:bg-gray-600 shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            الكل
                        </button>
                        <button 
                            onClick={() => setFilterType('revenue')} 
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${filterType === 'revenue' ? 'bg-white dark:bg-gray-600 shadow text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            الإيرادات
                        </button>
                        <button 
                            onClick={() => setFilterType('expense')} 
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${filterType === 'expense' ? 'bg-white dark:bg-gray-600 shadow text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            المصروفات
                        </button>
                    </div>
                    <button onClick={() => window.handlePrint('printable-area')} className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold py-2 px-4 rounded inline-flex items-center text-sm">
                        <Printer size={16} className="ltr:mr-2 rtl:ml-2"/>
                        <span>طباعة</span>
                    </button>
                    <button onClick={handleExportPDF} className="bg-blue-600 text-white font-bold py-2 px-4 rounded inline-flex items-center hover:bg-blue-700 text-sm">
                        <Download size={16} className="ltr:mr-2 rtl:ml-2"/>
                        <span>تصدير PDF</span>
                    </button>
                 </div>
            </div>

            <div className="space-y-6">
                {(filterType === 'all' || filterType === 'revenue') && (
                    <div>
                        <h3 className="text-xl font-semibold mb-2 pb-2 border-b-2 border-green-500 dark:border-green-600">الإيرادات</h3>
                        {revenues.details.length > 0 ? (
                            revenues.details.map(item => <ReportRow key={item.name} label={item.name} amount={formatCurrency(item.total)} level={1} />)
                        ) : (
                            <p className="text-sm text-gray-500 pr-5 py-2 italic">لا توجد إيرادات مسجلة لهذه الفترة.</p>
                        )}
                        <ReportRow label="إجمالي الإيرادات" amount={formatCurrency(revenues.total)} isTotal />
                    </div>
                )}

                {(filterType === 'all' || filterType === 'expense') && (
                    <div>
                        <h3 className="text-xl font-semibold mb-2 pb-2 border-b-2 border-red-500 dark:border-red-600">المصروفات</h3>
                        {expenses.details.length > 0 ? (
                            expenses.details.map(item => <ReportRow key={item.name} label={item.name} amount={formatCurrency(item.total)} level={1} />)
                        ) : (
                            <p className="text-sm text-gray-500 pr-5 py-2 italic">لا توجد مصروفات مسجلة لهذه الفترة.</p>
                        )}
                        <ReportRow label="إجمالي المصروفات" amount={formatCurrency(expenses.total)} isTotal />
                    </div>
                )}
                
                {filterType === 'all' && (
                    <div className={`p-4 rounded-lg border-2 ${netIncome >= 0 ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
                        <ReportRow label={netIncome >= 0 ? "صافي الدخل" : "صافي الخسارة"} amount={formatCurrency(netIncome)} isTotal />
                    </div>
                )}
            </div>
            
            <div className="mt-12 pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-between text-xs text-gray-400">
                <span>تاريخ التقرير: {new Date().toLocaleDateString('ar-EG')}</span>
                <span>النظام المحاسبي الذكي</span>
            </div>
        </div>
    );
};

export default IncomeStatement;
