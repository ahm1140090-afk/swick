import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { CompanyInfo } from '../types';
import { Upload, Download, Save } from 'lucide-react';

const Settings: React.FC = () => {
    const { 
        companyInfo, updateCompanyInfo, language, currency, updateSettings, t, 
        exportData, importData, 
    } = useAppContext();
    const [companyFormData, setCompanyFormData] = useState<CompanyInfo>({ name: '', address: '', logo: '' });
    const [isSaved, setIsSaved] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (companyInfo) {
            setCompanyFormData(companyInfo);
        }
    }, [companyInfo]);

    const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCompanyFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCompanyFormData(prev => ({ ...prev, logo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCompanySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateCompanyInfo({
            name: companyFormData.name,
            address: companyFormData.address,
            logo: companyFormData.logo
        });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };
    
    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result;
                if (typeof content === 'string') {
                    importData(content);
                }
            };
            reader.readAsText(file);
        }
        // Reset file input to allow importing the same file again
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    
    const currencyOptions: { [key: string]: string } = {
        KWD: t('kwd'),
        USD: t('usd'),
        EGP: t('egp'),
        SAR: t('sar'),
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
             <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">{t('general_settings')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="language" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{t('language')}</label>
                        <select
                            id="language"
                            value={language}
                            onChange={(e) => updateSettings({ language: e.target.value as 'ar' | 'en' })}
                             className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600"
                        >
                            <option value="ar">{t('arabic')}</option>
                            <option value="en">{t('english')}</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="currency" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{t('currency')}</label>
                        <select
                            id="currency"
                            value={currency}
                            onChange={(e) => updateSettings({ currency: e.target.value })}
                             className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600"
                        >
                           {Object.entries(currencyOptions).map(([code, name]) => (
                               <option key={code} value={code}>{name} ({code})</option>
                           ))}
                        </select>
                    </div>
                </div>
             </div>

            <form onSubmit={handleCompanySubmit} className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">{t('company_settings')}</h2>

                <div>
                    <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">اسم الشركة</label>
                    <input
                        type="text"
                        name="name"
                        id="name"
                        value={companyFormData.name}
                        onChange={handleCompanyChange}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                        required
                    />
                </div>
                
                <div>
                    <label htmlFor="address" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">عنوان الشركة</label>
                    <textarea
                        name="address"
                        id="address"
                        value={companyFormData.address}
                        onChange={handleCompanyChange}
                        rows={3}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                        required
                    />
                </div>

                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">شعار الشركة</label>
                    <div className="mt-2 flex items-center gap-x-3">
                        {companyFormData.logo ? (
                            <img src={companyFormData.logo} alt="Company Logo Preview" className="h-20 w-20 object-contain rounded-md bg-gray-100 dark:bg-gray-700 p-1" />
                        ) : (
                            <div className="h-20 w-20 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center">
                                <span className="text-xs text-gray-500">لا يوجد شعار</span>
                            </div>
                        )}
                        <label htmlFor="logo-upload" className="cursor-pointer rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600">
                            <span>{companyFormData.logo ? 'تغيير الشعار' : 'رفع الشعار'}</span>
                            <input id="logo-upload" name="logo" type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg, image/gif" />
                        </label>
                    </div>
                     <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">مسموح بالملفات التالية: PNG, JPG, GIF بحجم أقصى 1MB.</p>
                </div>

                <div className="flex items-center justify-end pt-4">
                    {isSaved && <p className="text-green-500 ltr:mr-4 rtl:ml-4">تم حفظ التغييرات بنجاح!</p>}
                    <button
                        type="submit"
                        className="flex items-center bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Save size={18} className="ltr:mr-2 rtl:ml-2" />
                        {t('save_changes')}
                    </button>
                </div>
            </form>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md space-y-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">النسخ الاحتياطي المحلي (ملف)</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    استخدم هذه الأدوات لأخذ نسخة احتياطية من بياناتك على شكل ملف أو لنقلها إلى جهاز كمبيوتر آخر.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                    <button
                        onClick={exportData}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Download size={20} />
                        <span>تصدير البيانات</span>
                    </button>
                    <button
                        onClick={handleImportClick}
                        className="flex-1 flex items-center justify-center gap-2 bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600 transition-colors"
                    >
                        <Upload size={20} />
                        <span>استيراد البيانات</span>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileImport}
                        className="hidden"
                        accept=".json,application/json"
                    />
                </div>
                <p className="text-xs text-red-500 dark:text-red-400 text-center pt-2">
                    تحذير: سيؤدي الاستيراد إلى استبدال جميع بياناتك الحالية.
                </p>
            </div>
        </div>
    );
};

export default Settings;