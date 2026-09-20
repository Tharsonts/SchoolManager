import { Badge } from "@/components/ui/badge";

interface UserStatusProps {
  status: 'online' | 'offline' | 'ausente';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function UserStatus({ status, size = 'md', showText = false }: UserStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return {
          color: 'bg-green-500',
          textColor: 'text-green-700',
          bgColor: 'bg-green-100',
          text: 'Online'
        };
      case 'ausente':
        return {
          color: 'bg-yellow-500',
          textColor: 'text-yellow-700',
          bgColor: 'bg-yellow-100',
          text: 'Ausente'
        };
      case 'offline':
        return {
          color: 'bg-gray-400',
          textColor: 'text-gray-600',
          bgColor: 'bg-gray-100',
          text: 'Offline'
        };
      default:
        return {
          color: 'bg-gray-400',
          textColor: 'text-gray-600',
          bgColor: 'bg-gray-100',
          text: 'Offline'
        };
    }
  };

  const config = getStatusConfig();
  
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`${sizeClasses[size]} ${config.color} rounded-full`} />
      {showText && (
        <Badge 
          variant="secondary" 
          className={`${config.bgColor} ${config.textColor} border-0 text-xs font-medium`}
        >
          {config.text}
        </Badge>
      )}
    </div>
  );
}


