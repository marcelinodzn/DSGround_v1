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
import { History, Clock, ChevronDown, Undo } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTypographyStore } from '@/store/typography';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from 'sonner';

// Type for history items
type HistoryItem = {
  id: string;
  platform_id: string;
  user_id?: string;
  timestamp: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  data: {
    styles?: any[];
    settings?: any;
  };
  description: string;
};

export function TypographyHistoryButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('history');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { 
    currentPlatform, 
    fetchTypographyHistory, 
    saveTypeStyles,
    saveTypographySettings,
    platforms
  } = useTypographyStore();
  
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

  // Toggle expanded state for an item
  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId) 
        : [...prev, itemId]
    );
  };

  // Restore historical data
  const restoreHistoricalData = async (item: HistoryItem) => {
    if (!currentPlatform) {
      toast.error('No platform selected');
      return;
    }

    try {
      // Check if restoring type styles
      if (item.data.styles && item.data.styles.length > 0) {
        await saveTypeStyles(currentPlatform, item.data.styles);
        toast.success('Type styles restored', {
          description: `Successfully restored ${item.data.styles.length} type styles from ${formatDate(item.timestamp)}`
        });
      } 
      // Check if restoring typography settings
      else if (item.data.settings) {
        await saveTypographySettings(currentPlatform, item.data.settings);
        toast.success('Typography settings restored', {
          description: `Successfully restored typography settings from ${formatDate(item.timestamp)}`
        });
      }
    } catch (err) {
      console.error('Error restoring historical data:', err);
      toast.error('Restore Failed', {
        description: err instanceof Error ? err.message : 'Failed to restore data'
      });
    }
  };

  // Get the current platform name
  const getCurrentPlatformName = () => {
    const platform = platforms.find(p => p.id === currentPlatform);
    return platform?.name || 'Current Platform';
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
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Typography History
            </DialogTitle>
            <DialogDescription>
              View and restore historical changes to typography settings for {getCurrentPlatformName()}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs 
            defaultValue="history" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="history">History Timeline</TabsTrigger>
              <TabsTrigger value="details">Change Details</TabsTrigger>
            </TabsList>
            
            <TabsContent value="history" className="pt-4">
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
                  <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No history available for this platform</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {history.map((item) => (
                      <Collapsible
                        key={item.id}
                        open={expandedItems.includes(item.id)}
                        onOpenChange={() => toggleExpand(item.id)}
                        className="border rounded-md p-4 transition-all hover:border-primary/50"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-2">
                            <Badge className={`${getChangeTypeColor(item.operation)} text-white`}>
                              {item.operation}
                            </Badge>
                            <div>
                              <p className="font-semibold">{item.description}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(item.timestamp)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                restoreHistoricalData(item);
                              }}
                              title="Restore this version"
                            >
                              <Undo className="h-4 w-4 mr-1" />
                              Restore
                            </Button>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <ChevronDown className={`h-4 w-4 transition-transform ${
                                  expandedItems.includes(item.id) ? 'transform rotate-180' : ''
                                }`} />
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                        </div>
                        
                        <CollapsibleContent className="mt-4">
                          {item.data?.styles ? (
                            <div className="rounded-md bg-muted/50 p-3">
                              <p className="text-sm font-medium mb-2">Updated Type Styles ({item.data.styles.length})</p>
                              <ScrollArea className="h-[200px]">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Name</TableHead>
                                      <TableHead>Scale Step</TableHead>
                                      <TableHead>Font Family</TableHead>
                                      <TableHead>Weight</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {item.data.styles.map((style, index) => (
                                      <TableRow key={`${style.id}-${index}`}>
                                        <TableCell className="font-medium">{style.name}</TableCell>
                                        <TableCell>{style.scaleStep}</TableCell>
                                        <TableCell>{style.fontFamily}</TableCell>
                                        <TableCell>{style.fontWeight}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </ScrollArea>
                            </div>
                          ) : item.data?.settings ? (
                            <div className="rounded-md bg-muted/50 p-3">
                              <p className="text-sm font-medium mb-2">Updated Typography Settings</p>
                              <pre className="text-xs overflow-auto max-h-[200px] p-2 bg-muted rounded">
                                {JSON.stringify(item.data.settings, null, 2)}
                              </pre>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              No detailed data available for this change
                            </div>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
            
            <TabsContent value="details" className="pt-4">
              <div className="bg-muted/30 p-4 rounded-lg mb-4">
                <h4 className="text-sm font-medium mb-2">Change Type Legend</h4>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-xs">Create</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-xs">Update</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-xs">Delete</span>
                  </div>
                </div>
              </div>
            
              {history.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{formatDate(item.timestamp)}</TableCell>
                        <TableCell>
                          <Badge className={`${getChangeTypeColor(item.operation)} text-white`}>
                            {item.operation}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => restoreHistoricalData(item)}
                          >
                            <Undo className="h-4 w-4 mr-1" />
                            Restore
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No history data available
                </div>
              )}
            </TabsContent>
          </Tabs>
          
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