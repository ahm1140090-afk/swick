import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { JournalEntry, JournalEntryLine } from '../types';
import { X, Plus, Trash2 } from 'lucide-react';
import SearchableSelect from './SearchableSelect';

interface JournalEntryFormProps {
  entry: JournalEntry | null;
  onClose: () => void;
}

const JournalEntryForm: React.FC<JournalEntryFormProps> = ({ entry, onClose }) => {
  const { addJournalEntry, updateJournalEntry, journalEntries, getSelectableAccountList, formatCurrency, setIsEditing } = useAppContext();
  
  const selectableAccounts = useMemo(() => getSelectableAccountList(), [getSelectableAccountList]);

  const [formData, setFormData] = useState({
    entryNumber: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });
  
  const [lines, setLines] = useState<(Omit<JournalEntryLine, 'id'> & { id: string | number, accountId: string })[]>([
    { id: 1, accountId: '', debit: 0, credit: 0, description: '' },
    { id: 2, accountId: '', debit: 0, credit: 0, description: '' },
  ]);
  const [totals, setTotals] = useState({ debit: 0, credit: 0 });
  
  useEffect(() => {
    setIsEditing(true);
    return () => {
        setIsEditing(false);
    };
  }, [setIsEditing]);

  useEffect(() => {
    if (entry) {
      setFormData({
        entryNumber: entry.entryNumber,
        date: entry.date,
        description: entry.description,
      });
      setLines(entry.lines.map(line => {
        let formAccountId = `account-${line.accountId}`;
        if (line.entityType && line.entityId) {
          formAccountId = `${line.entityType}-${line.entityId}`;
        }
        return { ...line, accountId: formAccountId };
      }));
    } else {
       const lastEntryNum = journalEntries.reduce((max, je) => {
            const num = parseInt(je.entryNumber.split('-')[1] || '0', 10);
            return num > max ? num : max;
        }, 0);
        const newEntryNumber = `JE-${(lastEntryNum + 1).toString().padStart(3, '0')}`;
        setFormData(prev => ({ ...prev, entryNumber: newEntryNumber }));
    }
  }, [entry, journalEntries]);
  
  useEffect(() => {
    const debitTotal = lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
    const creditTotal = lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
    setTotals({ debit: debitTotal, credit: creditTotal });
  }, [lines]);


  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLineChange = (id: string | number, field: keyof Omit<JournalEntryLine, 'id'>, value: string) => {
    setLines(prevLines => prevLines.map(line => {
        if (line.id === id) {
            const updatedLine = { ...line, [field]: value };
            if (field === 'debit' && parseFloat(value) > 0) updatedLine.credit = 0;
            if (field === 'credit' && parseFloat(value) > 0) updatedLine.debit = 0;
            return updatedLine;
        }
        return line;
    }));
  };

  const addLine = () => {
    setLines(prev => [...prev, { id: Date.now(), accountId: '', debit: 0, credit: 0, description: '' }]);
  };

  const removeLine = (id: string | number) => {
    setLines(prev => prev.filter(line => line.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totals.debit !== totals.credit || totals.debit === 0) {
        alert('يجب أن يكون القيد متوازنًا (إجمالي المدين = إجمالي الدائن) وألا تكون القيم صفرًا.');
        return;
    }
    const finalLines = lines
        .filter(line => line.accountId && (line.debit > 0 || line.credit > 0))
        .map(({ id, ...rest }) => ({ id: typeof id === 'number' ? `line-${Date.now()}-${id}` : id, ...rest }));

    if (finalLines.length < 2) {
        alert('يجب أن يحتوي القيد على طرفين على الأقل.');
        return;
    }

    const entryData = { ...formData, lines: finalLines };
    if (entry) {
        updateJournalEntry({ ...entry, ...entryData });
    } else {
        addJournalEntry(entryData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 py-10 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-4xl m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{entry ? `تعديل القيد #${entry.entryNumber}` : 'قيد يومية جديد'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="entryNumber" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">رقم القيد</label>
                    <input type="text" name="entryNumber" value={formData.entryNumber} onChange={handleFormChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" required />
                </div>
                 <div>
                    <label htmlFor="date" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">التاريخ</label>
                    <input type="date" name="date" value={formData.date} onChange={handleFormChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" required />
                </div>
                 <div className="md:col-span-3">
                    <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">الوصف العام</label>
                    <input type="text" name="description" value={formData.description} onChange={handleFormChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" required />
                </div>
            </div>
            {/* Lines */}
            <div className="pt-4">
                <div className="space-y-2">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-2 text-sm font-bold">
                        <div className="col-span-4">الحساب</div>
                        <div className="col-span-3">الوصف</div>
                        <div className="col-span-2">مدين</div>
                        <div className="col-span-2">دائن</div>
                        <div className="col-span-1"></div>
                    </div>
                    {lines.map((line) => (
                        <div key={line.id} className="grid grid-cols-12 gap-2 items-center">
                           <div className="col-span-4">
                                <SearchableSelect
                                    value={line.accountId}
                                    onChange={value => handleLineChange(line.id, 'accountId', value)}
                                    options={selectableAccounts}
                                    placeholder="-- اختر حساب --"
                                    required
                                />
                           </div>
                           <div className="col-span-3">
                                <input type="text" placeholder="وصف السطر" value={line.description} onChange={e => handleLineChange(line.id, 'description', e.target.value)} className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm" />
                           </div>
                           <div className="col-span-2">
                                <input type="number" step="any" value={line.debit} onChange={e => handleLineChange(line.id, 'debit', e.target.value)} className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm" />
                           </div>
                            <div className="col-span-2">
                                <input type="number" step="any" value={line.credit} onChange={e => handleLineChange(line.id, 'credit', e.target.value)} className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm" />
                           </div>
                           <div className="col-span-1 flex items-center h-full">
                             {lines.length > 2 && <button type="button" onClick={() => removeLine(line.id)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={18} /></button>}
                           </div>
                        </div>
                    ))}
                </div>
                <button type="button" onClick={addLine} className="mt-2 flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                    <Plus size={16} className="ml-1"/> إضافة سطر
                </button>
            </div>
            
            <div className="flex justify-end items-center pt-4 border-t-2 mt-4 dark:border-gray-600">
                <div className="grid grid-cols-2 gap-x-6 text-xl font-bold">
                    <div className="text-center">
                        <span className="text-sm font-normal block">إجمالي المدين</span>
                        <span>{formatCurrency(totals.debit)}</span>
                    </div>
                    <div className="text-center">
                        <span className="text-sm font-normal block">إجمالي الدائن</span>
                        <span>{formatCurrency(totals.credit)}</span>
                    </div>
                </div>
                 {totals.debit !== totals.credit && <div className="ml-4 text-red-500 font-bold">غير متوازن!</div>}
            </div>

            <div className="flex justify-end pt-6">
                <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 ml-2">إلغاء</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed" disabled={totals.debit !== totals.credit || totals.debit === 0}>حفظ القيد</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default JournalEntryForm;