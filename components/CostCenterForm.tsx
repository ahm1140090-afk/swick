
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { CostCenter } from '../types';
import { X } from 'lucide-react';

interface CostCenterFormProps {
  costCenter: CostCenter | null;
  onClose: () => void;
}

const CostCenterForm: React.FC<CostCenterFormProps> = ({ costCenter, onClose }) => {
  const { addCostCenter, updateCostCenter, setIsEditing } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    code: '',
  });

  useEffect(() => {
    setIsEditing(true);
    return () => {
        setIsEditing(false);
    };
  }, [setIsEditing]);

  useEffect(() => {
    if (costCenter) {
      setFormData({
        name: costCenter.name,
        code: costCenter.code || '',
      });
    }
  }, [costCenter]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
        alert("اسم مركز التكلفة مطلوب.");
        return;
    }

    if (costCenter) {
      updateCostCenter({ ...costCenter, ...formData });
    } else {
      addCostCenter(formData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{costCenter ? 'تعديل مركز التكلفة' : 'إضافة مركز تكلفة جديد'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">الاسم</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" required />
          </div>
          <div>
            <label htmlFor="code" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">الكود (اختياري)</label>
            <input type="text" name="code" value={formData.code} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" />
          </div>
          <div className="flex justify-end pt-2">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 ml-2">إلغاء</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">حفظ</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CostCenterForm;
