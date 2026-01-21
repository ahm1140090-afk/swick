
import React, { useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Account, AccountType, TransactionType, JournalEntry } from '../types';
import { Download, Printer } from 'lucide-react';

interface TrialBalanceProps {
    startDate: string;
    endDate: string;
}

const ReportRow: React.FC<{ label: string, debit: string, credit: string, isTotal?: boolean }> = ({ label, debit, credit, isTotal = false }) => (
    <tr className={`border-b dark:border-gray-700 ${isTotal ? 'font-bold bg-gray-50 dark:bg-gray-700' : ''}`}>
        <td className="px-6 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white">{label}</td>
        <td className="px-6 py-3 font-mono text-right">{debit}</td>
        <td className="px-6 py-3 font-mono text-right">{credit}</td>
    </tr>
);

const TrialBalance: React.FC<TrialBalanceProps> = ({ startDate, endDate }) => {
    const { accounts, transactions, journalEntries, formatCurrency } = useAppContext();
    const reportRef = useRef<HTMLDivElement>(null);

    const handleExportPDF = async () => {
        try {
          await window.ensurePdfLibsLoaded();
        } catch (error) {
          alert("فشل تحميل مكتبات التصدير. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.");
          return;
        }

        const reportElement = reportRef.current;
        if (!reportElement) return;

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
            const ratio = canvas.width / canvas.height;
            let imgWidth = pdfWidth - 40;
            let imgHeight = imgWidth / ratio;
            
            pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
            pdf.save(`Trial-Balance_${startDate}_to_${endDate}.pdf`);
        });
    };

    const reportData = useMemo(() => {
        const asOf = new Date(endDate);
        asOf.setHours(23, 59, 59, 999);

        const balances = new Map<string, number>();
        accounts.forEach(acc => balances.set(acc.id, 0));
    
        const updateBalance = (accountId: string, amount: number) => {
            balances.set(accountId, (balances.get(accountId) || 0) + amount);
        };
    
        transactions
            .filter(t => new Date(t.date) <= asOf)
            .forEach(t => {
                if (t.type === TransactionType.INCOME) {
                    if (t.assetAccountId) updateBalance(t.assetAccountId, t.amount);
                    if (t.accountId) updateBalance(t.accountId, t.amount);
                } else if (t.type === TransactionType.EXPENSE) {
                    if (t.accountId) updateBalance(t.accountId, t.amount);
                    if (t.assetAccountId) updateBalance(t.assetAccountId, -t.amount);
                } else if (t.type === TransactionType.TRANSFER) {
                    if (t.toAssetAccountId) updateBalance(t.toAssetAccountId, t.amount);
                    if (t.assetAccountId) updateBalance(t.assetAccountId, -t.amount);
                }
            });
    
        journalEntries
            .filter(je => new Date(je.date) <= asOf)
            .forEach(je => {
                je.lines.forEach(line => {
                    const acc = accounts.find(a => a.id === line.accountId);
                    if (!acc) return;
                    const isDebitNormal = acc.type === AccountType.ASSET || acc.type === AccountType.EXPENSE;
                    const change = isDebitNormal ? (line.debit - line.credit) : (line.credit - line.debit);
                    updateBalance(line.accountId, change);
                });
            });
    
        let totalDebit = 0;
        let totalCredit = 0;
    
        const rows = accounts
            .filter(acc => acc.parentId !== null)
            .map(acc => {
                const balance = balances.get(acc.id) || 0;
                if (Math.abs(balance) < 0.01) return null;
                const isDebitNormal = acc.type === AccountType.ASSET || acc.type === AccountType.EXPENSE;
                let debit = 0, credit = 0;
                if (isDebitNormal) {
                    debit = balance > 0 ? balance : 0;
                    credit = balance < 0 ? -balance : 0;
                } else {
                    credit = balance > 0 ? balance : 0;
                    debit = balance < 0 ? -balance : 0;
                }
                totalDebit += debit;
                totalCredit += credit;
                return { name: acc.name, debit, credit };
            })
            .filter(Boolean) as { name: string, debit: number, credit: number }[];
    
        return { rows, totalDebit, totalCredit };
    }, [endDate, accounts, transactions, journalEntries]);

    return (
        <div id="printable-area" ref={reportRef} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start mb-6">
                 <div className="text-right flex-grow">
                    <h2 className="text-2xl font-bold">ميزان المراجعة</h2>
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
                            <th className="px-6 py-3">الحساب</th>
                            <th className="px-6 py-3">مدين</th>
                            <th className="px-6 py-3">دائن</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.rows.map(row => <ReportRow key={row.name} label={row.name} debit={row.debit > 0 ? formatCurrency(row.debit) : '—'} credit={row.credit > 0 ? formatCurrency(row.credit) : '—'} />)}
                    </tbody>
                    <tfoot>
                        <ReportRow label="الإجمالي" debit={formatCurrency(reportData.totalDebit)} credit={formatCurrency(reportData.totalCredit)} isTotal />
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default TrialBalance;
