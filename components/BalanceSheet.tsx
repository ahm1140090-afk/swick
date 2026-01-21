
import React, { useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Account, AccountType, TransactionType, JournalEntry } from '../types';
import { Download, Printer } from 'lucide-react';

interface BalanceSheetProps {
    startDate: string;
    endDate: string;
}

const ReportRow: React.FC<{ label: string, amount: string, isTotal?: boolean, level?: number }> = ({ label, amount, isTotal = false, level = 0 }) => (
    <div className={`flex justify-between py-2 border-b dark:border-gray-700 ${isTotal ? 'font-bold' : 'text-sm'}`}>
        <span style={{ paddingRight: `${level * 20}px` }}>{label}</span>
        <span className="font-mono">{amount}</span>
    </div>
);

const BalanceSheet: React.FC<BalanceSheetProps> = ({ startDate, endDate }) => {
    const { accounts, transactions, journalEntries, formatCurrency } = useAppContext();
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
            pdf.save(`Balance-Sheet_${startDate}_to_${endDate}.pdf`);
        });
    };

    const reportData = useMemo(() => {
        const asOf = new Date(endDate);
        asOf.setHours(23, 59, 59, 999);

        // 1. Initialize balances to zero
        const balances = new Map<string, number>();
        accounts.forEach(acc => balances.set(acc.id, 0));

        // Helper to update balances
        const updateBalance = (accountId: string, amount: number) => {
            balances.set(accountId, (balances.get(accountId) || 0) + amount);
        };

        // 2. Process Transactions by reconstructing double-entry (Up to endDate)
        transactions
            .filter(t => new Date(t.date) <= asOf)
            .forEach(t => {
                if (t.type === TransactionType.INCOME) {
                    if (t.assetAccountId) updateBalance(t.assetAccountId, t.amount); 
                    if (t.accountId) { 
                        const acc = accounts.find(a => a.id === t.accountId);
                        if (acc) updateBalance(t.accountId, acc.type === AccountType.REVENUE ? t.amount : -t.amount);
                    }
                } else if (t.type === TransactionType.EXPENSE) {
                    if (t.accountId) updateBalance(t.accountId, t.amount); 
                    if (t.assetAccountId) updateBalance(t.assetAccountId, -t.amount); 
                } else if (t.type === TransactionType.TRANSFER) {
                    if (t.toAssetAccountId) updateBalance(t.toAssetAccountId, t.amount); 
                    if (t.assetAccountId) updateBalance(t.assetAccountId, -t.amount); 
                }
            });

        // 3. Process Journal Entries
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

        // 4. Assemble the Balance Sheet sections
        const getAccountsByType = (type: AccountType) => {
            return accounts
                .filter(a => a.type === type && a.parentId)
                .map(acc => ({ name: acc.name, amount: balances.get(acc.id) || 0}))
                .filter(acc => Math.abs(acc.amount) > 0.01);
        };

        const assetAccounts = getAccountsByType(AccountType.ASSET);
        const liabilityAccounts = getAccountsByType(AccountType.LIABILITY);
        const equityAccounts = getAccountsByType(AccountType.EQUITY);

        const totalAssets = assetAccounts.reduce((sum, acc) => sum + acc.amount, 0);
        const totalLiabilities = liabilityAccounts.reduce((sum, acc) => sum + acc.amount, 0);
        
        const revenueTotal = accounts.filter(a => a.type === AccountType.REVENUE && a.parentId).reduce((sum, acc) => sum + (balances.get(acc.id) || 0), 0);
        const expenseTotal = accounts.filter(a => a.type === AccountType.EXPENSE && a.parentId).reduce((sum, acc) => sum + (balances.get(acc.id) || 0), 0);
        const retainedEarnings = revenueTotal - expenseTotal;
        
        const totalEquityFromAccounts = equityAccounts.reduce((sum, acc) => sum + acc.amount, 0);
        const totalEquity = totalEquityFromAccounts + retainedEarnings;
        const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

        return {
            assetAccounts,
            totalAssets,
            liabilityAccounts,
            totalLiabilities,
            equityAccounts,
            retainedEarnings,
            totalEquity,
            totalLiabilitiesAndEquity
        };

    }, [endDate, accounts, transactions, journalEntries]);

    return (
        <div id="printable-area" ref={reportRef} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start mb-6">
                <div className="text-right flex-grow">
                    <h2 className="text-2xl font-bold">الميزانية العمومية</h2>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold mb-2 pb-2 border-b-2 dark:border-gray-600">الأصول</h3>
                    {reportData.assetAccounts.map(acc => <ReportRow key={acc.name} label={acc.name} amount={formatCurrency(acc.amount)} level={1} />)}
                    <ReportRow label="إجمالي الأصول" amount={formatCurrency(reportData.totalAssets)} isTotal />
                </div>
                
                <div className="space-y-4">
                     <h3 className="text-xl font-semibold mb-2 pb-2 border-b-2 dark:border-gray-600">الالتزامات وحقوق الملكية</h3>
                     <div>
                        <h4 className="font-semibold">الالتزامات</h4>
                        {reportData.liabilityAccounts.map(acc => <ReportRow key={acc.name} label={acc.name} amount={formatCurrency(acc.amount)} level={1} />)}
                        <ReportRow label="إجمالي الالتزامات" amount={formatCurrency(reportData.totalLiabilities)} isTotal/>
                     </div>
                     <div>
                        <h4 className="font-semibold mt-4">حقوق الملكية</h4>
                        {reportData.equityAccounts.map(acc => <ReportRow key={acc.name} label={acc.name} amount={formatCurrency(acc.amount)} level={1} />)}
                        <ReportRow label="الأرباح المحتجزة" amount={formatCurrency(reportData.retainedEarnings)} level={1} />
                        <ReportRow label="إجمالي حقوق الملكية" amount={formatCurrency(reportData.totalEquity)} isTotal />
                     </div>
                    <ReportRow label="إجمالي الالتزامات وحقوق الملكية" amount={formatCurrency(reportData.totalLiabilitiesAndEquity)} isTotal />
                </div>
            </div>
        </div>
    );
};

export default BalanceSheet;
