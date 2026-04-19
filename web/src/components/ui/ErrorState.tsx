'use client';

import { WifiOff, AlertTriangle, FileQuestion, ServerCrash, RefreshCw } from 'lucide-react';
import { Button } from './Button';

type ErrorType = 'network' | 'server' | 'not-found' | 'generic';

interface ErrorStateProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

const errorConfigs: Record<ErrorType, { icon: typeof WifiOff; title: string; message: string; bg: string }> = {
  network: {
    icon: WifiOff,
    title: 'No internet connection',
    message: 'Check your connection and try again. Your data is safe.',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
  },
  server: {
    icon: ServerCrash,
    title: 'Server error',
    message: 'Our servers are having a moment. Please try again in a bit.',
    bg: 'bg-red-50 dark:bg-red-950/30',
  },
  'not-found': {
    icon: FileQuestion,
    title: 'Not found',
    message: 'The content you\'re looking for doesn\'t exist or has been removed.',
    bg: 'bg-warm-100 dark:bg-warm-800',
  },
  generic: {
    icon: AlertTriangle,
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again.',
    bg: 'bg-yellow-50 dark:bg-yellow-950/30',
  },
};

export function ErrorState({ type = 'generic', title, message, onRetry, className }: ErrorStateProps) {
  const config = errorConfigs[type];
  const Icon = config.icon;

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className || ''}`}>
      <div className={`w-20 h-20 rounded-full ${config.bg} flex items-center justify-center mb-5`}>
        <Icon className="w-10 h-10 text-warm-400 dark:text-warm-500" />
      </div>
      <h3 className="text-lg font-bold text-warm-900 dark:text-warm-100 mb-1.5">
        {title || config.title}
      </h3>
      <p className="text-sm text-warm-500 max-w-xs mb-6 leading-relaxed">
        {message || config.message}
      </p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} icon={<RefreshCw className="w-4 h-4" />}>
          Try again
        </Button>
      )}
    </div>
  );
}
