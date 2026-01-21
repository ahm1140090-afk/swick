import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, X } from 'lucide-react';

export interface SearchableSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  required?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder = 'اختر...', disabled = false, id, name, required }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(() => options.find(option => option.value === value), [options, value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  const filteredOptions = useMemo(() => searchTerm
    ? options.filter(option =>
        !option.disabled && option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options, [options, searchTerm]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };
  
  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  }

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {/* Hidden input for form submission & validation */}
      <input type="hidden" id={id} name={name} value={value} required={required} />

      <div 
        className={`bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white flex items-center justify-between ${disabled ? 'bg-gray-200 dark:bg-gray-600 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') !disabled && setIsOpen(!isOpen); }}
      >
        <span className={selectedOption ? 'truncate' : 'text-gray-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center">
            {!required && value && (
                <button type="button" onClick={clearSelection} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 mr-2" aria-label="Clear selection">
                    <X size={16} />
                </button>
            )}
            <ChevronDown size={18} className={`transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg max-h-60 overflow-y-auto border dark:border-gray-600">
          <div className="p-2 sticky top-0 bg-white dark:bg-gray-800">
            <input
              type="text"
              placeholder="بحث..."
              className="w-full p-2 text-sm bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          <ul role="listbox">
            {filteredOptions.length > 0 ? filteredOptions.map(option => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                className={`p-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${option.value === value ? 'bg-blue-50 dark:bg-blue-900/50 font-semibold' : ''} ${option.disabled ? 'opacity-50 cursor-not-allowed text-gray-400' : ''}`}
                onClick={() => !option.disabled && handleSelect(option.value)}
              >
                {option.label}
              </li>
            )) : (
                <li className="p-2 text-sm text-gray-500 text-center">لا توجد نتائج</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
export default SearchableSelect;
