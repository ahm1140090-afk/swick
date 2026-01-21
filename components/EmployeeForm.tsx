import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Employee, AccountType } from '../types';
import { X } from 'lucide-react';
import SearchableSelect from './SearchableSelect';

interface EmployeeFormProps {
  employee: Employee | null;
  onClose: () => void;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ employee, onClose }) => {
  const { addEmployee, updateEmployee, employees, accounts, setIsEditing, t } = useAppContext();
  const [formData, setFormData] = useState({
    employeeNumber: '',
    name: '',
    position: '',
    paymentType: 'Salaried' as 'Salaried' | 'Hourly',
    baseSalary: '',
    hourlyRate: '',
    email: '',
    phone: '',
    address: '',
    hireDate: '',
    terminationDate: '',
    bankAccountId: '',
    iban: '',
  });
  
  const assetAccounts = useMemo(() => accounts.filter(a => a.type === AccountType.ASSET && a.parentId !== null).sort((a,b) => (a.accountNumber || '').localeCompare(b.accountNumber || '', 'ar-EG-u-kn-true'))
    .map(acc => ({ value: acc.id, label: `${acc.accountNumber ? `(${acc.accountNumber}) ` : ''}${acc.name}` })), [accounts]);

  useEffect(() => {
    setIsEditing(true);
    return () => {
        setIsEditing(false);
    };
  }, [setIsEditing]);

  useEffect(() => {
    if (employee) {
      setFormData({
        employeeNumber: employee.employeeNumber,
        name: employee.name,
        position: employee.position,
        paymentType: employee.paymentType || 'Salaried',
        baseSalary: employee.baseSalary.toString(),
        hourlyRate: employee.hourlyRate.toString(),
        email: employee.email,
        phone: employee.phone,
        address: employee.address || '',
        hireDate: employee.hireDate || '',
        terminationDate: employee.terminationDate || '',
        bankAccountId: employee.bankAccountId || '',
        iban: employee.iban || '',
      });
    } else {
        const lastEmployeeNum = employees.reduce((max, e) => {
            const num = parseInt(e.employeeNumber?.split('-')[1] || '0', 10);
            return num > max ? num : max;
        }, 0);
        const newEmployeeNumber = `EMP-${(lastEmployeeNum + 1).toString().padStart(3, '0')}`;
        setFormData(prev => ({ ...prev, employeeNumber: newEmployeeNumber }));
    }
  }, [employee, employees]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const employeeData = {
        ...formData,
        baseSalary: parseFloat(formData.baseSalary) || 0,
        hourlyRate: parseFloat(formData.hourlyRate) || 0,
        address: formData.address || undefined,
        hireDate: formData.hireDate || undefined,
        terminationDate: formData.terminationDate || undefined,
        bankAccountId: formData.bankAccountId || undefined,
        iban: formData.iban || undefined,
    };
    if (employee) {
      updateEmployee({ ...employee, ...employeeData });
    } else {
      addEmployee(employeeData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 py-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{employee ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                    <label htmlFor="employeeNumber" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">رقم الموظف</label>
                    <input type="text" name="employeeNumber" value={formData.employeeNumber} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" required />
                </div>
                <div className="sm:col-span-2">
                    <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">الاسم الكامل</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" required />
                </div>
            </div>
            <div>
                <label htmlFor="position" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">المنصب الوظيفي</label>
                <input type="text" name="position" value={formData.position} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" required />
            </div>

            <fieldset className="border p-4 rounded-lg dark:border-gray-600">
                <legend className="px-2 font-semibold">{t('paymentType')}</legend>
                <div className="pt-2 space-y-4">
                    <div className="flex items-center gap-4">
                        <label className="flex items-center">
                            <input type="radio" name="paymentType" value="Salaried" checked={formData.paymentType === 'Salaried'} onChange={(e) => setFormData(p => ({...p, paymentType: e.target.value as any}))} className="w-4 h-4 text-blue-600" />
                            <span className="mr-2 text-sm">{t('salaried')}</span>
                        </label>
                         <label className="flex items-center">
                            <input type="radio" name="paymentType" value="Hourly" checked={formData.paymentType === 'Hourly'} onChange={(e) => setFormData(p => ({...p, paymentType: e.target.value as any}))} className="w-4 h-4 text-blue-600" />
                            <span className="mr-2 text-sm">{t('hourly')}</span>
                        </label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="baseSalary" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{t('baseSalary')}</label>
                            <input type="number" step="any" name="baseSalary" value={formData.baseSalary} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" required={formData.paymentType === 'Salaried'} disabled={formData.paymentType === 'Hourly'} />
                        </div>
                         <div>
                            <label htmlFor="hourlyRate" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{t('hourlyRate')}</label>
                            <input type="number" step="any" name="hourlyRate" value={formData.hourlyRate} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" required />
                        </div>
                    </div>
                </div>
            </fieldset>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="bankAccountId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">حساب دفع الراتب (اختياري)</label>
                    <SearchableSelect
                        name="bankAccountId"
                        id="bankAccountId"
                        value={formData.bankAccountId}
                        onChange={(value) => setFormData(prev => ({ ...prev, bankAccountId: value }))}
                        options={assetAccounts}
                        placeholder="-- اختر حساب --"
                        required={false}
                    />
                </div>
                 <div>
                    <label htmlFor="iban" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">الآيبان (اختياري)</label>
                    <input type="text" name="iban" id="iban" value={formData.iban} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" />
                </div>
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="hireDate" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">تاريخ التعيين</label>
                    <input type="date" name="hireDate" value={formData.hireDate} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div>
                    <label htmlFor="terminationDate" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">تاريخ إنهاء الخدمة</label>
                    <input type="date" name="terminationDate" value={formData.terminationDate} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">البريد الإلكتروني</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div>
                    <label htmlFor="phone" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">الهاتف</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" />
                </div>
            </div>
             <div>
                <label htmlFor="address" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">العنوان (اختياري)</label>
                <textarea name="address" value={formData.address} onChange={handleChange} rows={2} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600"></textarea>
            </div>
            <div className="flex justify-end pt-2">
                <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 ltr:mr-2 rtl:ml-2">إلغاء</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">حفظ</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeForm;
