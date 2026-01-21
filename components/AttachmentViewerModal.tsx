import React from 'react';
import { X, File, Download } from 'lucide-react';
import { Attachment } from '../types';

interface AttachmentViewerModalProps {
  attachments: Attachment[];
  onClose: () => void;
}

const AttachmentViewerModal: React.FC<AttachmentViewerModalProps> = ({ attachments, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg m-4 relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">المرفقات</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X size={24} />
          </button>
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {attachments.map(att => (
            <div key={att.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
              <div className="flex items-center gap-3 overflow-hidden">
                <File size={20} className="text-gray-500 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate" title={att.name}>{att.name}</span>
              </div>
              <a
                href={att.data}
                download={att.name}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex-shrink-0"
              >
                <Download size={18} />
                تحميل
              </a>
            </div>
          ))}
          {attachments.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">لا توجد مرفقات لهذا السجل.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttachmentViewerModal;
