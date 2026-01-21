import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { User, UserRole } from '../types';
import { X } from 'lucide-react';

interface UserFormProps {
  user: User | null;
  onClose: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ user, onClose }) => {
  const { addUser, updateUser, users } = useAppContext();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: UserRole.VIEWER,
  });
  const [error, setError] = useState('');

  const isEditing = !!user;

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        password: '', // Password is not pre-filled for security
        confirmPassword: '',
        role: user.role,
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isEditing && users.some(u => u.username === formData.username)) {
        setError('اسم المستخدم هذا موجود بالفعل.');
        return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.');
      return;
    }
    
    if (!isEditing && !formData.password) {
        setError('كلمة المرور مطلوبة للمستخدم الجديد.');
        return;
    }

    const userData = {
        username: formData.username,
        // Only update password if a new one is provided
        password: formData.password || user?.password,
        role: formData.role,
    };
    
    if (!userData.password) { // Should only happen if editing and no new password provided, which is fine, but TS needs check
        setError("حدث خطأ ما بخصوص كلمة المرور.");
        return;
    }


    if (isEditing) {
      updateUser({ ...user, ...userData });
    } else {
      addUser(userData);
    }
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{user ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">اسم المستخدم</label>
            <input
              type="text"
              name="username"
              id="username"
              value={formData.username}
              onChange={handleChange}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600"
              required
              disabled={isEditing}
            />
          </div>
           <div>
            <label htmlFor="password"className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                كلمة المرور {isEditing && '(اتركه فارغاً لعدم التغيير)'}
            </label>
            <input
              type="password"
              name="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600"
              required={!isEditing}
            />
          </div>
          <div>
            <label htmlFor="confirmPassword"className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                تأكيد كلمة المرور
            </label>
            <input
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600"
              required={!isEditing || !!formData.password}
            />
          </div>
          <div>
            <label htmlFor="role" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">الصلاحية</label>
            <select
              name="role"
              id="role"
              value={formData.role}
              onChange={handleChange}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600"
            >
              <option value={UserRole.ADMIN}>مدير</option>
              <option value={UserRole.ACCOUNTANT}>محاسب</option>
              <option value={UserRole.VIEWER}>مشاهد</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <div className="flex justify-end pt-2">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 ml-2">إلغاء</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">حفظ</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;