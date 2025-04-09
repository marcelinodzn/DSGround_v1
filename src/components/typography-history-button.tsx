import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTypographyStore } from '@/store/typography';
import { format } from 'date-fns';

// Type for history items
type HistoryItem = {
  id: string;
  platform_id: string;
  user_id?: string;
  timestamp: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  data: any;
  description: string;
};

export function TypographyHistoryButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentPlatform, fetchTypographyHistory } = useTypographyStore();
  
  // Fetch history when dialog opens
  const loadHistory = async () => {
    if (!currentPlatform) {
      setError('No platform selected');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const historyData = await fetchTypographyHistory(currentPlatform);
      setHistory(historyData);
    } catch (err) {
      console.error('Error fetching typography history:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, currentPlatform]);
  
  // Function to get a color for the change type
  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'CREATE': return 'bg-green-500';
      case 'UPDATE': return 'bg-blue-500';
      case 'DELETE': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  // Function to format the changed date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return dateString;
    }
  };
  
  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        title="View Typography History"
      >
        <History className="h-5 w-5" />
        <span className="ml-2 hidden md:inline">History</span>
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Typography History</DialogTitle>
            <DialogDescription>
              View the history of changes to typography styles
            </DialogDescription>
          </DialogHeader>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded">
              <p>Error: {error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadHistory} 
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No history available for this platform
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {history.map((item) => (
                  <div key={item.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <Badge className={`${getChangeTypeColor(item.operation)} text-white`}>
                          {item.operation}
                        </Badge>
                        <span className="ml-2 font-semibold">{item.description}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(item.timestamp)}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {item.data?.styles?.length} styles affected
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
            >
              Close
            </Button>
            <Button 
              variant="default" 
              onClick={loadHistory} 
              disabled={loading}
            >
              Refresh
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 