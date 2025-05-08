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
      try {
        const response = await apiRequest('GET', '/api/messages/unread/count');
        const data = await response.json();
        console.log('Unread message count:', data);
        return data;
      } catch (error) {
        console.error('Error fetching unread messages count:', error);
        return { count: 0 }; // Default to no messages on error
      }
    },
    enabled: !!user && user.role !== 'admin', // Don't fetch for admin users
    refetchInterval: 5000, // Refetch more frequently (every 5 seconds)
    staleTime: 0, // Always consider data stale
    refetchOnWindowFocus: true // Refetch when window gets focus
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