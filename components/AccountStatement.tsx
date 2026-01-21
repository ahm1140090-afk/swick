
import React, { useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { AccountType } from '../types';
import { Download, Printer } from 'lucide-react';

interface AccountStatementProps {
    accountId: string;
    startDate: string;
    endDate: string;
}

const AccountStatement: React.FC<AccountStatementProps> = ({ accountId, startDate, endDate }) => {
    const { accounts, journalEntries, formatCurrency } = useAppContext();
    const reportRef = useRef<HTMLDivElement>(null);

    const account = useMemo(() => accounts.find(a => a.id === accountId), [accountId, accounts]);

    const handleExportPDF = async () => {
        try {
          await window.ensurePdfLibsLoaded();
        } catch (error) {
          alert("فشل تحميل مكتبات التصدير. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.");
          console.error("PDF lib loading error:", error);
          return;
        }
        
        const reportElement = reportRef.current;
        if (!reportElement || !account) {
            alert("لا يمكن تصدير الملف، لم يتم تحديد حساب.");
            return;
        }

        const buttons = reportElement.querySelectorAll('button');
        buttons.forEach(btn => btn.style.display = 'none');

        window.html2canvas(reportElement, { scale: 2, useCORS: true, backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff' })
            .then((canvas: HTMLCanvasElement) => {
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
                pdf.save(`Account-Statement_${account.name.replace(/ /g, '_')}_${startDate}_to_${endDate}.pdf`);
            });
    };

    const reportData = useMemo(() => {
        if (!account) return { openingBalance: 0, movements: [], closingBalance: 0 };

        const isDebitNormal = account.type === AccountType.ASSET || account.type === AccountType.EXPENSE;
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const allMovements = journalEntries.flatMap(je =>
            je.lines
                .filter(line => line.accountId === account.id)
                .map(line => ({
                    date: je.date,
                    description: je.description,
                    debit: line.debit,
                    credit: line.credit,
                }))
        );

        const openingBalance = allMovements
            .filter(m => new Date(m.date) < start)
            .reduce((balance, m) => {
                const change = isDebitNormal ? (m.debit - m.credit) : (m.credit - m.debit);
                return balance + change;
            }, 0);
        
        const movementsInPeriod = allMovements
            .filter(m => {
                const moveDate = new Date(m.date);
                return moveDate >= start && moveDate <= end;
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        let runningBalance = openingBalance;
        const processedMovements = movementsInPeriod.map(m => {
            const change = isDebitNormal ? (m.debit - m.credit) : (m.credit - m.debit);
            runningBalance += change;
            return { ...m, balance: runningBalance };
        });

        return { openingBalance, movements: processedMovements, closingBalance: runningBalance };

    }, [account, startDate, endDate, journalEntries]);
    
    if (!account) return <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center"><p>الرجاء اختيار حساب لعرض الكشف.</p></div>;

    const { openingBalance, movements, closingBalance } = reportData;

    return (
        <div id="printable-area" ref={reportRef} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start mb-6">
                <div className="text-center flex-grow">
                    <h2 className="text-2xl font-bold">كشف حساب: {account.name}</h2>
                    <p className="text-gray-500 dark:text-gray-400">للفترة من {startDate} إلى {endDate}</p>
                </div>
                 <div className="flex items-center gap-2 no-print">
                    <button onClick={() => window.handlePrint('printable-area')} className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold py-2 px-4 rounded inline-flex items-center">
                        <Printer size={16} className="ltr:mr-2 rtl:ml-2"/>
                        <span>طباعة</span>
                    </button>
                    <button onClick={handleExportPDF} className="bg-blue-600 text-white font-bold py-2 px-4 rounded inline-flex items-center hover:bg-blue-700">
                        <Download size={16} className="ltr:mr-2 rtl:ml-2"/>
                        <span>تصدير PDF</span>
                    </button>
                 </div>
            </div>
            
            <div className="overflow-x-auto">
                 <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                         <tr>
                            <th scope="col" colSpan={3} className="px-6 py-3 text-right font-bold">الرصيد الافتتاحي</th>
                            <th scope="col" colSpan={2} className="px-6 py-3 text-left font-bold font-mono">{formatCurrency(openingBalance)}</th>
                        </tr>
                        <tr>
                            <th scope="col" className="px-6 py-3">التاريخ</th>
                            <th scope="col" className="px-6 py-3">الوصف</th>
                            <th scope="col" className="px-6 py-3 text-left">مدين</th>
                            <th scope="col" className="px-6 py-3 text-left">دائن</th>
                            <th scope="col" className="px-6 py-3 text-left">الرصيد</th>
                        </tr>
                    </thead>
                    <tbody>
                        {movements.length > 0 ? movements.map((m, index) => (
                            <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                <td className="px-6 py-4">{m.date}</td>
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{m.description}</td>
                                <td className="px-6 py-4 font-mono text-left">{m.debit > 0 ? formatCurrency(m.debit) : '-'}</td>
                                <td className="px-6 py-4 font-mono text-left">{m.credit > 0 ? formatCurrency(m.credit) : '-'}</td>
                                <td className="px-6 py-4 font-mono text-left">{formatCurrency(m.balance)}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan={5} className="text-center py-8">لا توجد حركات خلال هذه الفترة.</td></tr>
                        )}
                    </tbody>
                    <tfoot>
                         <tr className="font-bold bg-gray-50 dark:bg-gray-700">
                            <td colSpan={3} className="px-6 py-3 text-right">الرصيد الختامي</td>
                            <td colSpan={2} className="px-6 py-3 text-left font-mono">{formatCurrency(closingBalance)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default AccountStatement;
