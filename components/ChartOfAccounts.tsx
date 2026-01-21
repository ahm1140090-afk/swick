
import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Account, AccountType } from '../types';
import { Plus, Edit, Trash2, Download, Printer, Search, Folder, FileText, FileSpreadsheet, Upload } from 'lucide-react';
import AccountForm from './AccountForm';
import CSVImportModal from './CSVImportModal';

type DisplayAccount = Account & { level: number; isVirtual?: boolean; hasChildren: boolean };

const AccountRow: React.FC<{ account: DisplayAccount, canEdit: boolean, onEdit: (acc: Account) => void, onDelete: (id: string) => void, formatCurrency: (amount: number) => string }> = ({ account, canEdit, onEdit, onDelete, formatCurrency }) => {
    const getAccountTypeLabel = (type: AccountType) => {
        switch(type) {
            case AccountType.ASSET: return 'أصل';
            case AccountType.EXPENSE: return 'مصروف';
            case AccountType.REVENUE: return 'إيراد';
            case AccountType.EQUITY: return 'حقوق ملكية';
            case AccountType.LIABILITY: return 'إلتزام';
            default: return '';
        }
    };
    
    const isParent = !account.parentId;
    const isVirtual = !!account.isVirtual;
    const Icon = (isParent || account.hasChildren) ? Folder : FileText;

    return (
        <tr className={`border-b dark:border-gray-700 hover:bg-gray-50 ${isParent ? 'bg-gray-50 font-bold' : (isVirtual ? 'bg-slate-50/50' : 'bg-white')}`}>
            <td className="px-6 py-4">
                <div className="flex items-center" style={{ paddingRight: `${account.level * 20}px` }}>
                    <Icon size={16} className={`ml-2 flex-shrink-0 ${(isParent || account.hasChildren) ? 'text-blue-500' : 'text-gray-500'}`} />
                    <span>{account.name}</span>
                </div>
            </td>
            <td className="px-6 py-4 font-mono">{account.accountNumber || ''}</td>
            <td className="px-6 py-4">{getAccountTypeLabel(account.type)}</td>
            <td className="px-6 py-4 font-mono">
                {account.type === AccountType.ASSET && !isParent && !isVirtual ? formatCurrency(account.balance) : '—'}
            </td>
            {canEdit && (
              <td className="px-6 py-4 flex space-x-2 space-x-reverse no-print">
                  {!isVirtual && <button onClick={() => onEdit(account)} className="text-blue-500 hover:text-blue-700 p-1 transition-transform hover:scale-110"><Edit size={18} /></button>}
                  {!isParent && !isVirtual && <button onClick={() => onDelete(account.id)} className="text-red-500 hover:text-red-700 p-1 transition-transform hover:scale-110"><Trash2 size={18} /></button>}
              </td>
            )}
        </tr>
    )
}

const ChartOfAccounts: React.FC = () => {
    const { accounts, deleteAccount, customers, suppliers, employees, formatCurrency, canEdit } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const tableContainerRef = useRef<HTMLDivElement>(null);

    const accountTree = useMemo(() => {
        type VirtualAccount = Account & { isVirtual?: boolean };
        const combinedAccounts: VirtualAccount[] = [...accounts];
        const tree: any[] = [];
        const map: { [key: string]: any } = {};

        combinedAccounts.forEach(account => { map[account.id] = { ...account, children: [] }; });
        combinedAccounts.forEach(account => {
            if (account.parentId && map[account.parentId]) map[account.parentId].children.push(map[account.id]);
            else tree.push(map[account.id]);
        });

        let flatList: DisplayAccount[] = [];
        const flatten = (nodes: any[], level = 0) => {
            nodes.sort((a,b) => (a.accountNumber || '').localeCompare(b.accountNumber || '', 'ar-EG-u-kn-true')).forEach(node => {
                flatList.push({ ...node, level, hasChildren: node.children.length > 0 });
                flatten(node.children, level + 1);
            });
        };
        flatten(tree);
        return searchQuery ? flatList.filter(acc => acc.name.includes(searchQuery) || acc.accountNumber?.includes(searchQuery)) : flatList;
    }, [accounts, searchQuery]);

    const handleAddNew = () => {
        setEditingAccount(null);
        setIsModalOpen(true);
    };

    const handleEdit = (acc: Account) => {
        setEditingAccount(acc);
        setIsModalOpen(true);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">شجرة الحسابات</h2>
                <div className="relative w-full lg:w-64">
                    <Search size={18} className="absolute right-3 top-3 text-gray-400" />
                    <input type="text" placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pr-10 p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm" />
                </div>
                <div className="flex flex-wrap items-center gap-2 no-print shrink-0">
                    <button onClick={() => setIsImportModalOpen(true)} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-bold shadow-sm transition-all">
                        <Upload size={18} className="ml-2" /> استيراد
                    </button>
                    <button onClick={() => window.handlePrint('printable-area')} className="flex items-center bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-bold">
                        <Printer size={18} className="ml-2" /> طباعة
                    </button>
                    {canEdit && (
                        <button onClick={handleAddNew} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-bold shadow-md">
                            <Plus size={18} className="ml-2" /> إضافة حساب
                        </button>
                    )}
                </div>
            </div>

            <div id="printable-area" ref={tableContainerRef} className="overflow-x-auto border dark:border-gray-700 rounded-lg">
                <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-3 w-2/5">اسم الحساب</th>
                            <th className="px-6 py-3">رقم الحساب</th>
                            <th className="px-6 py-3">النوع</th>
                            <th className="px-6 py-3">الرصيد</th>
                            {canEdit && <th className="px-6 py-3 no-print">إجراءات</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {accountTree.map(acc => (
                            <AccountRow key={acc.id} account={acc} canEdit={canEdit} onEdit={handleEdit} onDelete={deleteAccount} formatCurrency={formatCurrency} />
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && canEdit && <AccountForm account={editingAccount} onClose={() => setIsModalOpen(false)} />}
            {isImportModalOpen && <CSVImportModal type="accounts" onClose={() => setIsImportModalOpen(false)} />}
        </div>
    );
};

export default ChartOfAccounts;
