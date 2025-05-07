import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';

interface UnreadMessagesIndicatorProps {
  className?: string;
  showEmpty?: boolean; // Option to show the badge even when count is 0
}

export function UnreadMessagesIndicator({ className, showEmpty = false }: UnreadMessagesIndicatorProps) {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['/api/messages/unread/count'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/messages/unread/count');
      return response.json();
    },
    enabled: !!user && user.role !== 'admin', // Don't fetch for admin users
    refetchInterval: 10000, // Refetch more frequently (every 10 seconds)
    staleTime: 5000 // Consider data stale sooner
  });

  // Don't show anything while loading or for admin users
  if (isLoading || !user || user.role === 'admin') {
    return null;
  }

  // Don't show anything if there are no unread messages and showEmpty is false
  if (!data || (data.count === 0 && !showEmpty)) {
    return null;
  }

  return (
    <Badge 
      variant="destructive" 
      className={className}
    >
      {data.count > 0 ? data.count : ''}
    </Badge>
  );
}