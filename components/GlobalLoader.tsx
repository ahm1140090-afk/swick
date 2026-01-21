import React from 'react';
import { Loader } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const GlobalLoader: React.FC = () => {
    const { isLoading, loadingMessage, language } = useAppContext();

    if (!isLoading) {
        return null;
    }

    const positionClass = language === 'ar' ? 'right-4' : 'left-4';

    return (
        <div 
            className={`fixed bottom-4 ${positionClass} z-50 flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 transition-opacity duration-300 animate-fade-in`}
            role="status"
            aria-live="polite"
        >
            <Loader size={20} className="animate-spin text-blue-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{loadingMessage}</span>
        </div>
    );
};

export default GlobalLoader;
