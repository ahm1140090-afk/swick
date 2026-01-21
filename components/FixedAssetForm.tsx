import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { FixedAsset, AccountType } from '../types';
import { X } from 'lucide-react';
import SearchableSelect from './SearchableSelect';

interface FixedAssetFormProps {
  asset: FixedAsset | null;
  onClose: () => void;
}

const FixedAssetForm: React.FC<FixedAssetFormProps> = ({ asset, onClose }) => {
  const { addFixedAsset, updateFixedAsset, accounts, getSelectableAccountList, t, setIsEditing } = useAppContext();
  
  const [formData, setFormData] = useState({
    name: '',
    acquisitionDate: new Date().toISOString().split('T')[0],
    acquisitionCost: '',
    usefulLifeYears: '',
    salvageValue: '0',
    assetAccountId: '',
    accumulatedDepreciationAccountId: '',
    depreciationExpenseAccountId: '',
    purchaseAccountId: '',
  });

  useEffect(() => {
    setIsEditing(true);
    return () => {
        setIsEditing(false);
    };
  }, [setIsEditing]);

  const { assetAccounts, accumDepAccounts, depExpAccounts, purchaseFromAccounts } = useMemo(() => {
    const allAccounts = getSelectableAccountList();
    return {
        assetAccounts: accounts.filter(a => a.parentId === 'asset-fixed').map(a => ({ value: a.id, label: a.name })),
        accumDepAccounts: accounts.filter(a => a.parentId === 'asset-accum-dep').map(a => ({ value: a.id, label: a.name })),
        depExpAccounts: accounts.filter(a => a.parentId === 'exp-dep').map(a => ({ value: a.id, label: a.name })),
        purchaseFromAccounts: allAccounts.filter(a => (a.type === AccountType.ASSET && !a.disabled) || a.value.startsWith('supplier-')),
    }
  }, [accounts, getSelectableAccountList]);


  useEffect(() => {
    if (asset) {
      setFormData({
        ...asset,
        acquisitionCost: asset.acquisitionCost.toString(),
        usefulLifeYears: asset.usefulLifeYears.toString(),
        salvageValue: asset.salvageValue.toString(),
        purchaseAccountId: '', // Cannot edit purchase transaction from here
      });
    } else {
        // Pre-fill with defaults if available
        setFormData(prev => ({
            ...prev,
            assetAccountId: assetAccounts.length > 0 ? assetAccounts[0].value : '',
            accumulatedDepreciationAccountId: accumDepAccounts.length > 0 ? accumDepAccounts[0].value : '',
            depreciationExpenseAccountId: depExpAccounts.length > 0 ? depExpAccounts[0].value : '',
            purchaseAccountId: purchaseFromAccounts.find(a => a.value.includes('cash'))?.value || (purchaseFromAccounts.length > 0 ? purchaseFromAccounts[0].value : ''),
        }))
    }
  }, [asset, assetAccounts, accumDepAccounts, depExpAccounts, purchaseFromAccounts]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const assetData = {
      name: formData.name,
      acquisitionDate: formData.acquisitionDate,
      acquisitionCost: parseFloat(formData.acquisitionCost),
      usefulLifeYears: parseInt(formData.usefulLifeYears, 10),
      salvageValue: parseFloat(formData.salvageValue),
      assetAccountId: formData.assetAccountId,
      accumulatedDepreciationAccountId: formData.accumulatedDepreciationAccountId,
      depreciationExpenseAccountId: formData.depreciationExpenseAccountId,
    };

    if (asset) {
      updateFixedAsset({ ...asset, ...assetData });
    } else {
      addFixedAsset({ ...assetData, purchaseAccountId: formData.purchaseAccountId });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 py-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{asset ? t('edit_fixed_asset') : t('add_fixed_asset')}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">اسم الأصل</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="acquisitionDate" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{t('acquisition_date')}</label>
                    <input type="date" name="acquisitionDate" value={formData.acquisitionDate} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" required disabled={!!asset} />
                </div>
                <div>
                    <label htmlFor="acquisitionCost" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{t('acquisition_cost')}</label>
                    <input type="number" step="any" name="acquisitionCost" value={formData.acquisitionCost} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" required disabled={!!asset} />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="usefulLifeYears" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{t('useful_life_years')}</label>
                    <input type="number" name="usefulLifeYears" value={formData.usefulLifeYears} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" required />
                </div>
                <div>
                    <label htmlFor="salvageValue" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{t('salvage_value')}</label>
                    <input type="number" step="any" name="salvageValue" value={formData.salvageValue} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" required />
                </div>
            </div>
            
            <fieldset className="border p-4 rounded-lg dark:border-gray-600">
                <legend className="px-2 font-semibold">الحسابات المرتبطة</legend>
                <div className="space-y-4 pt-2">
                    {!asset && (
                        <div>
                             <label htmlFor="purchaseAccountId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{t('purchased_from_account')}</label>
                            <SearchableSelect options={purchaseFromAccounts} value={formData.purchaseAccountId} onChange={(v) => setFormData(p => ({...p, purchaseAccountId: v}))} required />
                        </div>
                    )}
                    <div>
                        <label htmlFor="assetAccountId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{t('asset_account')}</label>
                        <SearchableSelect options={assetAccounts} value={formData.assetAccountId} onChange={(v) => setFormData(p => ({...p, assetAccountId: v}))} required />
                    </div>
                    <div>
                        <label htmlFor="accumulatedDepreciationAccountId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{t('accumulated_depreciation_account')}</label>
                        <SearchableSelect options={accumDepAccounts} value={formData.accumulatedDepreciationAccountId} onChange={(v) => setFormData(p => ({...p, accumulatedDepreciationAccountId: v}))} required />
                    </div>
                    <div>
                        <label htmlFor="depreciationExpenseAccountId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{t('depreciation_expense_account')}</label>
                        <SearchableSelect options={depExpAccounts} value={formData.depreciationExpenseAccountId} onChange={(v) => setFormData(p => ({...p, depreciationExpenseAccountId: v}))} required />
                    </div>
                </div>
            </fieldset>

            <div className="flex justify-end pt-2">
                <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 ml-2">إلغاء</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">{t('save_changes')}</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default FixedAssetForm;