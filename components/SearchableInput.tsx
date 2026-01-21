import React, { useState, useEffect, useRef } from 'react';

export interface SearchableInputOption {
  value: string;
  label: string;
}

interface SearchableInputProps {
  options: SearchableInputOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
}

const SearchableInput: React.FC<SearchableInputProps> = (props) => {
  const { options, value, onChange, placeholder, disabled, readOnly, ...rest } = props;
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);
  
  const filteredOptions = value
    ? options.filter(option =>
        option.label.toLowerCase().includes(value.toLowerCase())
      )
    : [];

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => !readOnly && setIsOpen(true)}
        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600"
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        {...rest}
      />
      {isOpen && !readOnly && value && filteredOptions.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg max-h-60 overflow-y-auto border dark:border-gray-600">
          <ul>
            {filteredOptions.map(option => (
              <li
                key={option.value}
                className="p-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSelect(option.label)}
              >
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchableInput;
