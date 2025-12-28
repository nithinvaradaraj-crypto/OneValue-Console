import { ExternalLink, MessageSquare, Mail, FileText, Link2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface EvidenceLinkProps {
  link: string;
  source?: 'GoogleChat' | 'Gmail' | 'Drive' | 'Calendar' | string;
  variant?: 'inline' | 'button' | 'icon';
  label?: string;
  className?: string;
  showTooltip?: boolean;
}

function getSourceIcon(source?: string) {
  switch (source?.toLowerCase()) {
    case 'googlechat':
    case 'chat':
      return MessageSquare;
    case 'gmail':
    case 'email':
      return Mail;
    case 'drive':
    case 'document':
      return FileText;
    case 'calendar':
      return Calendar;
    default:
      return Link2;
  }
}

function getSourceLabel(source?: string) {
  switch (source?.toLowerCase()) {
    case 'googlechat':
    case 'chat':
      return 'View in Google Chat';
    case 'gmail':
    case 'email':
      return 'View Email';
    case 'drive':
    case 'document':
      return 'View Document';
    case 'calendar':
      return 'View Calendar Event';
    default:
      return 'View Source';
  }
}

function formatEvidenceUrl(link: string): string {
  // Handle Google Chat room/message links
  if (link.includes('chat.google.com/room/') || link.includes('spaces/')) {
    // Already a valid Google Chat link
    return link;
  }

  // Handle Gmail message links
  if (link.includes('mail.google.com') || link.includes('/mail/')) {
    return link;
  }

  // Handle Google Drive links
  if (link.includes('drive.google.com') || link.includes('/file/d/')) {
    return link;
  }

  // If it's a relative path or ID, try to construct a proper URL
  if (link.startsWith('spaces/') || link.startsWith('rooms/')) {
    // Construct Google Chat link
    const parts = link.split('/');
    const spaceId = parts[1];
    const messageId = parts.length > 2 ? parts[3] : '';
    return `https://chat.google.com/room/${spaceId}${messageId ? `/${messageId}` : ''}`;
  }

  // Return as-is if already a full URL
  if (link.startsWith('http://') || link.startsWith('https://')) {
    return link;
  }

  // Default: assume it's a relative URL
  return `https://${link}`;
}

export function EvidenceLink({
  link,
  source,
  variant = 'inline',
  label,
  className,
  showTooltip = true,
}: EvidenceLinkProps) {
  const Icon = getSourceIcon(source);
  const defaultLabel = label || getSourceLabel(source);
  const formattedUrl = formatEvidenceUrl(link);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(formattedUrl, '_blank', 'noopener,noreferrer');
  };

  if (variant === 'icon') {
    const iconButton = (
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-8 w-8', className)}
        onClick={handleClick}
      >
        <Icon className="h-4 w-4" />
      </Button>
    );

    if (showTooltip) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {iconButton}
            </TooltipTrigger>
            <TooltipContent>
              <p>{defaultLabel}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return iconButton;
  }

  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn('gap-2', className)}
        onClick={handleClick}
      >
        <Icon className="h-4 w-4" />
        {defaultLabel}
        <ExternalLink className="h-3 w-3 opacity-60" />
      </Button>
    );
  }

  // Default: inline variant
  return (
    <a
      href={formattedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-1 text-xs',
        'text-primary-600 dark:text-primary-400',
        'hover:underline cursor-pointer',
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <Icon className="h-3 w-3" />
      {defaultLabel}
      <ExternalLink className="h-3 w-3 opacity-60" />
    </a>
  );
}

// Badge-style evidence link for cards
export function EvidenceBadge({
  link,
  source,
  className,
}: {
  link: string;
  source?: string;
  className?: string;
}) {
  const Icon = getSourceIcon(source);
  const formattedUrl = formatEvidenceUrl(link);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={formattedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex items-center gap-1.5 px-2 py-1 rounded-md',
              'bg-primary-500/10 text-primary-600 dark:text-primary-400',
              'text-xs font-medium',
              'hover:bg-primary-500/20 transition-colors',
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <Icon className="h-3 w-3" />
            Source
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getSourceLabel(source)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
