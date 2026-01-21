
import React from 'react';
import { Check, Loader } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SaveState } from '../types';

const AutoSaveIndicator: React.FC = () => {
    const { saveState, language } = useAppContext();

    if (saveState === SaveState.IDLE) {
        return null;
    }

    const positionClass = language === 'ar' ? 'left-4' : 'right-4';

    let content;
    if (saveState === SaveState.SAVING) {
        content = (
            <>
                <Loader size={16} className="animate-spin text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">جاري الحفظ...</span>
            </>
        );
    } else { // SAVED
        content = (
            <>
                <Check size={16} className="text-green-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">تم الحفظ</span>
            </>
        );
    }

    return (
        <div 
            className={`fixed bottom-4 ${positionClass} z-50 flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 transition-opacity duration-300 animate-fade-in`}
            role="status"
            aria-live="polite"
        >
            {content}
        </div>
    );
};

export default AutoSaveIndicator;
