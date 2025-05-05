import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';

interface UnreadMessagesIndicatorProps {
  className?: string;
}

export function UnreadMessagesIndicator({ className }: UnreadMessagesIndicatorProps) {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ['/api/messages/unread/count'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/messages/unread/count');
      return response.json();
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000 // Consider data stale after 15 seconds
  });

  if (!user || !data || data.count === 0) {
    return null;
  }

  return (
    <Badge 
      variant="destructive" 
      className={className}
    >
      {data.count}
    </Badge>
  );
}