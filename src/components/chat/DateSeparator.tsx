import { format, isToday, isYesterday, isSameDay } from 'date-fns';

interface DateSeparatorProps {
  date: Date;
}

const DateSeparator = ({ date }: DateSeparatorProps) => {
  const formatDate = (date: Date) => {
    if (isToday(date)) {
      return 'Today';
    }
    if (isYesterday(date)) {
      return 'Yesterday';
    }
    return format(date, 'MMMM d, yyyy');
  };

  return (
    <div className="flex items-center py-4">
      <div className="flex-1 border-t border-border"></div>
      <div className="mx-4 px-3 py-1 text-xs font-medium text-muted-foreground bg-muted rounded-full">
        {formatDate(date)}
      </div>
      <div className="flex-1 border-t border-border"></div>
    </div>
  );
};

export default DateSeparator;