
import React from 'react';
import { X, Smartphone } from 'lucide-react';

interface PwaInstallModalProps {
  onClose: () => void;
}

const PwaInstallModal: React.FC<PwaInstallModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg m-4 relative">
        <button onClick={onClose} className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <X size={24} />
        </button>
        <div className="text-center">
          <Smartphone size={48} className="mx-auto text-blue-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">تثبيت البرنامج على سطح المكتب</h2>
        </div>
        
        <div className="mb-6">
          <p className="text-center text-gray-600 dark:text-gray-300 mb-4">
            شاهد الفيديو التالي لمعرفة كيفية تثبيت البرنامج مباشرة من المتصفح (مثل جوجل كروم أو مايكروسوفت إيدج).
          </p>
          <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            {/* Animated SVG */}
            <svg viewBox="0 0 400 150" xmlns="http://www.w3.org/2000/svg" className="w-full">
              {/* Browser window */}
              <rect x="1" y="1" width="398" height="148" rx="8" className="fill-gray-200 dark:fill-gray-700 stroke-gray-300 dark:stroke-gray-600" strokeWidth="2" />
              <rect x="1" y="1" width="398" height="30" rx="8" ry="8" className="fill-gray-300 dark:fill-gray-600" />
              <circle cx="15" cy="15" r="5" fill="#ef4444" />
              <circle cx="30" cy="15" r="5" fill="#fbb_f2_4" />
              <circle cx="45" cy="15" r="5" fill="#22c55e" />

              {/* Address bar */}
              <rect x="60" y="8" width="330" height="16" rx="8" className="fill-gray-100 dark:fill-gray-800" />
              
              {/* Install Icon with glow */}
              <g>
                <rect x="365" y="9" width="18" height="14" rx="2" fill="#3b82f6" />
                <path d="M 374 12 v 8 M 370 16 h 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                 <animateTransform attributeName="transform" type="scale" from="1 1" to="1.2 1.2" begin="1s;5s" dur="0.5s" repeatCount="2" additive="sum" fill="freeze" transform-origin="374 16"/>
              </g>

              {/* Cursor */}
              <g>
                  <path d="M100 80 l 0 16 l 4 4 l 6 -12 l -10 -8 Z" className="fill-gray-800 dark:fill-gray-300" />
                  <animateMotion path="M100 80 C 200 60, 300 60, 374 16" dur="2s" begin="0.5s" fill="freeze" />
                  <animate attributeName="opacity" from="1" to="0" begin="2.5s" dur="0.1s" fill="freeze" />
              </g>

              {/* Install Popup */}
              <g opacity="0">
                  <rect x="250" y="35" width="140" height="60" rx="5" className="fill-white dark:fill-gray-800 stroke-gray-300 dark:stroke-gray-600" />
                  <text x="320" y="55" textAnchor="middle" fontSize="10" className="fill-gray-900 dark:fill-gray-200">هل تريد تثبيت التطبيق؟</text>
                  <rect x="285" y="65" width="70" height="20" rx="3" fill="#3b82f6" />
                  <text x="320" y="78" textAnchor="middle" fontSize="10" fill="white">تثبيت</text>
                   <animate attributeName="opacity" from="0" to="1" begin="2.5s" dur="0.3s" fill="freeze" />
              </g>

            </svg>
          </div>
        </div>

        <div>
          <h3 className="font-bold mb-2 text-gray-800 dark:text-white">الخطوات:</h3>
          <ol className="list-decimal list-inside space-y-1 text-gray-600 dark:text-gray-300">
            <li>ابحث عن أيقونة التثبيت (مثل 📥 أو ➕) في شريط العنوان أعلى المتصفح.</li>
            <li>اضغط على الأيقونة.</li>
            <li>من النافذة التي ستظهر، اضغط على زر "تثبيت".</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default PwaInstallModal;
