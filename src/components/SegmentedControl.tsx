import React, { FC } from 'react';
import { ChevronDownIcon } from '@/components/Icons';
import { DropdownMenu, DropdownMenuItem } from '@/components/Dropdown';

// --- Interface Definitions ---
interface TabOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  tooltip?: string;
}

interface TabsProps {
  options: TabOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  tabButtonClassName?: string;
  activeTabClassName?: string;
  inactiveTabClassName?: string;
}

// --- Tabs Component ---
export const Tabs: FC<TabsProps> = ({ 
  options, 
  value, 
  onChange, 
  className, 
  tabButtonClassName, 
  activeTabClassName = 'bg-tab-active text-text-primary shadow-sm',
  inactiveTabClassName = 'text-text-secondary hover:bg-bg-active hover:text-text-primary'
}) => {
  return (
    <div className={`bg-bg-secondary border border-border-primary rounded-lg p-1 flex items-center gap-1 overflow-x-auto h-10 ${className || ''}`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
     {options.map(option => {
        const buttonContent = (
          <div className='flex items-center justify-center space-x-2'>
            {option.icon}
            {option.label && <span className="whitespace-nowrap">{option.label}</span>}
          </div>
        );

        const buttonClasses = `grow shrink-0 px-3 text-sm rounded-md flex items-center justify-center focus:outline-none h-full ${tabButtonClassName || ''} ${
            value === option.value
                ? activeTabClassName
                : inactiveTabClassName
        }`;
        
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={buttonClasses}
            title={option.tooltip}
          >
            {buttonContent}
          </button>
        );
      })}
    </div>
  );
};

// --- Dropdown Component ---
interface DropdownProps extends Omit<TabsProps, 'activeTabClassName' | 'inactiveTabClassName'> {
  label: string;
}

export const Dropdown: React.FC<DropdownProps> = ({ label, options, value, onChange, className }) => {
  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className={className}>
      <DropdownMenu
        menuClassName="w-full"
        trigger={(isOpen) => (
          <button
            type="button"
            className="w-full h-10 text-sm font-medium text-text-primary bg-bg-secondary border border-border-primary rounded-lg shadow-sm hover:bg-bg-active focus:outline-none flex items-center pl-4 pr-3 justify-between"
          >
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              {selectedOption.icon && (
                <span className="text-base flex-shrink-0">
                  {selectedOption.icon}
                </span>
              )}
              <span className="truncate">{selectedOption.label}</span>
            </div>
            
            <ChevronDownIcon 
              className={`h-4 w-4 text-current flex-shrink-0 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`} 
            />
          </button>
        )}
      >
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            as="button"
            onClick={() => onChange(option.value)}
            isActive={value === option.value}
            className="flex items-center gap-2"
          >
            {option.icon && (
              <span className="flex-shrink-0 text-base">{option.icon}</span>
            )}
            <span className="truncate">{option.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenu>
    </div>
  );
};