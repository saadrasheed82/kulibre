import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Clock, MessageSquare, ThumbsUp, X } from "lucide-react";

interface FeedbackThread {
  id: string;
  asset: string;
  status: 'pending' | 'changes-requested' | 'approved';
  comments: {
    id: string;
    user: { name: string; initials: string };
    content: string;
    timestamp: string;
    isClient?: boolean;
  }[];
}

export function FeedbackTab() {
  const [feedbackThreads, setFeedbackThreads] = useState<FeedbackThread[]>([
    {
      id: '1',
      asset: 'Logo Design v2',
      status: 'changes-requested',
      comments: [
        {
          id: '1',
          user: { name: 'John Doe', initials: 'JD' },
          content: 'The logo looks great, but can we try a different color palette? Maybe something warmer?',
          timestamp: '2 days ago',
          isClient: true
        },
        {
          id: '2',
          user: { name: 'Sarah Khan', initials: 'SK' },
          content: 'I\'ll work on some variations with warmer colors and share them by tomorrow.',
          timestamp: '1 day ago'
        }
      ]
    },
    {
      id: '2',
      asset: 'Brand Guidelines',
      status: 'pending',
      comments: [
        {
          id: '3',
          user: { name: 'Mike Chen', initials: 'MC' },
          content: 'First draft of the brand guidelines is ready for review.',
          timestamp: '3 hours ago'
        }
      ]
    }
  ]);

  const [newComment, setNewComment] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'changes-requested':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'changes-requested':
        return <X className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {feedbackThreads.map(thread => (
        <Card key={thread.id} className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium">{thread.asset}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="secondary"
                  className={getStatusColor(thread.status)}
                >
                  <span className="flex items-center gap-1">
                    {getStatusIcon(thread.status)}
                    {thread.status.replace('-', ' ')}
                  </span>
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {thread.comments.length} comments
                </span>
              </div>
            </div>
            {thread.status !== 'approved' && (
              <Button variant="outline" className="text-green-600">
                <ThumbsUp className="h-4 w-4 mr-2" />
                Approve
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {thread.comments.map(comment => (
              <div key={comment.id} className="flex gap-4">
                <Avatar>
                  <AvatarFallback>{comment.user.initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{comment.user.name}</span>
                    {comment.isClient && (
                      <Badge variant="outline">Client</Badge>
                    )}
                    <span className="text-sm text-muted-foreground">{comment.timestamp}</span>
                  </div>
                  <p className="mt-1 text-sm">{comment.content}</p>
                </div>
              </div>
            ))}

            <div className="flex gap-4 pt-4">
              <Avatar>
                <AvatarFallback>SK</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="mb-2"
                />
                <div className="flex items-center gap-2">
                  <Button>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Comment
                  </Button>
                  <Button variant="ghost">Cancel</Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
