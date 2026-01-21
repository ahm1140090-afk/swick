
import React, { useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Reconciliation } from '../types';
import { X, Download, Printer } from 'lucide-react';

interface ReconciliationReportProps {
  reconciliation: Reconciliation;
  onClose: () => void;
}

const ReconciliationReport: React.FC<ReconciliationReportProps> = ({ reconciliation, onClose }) => {
    const { accounts, journalEntries, companyInfo, formatCurrency, t, reconciliations } = useAppContext();
    const reportRef = useRef<HTMLDivElement>(null);
    
    const account = useMemo(() => accounts.find(a => a.id === reconciliation.accountId), [accounts, reconciliation]);

    const handleExportPDF = async () => {
        try {
          await window.ensurePdfLibsLoaded();
        } catch (error) {
          alert("فشل تحميل مكتبات التصدير. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.");
          return;
        }

        const reportElement = reportRef.current;
        if (!reportElement) return;

        window.html2canvas(reportElement, { scale: 2, useCORS: true, backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff' })
            .then((canvas: HTMLCanvasElement) => {
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
                pdf.save(`Reconciliation_${account?.name}_${reconciliation.statementDate}.pdf`);
            });
    };
    
    const reportData = useMemo(() => {
        const allAccountReconciliations = reconciliations
            .filter(r => r.accountId === reconciliation.accountId)
            .sort((a, b) => new Date(a.statementDate).getTime() - new Date(b.statementDate).getTime());
        
        const currentRecIndex = allAccountReconciliations.findIndex(r => r.id === reconciliation.id);
        const previousRec = currentRecIndex > 0 ? allAccountReconciliations[currentRecIndex - 1] : null;
        
        const beginningBalance = previousRec ? previousRec.statementBalance : 0;

        const clearedLines = journalEntries.flatMap(je =>
            je.lines
            .filter(line => line.reconciliationId === reconciliation.id && line.accountId === reconciliation.accountId)
            .map(line => ({ ...line, date: je.date, entryDescription: je.description }))
        );

        const clearedDeposits = clearedLines.filter(l => l.debit > 0);
        const clearedWithdrawals = clearedLines.filter(l => l.credit > 0);
        
        const totalDeposits = clearedDeposits.reduce((sum, d) => sum + d.debit, 0);
        const totalWithdrawals = clearedWithdrawals.reduce((sum, w) => sum + w.credit, 0);

        const endingClearedBalance = beginningBalance + totalDeposits - totalWithdrawals;

        return { beginningBalance, clearedDeposits, totalDeposits, clearedWithdrawals, totalWithdrawals, endingClearedBalance };
    }, [reconciliation, journalEntries, accounts, reconciliations]);


    if (!reconciliation || !account) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 p-4 sm:p-10 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl">
                <div className="p-4 sm:p-6 flex justify-between items-center border-b dark:border-gray-700 no-print">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('reconciliation_report')}</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={() => window.handlePrint('printable-reconciliation-report')} className="bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors flex items-center">
                            <Printer size={18} className="ml-2" />
                            طباعة
                        </button>
                        <button onClick={handleExportPDF} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                            <Download size={18} className="ml-2" />
                            تصدير PDF
                        </button>
                         <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                            <X size={24} />
                        </button>
                    </div>
                </div>
                
                <div id="printable-reconciliation-report" ref={reportRef} className="p-8 sm:p-12 text-gray-800 dark:text-gray-200">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                           <h1 className="text-2xl font-bold">{companyInfo.name}</h1>
                           <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-300">{t('reconciliation_report')}</h2>
                        </div>
                        <div className="text-right">
                           <p><span className="font-semibold">{account.name}</span></p>
                           <p><span className="font-semibold">{t('statement_date')}: </span>{reconciliation.statementDate}</p>
                        </div>
                    </div>
                    
                    <table className="w-full text-sm mb-8">
                      <tbody>
                        <tr className="border-b dark:border-gray-700">
                          <td className="py-2 pr-2 font-semibold">{t('ending_statement_balance')}</td>
                          <td className="py-2 pl-2 text-left font-mono">{formatCurrency(reconciliation.statementBalance)}</td>
                        </tr>
                        <tr className="border-b dark:border-gray-700">
                          <td className="py-2 pr-2 font-semibold">{t('ending_cleared_balance')}</td>
                          <td className="py-2 pl-2 text-left font-mono">{formatCurrency(reportData.endingClearedBalance)}</td>
                        </tr>
                        <tr className="font-bold text-lg bg-gray-50 dark:bg-gray-700/50">
                           <td className="py-3 pr-2">{t('difference')}</td>
                           <td className={`py-3 pl-2 text-left font-mono ${Math.abs(reconciliation.statementBalance - reportData.endingClearedBalance) > 0.01 ? 'text-red-500' : 'text-green-500'}`}>{formatCurrency(reconciliation.statementBalance - reportData.endingClearedBalance)}</td>
                        </tr>
                      </tbody>
                    </table>
                    
                    <div className="space-y-6">
                        <div className="border p-4 rounded-lg dark:border-gray-600">
                            <h3 className="font-bold mb-2">ملخص رصيد الدفاتر</h3>
                            <div className="flex justify-between text-sm py-1"><span >{t('beginning_balance')}</span><span className="font-mono">{formatCurrency(reportData.beginningBalance)}</span></div>
                            <div className="flex justify-between text-sm py-1"><span>(+) {t('cleared_deposits')}</span><span className="font-mono">{formatCurrency(reportData.totalDeposits)}</span></div>
                            <div className="flex justify-between text-sm py-1"><span>(-) {t('cleared_withdrawals')}</span><span className="font-mono">({formatCurrency(reportData.totalWithdrawals)})</span></div>
                            <div className="flex justify-between text-sm py-2 mt-1 font-bold border-t dark:border-gray-600"><span>(=) {t('ending_cleared_balance')}</span><span className="font-mono">{formatCurrency(reportData.endingClearedBalance)}</span></div>
                        </div>

                        <div>
                             <h3 className="font-bold mb-2 text-lg">{t('cleared_transactions')}</h3>
                             <table className="w-full text-sm">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                    <tr>
                                        <th className="px-4 py-2 text-right">التاريخ</th>
                                        <th className="px-4 py-2 text-right">الوصف</th>
                                        <th className="px-4 py-2 text-left">الإيداعات</th>
                                        <th className="px-4 py-2 text-left">السحوبات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...reportData.clearedDeposits, ...reportData.clearedWithdrawals].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(line => (
                                        <tr key={line.id} className="border-b dark:border-gray-700">
                                            <td className="px-4 py-2">{line.date}</td>
                                            <td className="px-4 py-2">{line.entryDescription}</td>
                                            <td className="px-4 py-2 text-left font-mono">{line.debit > 0 ? formatCurrency(line.debit) : '-'}</td>
                                            <td className="px-4 py-2 text-left font-mono">{line.credit > 0 ? formatCurrency(line.credit) : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                             </table>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ReconciliationReport;