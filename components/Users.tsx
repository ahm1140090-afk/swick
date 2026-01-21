import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { User, UserRole } from '../types';
import { Plus, Edit, Trash2, Shield, User as UserIcon, Eye } from 'lucide-react';
import UserForm from './UserForm';

const Users: React.FC = () => {
    const { users, deleteUser, currentUser, t } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const handleAddNew = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };
    
    const handleDelete = (userId: string) => {
        if (userId === currentUser?.id) {
            alert("لا يمكنك حذف حسابك الحالي.");
            return;
        }
        const userToDelete = users.find(u => u.id === userId);
        if (userToDelete?.role === UserRole.ADMIN && users.filter(u => u.role === UserRole.ADMIN).length <= 1) {
            alert("لا يمكنك حذف آخر مسؤول في النظام.");
            return;
        }
        if (window.confirm(`هل أنت متأكد من رغبتك في حذف المستخدم ${userToDelete?.username}؟`)) {
            deleteUser(userId);
        }
    }
    
    const getRoleInfo = (role: UserRole) => {
        switch(role) {
            case UserRole.ADMIN: return { text: 'مدير', icon: Shield, color: 'text-red-500' };
            case UserRole.ACCOUNTANT: return { text: 'محاسب', icon: UserIcon, color: 'text-blue-500' };
            case UserRole.VIEWER: return { text: 'مشاهد', icon: Eye, color: 'text-gray-500' };
        }
    }
    

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('users')}</h2>
                <button
                    onClick={handleAddNew}
                    className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={18} className="ml-2" />
                    إضافة مستخدم
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">اسم المستخدم</th>
                            <th scope="col" className="px-6 py-3">الصلاحية</th>
                            <th scope="col" className="px-6 py-3">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => {
                            const roleInfo = getRoleInfo(user.role);
                            return (
                                <tr key={user.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{user.username}</td>
                                    <td className="px-6 py-4">
                                        <span className={`flex items-center gap-2 ${roleInfo.color}`}>
                                            <roleInfo.icon size={16} />
                                            {roleInfo.text}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 flex space-x-2 space-x-reverse">
                                        <button onClick={() => handleEdit(user)} className="text-blue-500 hover:text-blue-700 p-1"><Edit size={18} /></button>
                                        <button onClick={() => handleDelete(user.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <UserForm
                    user={editingUser}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
};

export default Users;