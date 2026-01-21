
import React, { Dispatch, SetStateAction } from 'react';
import { UploadCloud, File, Trash2, AlertTriangle } from 'lucide-react';
import { Attachment } from '../types';

interface AttachmentManagerProps {
  attachments: Attachment[];
  // FIX: Corrected the type of `setAttachments` to be a React state setter function.
  // This allows using the updater function form `(prev => ...)` which is safer against stale state
  // and resolves the TypeScript errors.
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
}

const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024; // 1MB
const TOTAL_STORAGE_WARNING_BYTES = 4 * 1024 * 1024; // 4MB

const AttachmentManager: React.FC<AttachmentManagerProps> = ({ attachments, setAttachments }) => {

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    // FIX: Use a for...of loop to correctly iterate over the FileList and get proper type inference for 'file'.
    // This resolves errors related to accessing properties like 'size', 'name', 'type' on an 'unknown' type.
    for (const file of e.target.files) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        alert(`الملف "${file.name}" كبير جدًا (أكثر من 1 ميجابايت). قد يؤثر على أداء التطبيق.`);
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAttachment: Attachment = {
          id: `att-${Date.now()}-${Math.random()}`,
          name: file.name,
          type: file.type,
          data: reader.result as string,
        };
        setAttachments(prev => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    }
    // Reset file input
    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const totalSize = attachments.reduce((sum, att) => sum + (att.data.length * 3 / 4), 0);

  return (
    <div className="pt-4">
      <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">المرفقات</label>
      <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 dark:border-gray-100/25 px-6 py-10">
        <div className="text-center">
          <UploadCloud className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
          <div className="mt-4 flex text-sm leading-6 text-gray-600 dark:text-gray-400">
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer rounded-md bg-white dark:bg-gray-800 font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 dark:ring-offset-gray-800 hover:text-blue-500"
            >
              <span>ارفع ملف</span>
              <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} />
            </label>
            <p className="pr-1">أو اسحب وأفلت</p>
          </div>
          <p className="text-xs leading-5 text-gray-600 dark:text-gray-400">PNG, JPG, PDF up to 1MB</p>
        </div>
      </div>
      {attachments.length > 0 && (
        <div className="mt-4 space-y-2">
          {attachments.map(att => (
            <div key={att.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
              <div className="flex items-center gap-3">
                <File size={18} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate" title={att.name}>{att.name}</span>
              </div>
              <button type="button" onClick={() => removeAttachment(att.id)} className="text-red-500 hover:text-red-700">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
      {totalSize > TOTAL_STORAGE_WARNING_BYTES && (
          <div className="mt-4 flex items-center gap-2 p-2 text-xs text-yellow-800 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-md">
              <AlertTriangle size={16} />
              <span>تحذير: حجم المرفقات الإجمالي كبير. قد يؤدي ذلك إلى إبطاء التطبيق أو فقدان البيانات حيث أن التخزين محلي في المتصفح.</span>
          </div>
      )}
    </div>
  );
};

export default AttachmentManager;
