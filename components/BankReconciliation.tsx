import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { AccountType, JournalEntryLine, Reconciliation } from '../types';
import SearchableSelect from './SearchableSelect';
import { Check, GitCompareArrows, History, Eye, Undo2 } from 'lucide-react';
import ReconciliationReport from './ReconciliationReport';

const BankReconciliation: React.FC = () => {
    const { accounts, journalEntries, addReconciliation, addJournalEntry, t, formatCurrency, reconciliations, undoReconciliation } = useAppContext();

    const [view, setView] = useState<'reconcile' | 'history'>('reconcile');
    const [step, setStep] = useState<'setup' | 'reconciling'>('setup');
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [statementDate, setStatementDate] = useState(new Date().toISOString().split('T')[0]);
    const [statementBalance, setStatementBalance] = useState('');
    const [viewingReport, setViewingReport] = useState<Reconciliation | null>(null);
    const [undoTargetId, setUndoTargetId] = useState<string | null>(null);


    const [selectedLineIds, setSelectedLineIds] = useState(new Set<string>());
    const [bankCharges, setBankCharges] = useState('');
    const [interestEarned, setInterestEarned] = useState('');

    const bankAccounts = useMemo(() =>
        accounts.filter(a => a.type === AccountType.ASSET && a.parentId === 'asset-1')
        .map(a => ({ value: a.id, label: a.name })), [accounts]);

    const { beginningBalance, unreconciledMovements } = useMemo(() => {
        if (!selectedAccountId) return { beginningBalance: 0, unreconciledMovements: [] };
        
        const accountReconciliations = reconciliations
            .filter(r => r.accountId === selectedAccountId)
            .sort((a, b) => new Date(b.statementDate).getTime() - new Date(a.statementDate).getTime());

        const lastRec = accountReconciliations[0] || null;
        const beginningBal = lastRec ? lastRec.statementBalance : 0;

        const movements = journalEntries.flatMap(je =>
            je.lines
            .filter(line => line.accountId === selectedAccountId && !line.reconciliationId && new Date(je.date) <= new Date(statementDate))
            .map(line => ({ ...line, date: je.date, entryDescription: je.description }))
        );

        return {
            beginningBalance: beginningBal,
            unreconciledMovements: movements,
        };
    }, [selectedAccountId, statementDate, journalEntries, reconciliations]);

    const { deposits, withdrawals, totals } = useMemo(() => {
        const deps = unreconciledMovements.filter(m => m.debit > 0);
        const withds = unreconciledMovements.filter(m => m.credit > 0);
        
        const selectedDepositsTotal = deps.filter(d => selectedLineIds.has(d.id)).reduce((sum, d) => sum + d.debit, 0);
        const selectedWithdrawalsTotal = withds.filter(w => selectedLineIds.has(w.id)).reduce((sum, w) => sum + w.credit, 0);

        return {
            deposits: deps,
            withdrawals: withds,
            totals: { selectedDepositsTotal, selectedWithdrawalsTotal }
        };
    }, [unreconciledMovements, selectedLineIds]);
    
    const { clearedBalance, difference } = useMemo(() => {
        const charges = parseFloat(bankCharges) || 0;
        const interest = parseFloat(interestEarned) || 0;

        const cleared = beginningBalance + totals.selectedDepositsTotal - totals.selectedWithdrawalsTotal + interest - charges;
        const diff = (parseFloat(statementBalance) || 0) - cleared;
        return { clearedBalance: cleared, difference: diff };
    }, [beginningBalance, totals, statementBalance, bankCharges, interestEarned]);

    const sortedReconciliations = useMemo(() =>
        [...reconciliations].sort((a, b) => new Date(b.statementDate).getTime() - new Date(a.statementDate).getTime()),
        [reconciliations]
    );

    const handleStart = () => {
        if (selectedAccountId && statementDate && statementBalance) {
            setStep('reconciling');
        } else {
            alert('الرجاء تعبئة جميع الحقول.');
        }
    };
    
    const toggleSelection = (lineId: string) => {
        setSelectedLineIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(lineId)) {
                newSet.delete(lineId);
            } else {
                newSet.add(lineId);
            }
            return newSet;
        });
    };
    
    const handleReconcile = () => {
        if (Math.abs(difference) > 0.001) {
            alert('الفرق يجب أن يكون صفراً لإنهاء المطابقة.');
            return;
        }

        const lineIdsToReconcile = Array.from(selectedLineIds);
        let finalLineIds = [...lineIdsToReconcile];

        const charges = parseFloat(bankCharges) || 0;
        if (charges > 0) {
            const je = addJournalEntry({
                date: statementDate,
                description: t('bank_charges'),
                lines: [
                    { id: '1', accountId: 'account-exp-misc', debit: charges, credit: 0, description: '' },
                    { id: '2', accountId: `account-${selectedAccountId}`, debit: 0, credit: charges, description: '' },
                ]
            });
            finalLineIds.push(...je.lines.map(l => l.id));
        }

        const interest = parseFloat(interestEarned) || 0;
        if (interest > 0) {
            const je = addJournalEntry({
                date: statementDate,
                description: t('interest_earned'),
                lines: [
                    { id: '1', accountId: `account-${selectedAccountId}`, debit: interest, credit: 0, description: '' },
                    { id: '2', accountId: 'account-rev-misc', debit: 0, credit: interest, description: '' },
                ]
            });
            finalLineIds.push(...je.lines.map(l => l.id));
        }

        addReconciliation({
            accountId: selectedAccountId,
            statementDate,
            statementBalance: parseFloat(statementBalance),
            lineIds: finalLineIds,
        });

        // Reset state
        setStep('setup');
        setView('history');
        setSelectedAccountId('');
        setStatementBalance('');
        setSelectedLineIds(new Set());
        setBankCharges('');
        setInterestEarned('');
    };

    if (view === 'history') {
        return (
            <>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">{t('reconciliation_history')}</h2>
                        <button onClick={() => setView('reconcile')} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2">
                            <GitCompareArrows size={16} />
                            {t('start_reconciliation')}
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th className="px-6 py-3">{t('asset_account')}</th>
                                    <th className="px-6 py-3">{t('statement_date')}</th>
                                    <th className="px-6 py-3">{t('statement_balance')}</th>
                                    <th className="px-6 py-3 no-print"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedReconciliations.map(rec => (
                                    <tr key={rec.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{accounts.find(a => a.id === rec.accountId)?.name || rec.accountId}</td>
                                        <td className="px-6 py-4">{rec.statementDate}</td>
                                        <td className="px-6 py-4 font-mono">{formatCurrency(rec.statementBalance)}</td>
                                        <td className="px-6 py-4 no-print">
                                            <div className="flex items-center gap-4">
                                                <button onClick={() => setViewingReport(rec)} className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline">
                                                    <Eye size={16} />
                                                    {t('view_print')}
                                                </button>
                                                <button onClick={() => setUndoTargetId(rec.id)} className="flex items-center gap-1 text-red-600 dark:text-red-400 hover:underline">
                                                    <Undo2 size={16} />
                                                    {t('undo_reconciliation')}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                 {sortedReconciliations.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="text-center py-10 text-gray-500">
                                            لا توجد مطابقات محفوظة.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                {viewingReport && <ReconciliationReport reconciliation={viewingReport} onClose={() => setViewingReport(null)} />}
                {undoTargetId && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
                            <h3 className="text-lg font-bold mb-4">{t('confirm_undo_reconciliation_title')}</h3>
                            <p className="mb-6">{t('confirm_undo_reconciliation_message')}</p>
                            <div className="flex justify-end gap-4">
                                <button onClick={() => setUndoTargetId(null)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
                                    {t('cancel')}
                                </button>
                                <button 
                                    onClick={() => {
                                        if (undoTargetId) undoReconciliation(undoTargetId);
                                        setUndoTargetId(null);
                                    }} 
                                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                                >
                                    {t('confirm')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        )
    }

    if (step === 'setup') {
        return (
             <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md space-y-6">
                <div className="flex justify-between items-start">
                    <div className="text-center flex-grow">
                        <GitCompareArrows size={48} className="mx-auto text-blue-500" />
                        <h2 className="text-2xl font-bold mt-4">{t('bank_reconciliation')}</h2>
                    </div>
                    <button onClick={() => setView('history')} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2 self-start flex-shrink-0">
                        <History size={16} />
                        {t('reconciliation_history')}
                    </button>
                 </div>
                 <div>
                    <label className="block mb-2 text-sm font-medium">{t('asset_account')}</label>
                    <SearchableSelect options={bankAccounts} value={selectedAccountId} onChange={setSelectedAccountId} required />
                </div>
                 <div>
                    <label htmlFor="statementDate" className="block mb-2 text-sm font-medium">{t('statement_date')}</label>
                    <input type="date" id="statementDate" value={statementDate} onChange={e => setStatementDate(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" required />
                </div>
                 <div>
                    <label htmlFor="statementBalance" className="block mb-2 text-sm font-medium">{t('statement_balance')}</label>
                    <input type="number" step="any" id="statementBalance" value={statementBalance} onChange={e => setStatementBalance(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" required />
                </div>
                <button onClick={handleStart} className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-bold">{t('start_reconciliation')}</button>
            </div>
        );
    }
    
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-6">
            <div className="flex justify-between items-center">
                 <h2 className="text-xl font-bold">{t('bank_reconciliation')} - {accounts.find(a=>a.id === selectedAccountId)?.name}</h2>
                 <button onClick={() => setStep('setup')} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">تغيير</button>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
                <div><p className="text-sm text-gray-500">{t('statement_balance')}</p><p className="font-bold text-lg">{formatCurrency(parseFloat(statementBalance) || 0)}</p></div>
                <div><p className="text-sm text-gray-500">{t('cleared_balance')}</p><p className="font-bold text-lg">{formatCurrency(clearedBalance)}</p></div>
                <div><p className="text-sm text-gray-500">{t('difference')}</p><p className={`font-bold text-lg ${Math.abs(difference) < 0.001 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(difference)}</p></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Withdrawals */}
                <div className="space-y-2">
                    <h3 className="font-bold">{t('withdrawals_and_other_debits')} ({withdrawals.length})</h3>
                     <div className="border rounded-lg overflow-hidden dark:border-gray-700 max-h-96 overflow-y-auto">
                        <table className="w-full text-sm">
                           <tbody>
                                {withdrawals.map(w => (
                                    <tr key={w.id} className="border-b dark:border-gray-700">
                                        <td className="p-2"><input type="checkbox" checked={selectedLineIds.has(w.id)} onChange={() => toggleSelection(w.id)} /></td>
                                        <td className="p-2"><p className="truncate" title={w.entryDescription}>{w.entryDescription}</p><p className="text-xs text-gray-500">{w.date}</p></td>
                                        <td className="p-2 font-mono text-left">{formatCurrency(w.credit)}</td>
                                    </tr>
                                ))}
                           </tbody>
                        </table>
                        {withdrawals.length === 0 && <p className="p-4 text-center text-gray-500">لا يوجد</p>}
                    </div>
                </div>

                {/* Deposits */}
                <div className="space-y-2">
                    <h3 className="font-bold">{t('deposits_and_other_credits')} ({deposits.length})</h3>
                    <div className="border rounded-lg overflow-hidden dark:border-gray-700 max-h-96 overflow-y-auto">
                        <table className="w-full text-sm">
                           <tbody>
                                {deposits.map(d => (
                                    <tr key={d.id} className="border-b dark:border-gray-700">
                                        <td className="p-2"><input type="checkbox" checked={selectedLineIds.has(d.id)} onChange={() => toggleSelection(d.id)} /></td>
                                        <td className="p-2"><p className="truncate" title={d.entryDescription}>{d.entryDescription}</p><p className="text-xs text-gray-500">{d.date}</p></td>
                                        <td className="p-2 font-mono text-left">{formatCurrency(d.debit)}</td>
                                    </tr>
                                ))}
                           </tbody>
                        </table>
                        {deposits.length === 0 && <p className="p-4 text-center text-gray-500">لا يوجد</p>}
                    </div>
                </div>
            </div>
            
            <div className="border-t pt-4 dark:border-gray-700 space-y-4">
                 <h3 className="font-bold">{t('add_adjustment')}</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="bankCharges" className="text-sm">{t('bank_charges')}</label>
                        <input type="number" step="any" value={bankCharges} onChange={e => setBankCharges(e.target.value)} className="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                     <div>
                        <label htmlFor="interestEarned" className="text-sm">{t('interest_earned')}</label>
                        <input type="number" step="any" value={interestEarned} onChange={e => setInterestEarned(e.target.value)} className="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                 </div>
            </div>

            <div className="flex justify-end pt-4 border-t dark:border-gray-700">
                <button onClick={handleReconcile} disabled={Math.abs(difference) > 0.001} className="flex items-center bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold">
                   <Check size={20} className="ml-2"/> {t('finish_reconciliation')}
                </button>
            </div>

        </div>
    )
};

export default BankReconciliation;