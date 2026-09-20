import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'default' | 'purple' | 'blue' | 'green';
  size?: 'sm' | 'md' | 'lg';
}

const CreateButton: React.FC<CreateButtonProps> = ({
  onClick,
  children,
  className,
  disabled = false,
  loading = false,
  variant = 'purple',
  size = 'md'
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'purple':
        return 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600';
      case 'blue':
        return 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600';
      case 'green':
        return 'bg-green-600 hover:bg-green-700 text-white border-green-600';
      default:
        return 'bg-gray-900 hover:bg-gray-800 text-white border-gray-900';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-8 px-3 text-sm';
      case 'lg':
        return 'h-12 px-6 text-base';
      default:
        return 'h-10 px-4 text-sm';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'h-3 w-3';
      case 'lg':
        return 'h-5 w-5';
      default:
        return 'h-4 w-4';
    }
  };

  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'font-medium transition-all duration-200 shadow-sm',
        'focus:ring-2 focus:ring-offset-2 focus:ring-purple-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        getVariantClasses(),
        getSizeClasses(),
        className
      )}
    >
      {loading ? (
        <div className="flex items-center">
          <div className={cn('animate-spin rounded-full border-2 border-white border-t-transparent mr-2', getIconSize())} />
          {children}
        </div>
      ) : (
        <div className="flex items-center">
          <Plus className={cn('mr-2', getIconSize())} />
          {children}
        </div>
      )}
    </Button>
  );
};

export default CreateButton;