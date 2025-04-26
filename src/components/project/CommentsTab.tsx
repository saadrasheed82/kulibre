import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Mic, Pin } from "lucide-react";

interface Comment {
  id: string;
  user: { name: string; initials: string };
  content: string;
  timestamp: string;
  type: 'team' | 'client';
  reactions?: { emoji: string; count: number }[];
  attachments?: { name: string; type: string }[];
}

export function CommentsTab() {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      user: { name: 'Sarah Khan', initials: 'SK' },
      content: 'Updated the color palette based on client feedback. @MikeChen please review when you have a chance.',
      timestamp: '2 hours ago',
      type: 'team',
      reactions: [
        { emoji: '👍', count: 2 },
        { emoji: '🎨', count: 1 }
      ]
    },
    {
      id: '2',
      user: { name: 'John Doe', initials: 'JD' },
      content: 'The new design direction looks promising. Looking forward to seeing the final version.',
      timestamp: '5 hours ago',
      type: 'client'
    }
  ]);

  const [newComment, setNewComment] = useState('');
  const [filter, setFilter] = useState<'all' | 'team' | 'client'>('all');

  const filteredComments = comments.filter(comment => 
    filter === 'all' ? true : comment.type === filter
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium">Conversation</h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Mic className="h-4 w-4 mr-2" />
                Voice Note
              </Button>
              <Button variant="outline" size="sm">
                <Pin className="h-4 w-4 mr-2" />
                Pin Message
              </Button>
            </div>
          </div>

          <div className="space-y-1 mb-4">
            <TabsList>
              <TabsTrigger value="all" onClick={() => setFilter('all')}>All</TabsTrigger>
              <TabsTrigger value="team" onClick={() => setFilter('team')}>Team Only</TabsTrigger>
              <TabsTrigger value="client" onClick={() => setFilter('client')}>Client Only</TabsTrigger>
            </TabsList>
          </div>

          <div className="space-y-6">
            {filteredComments.map(comment => (
              <div key={comment.id} className="flex gap-4">
                <Avatar>
                  <AvatarFallback>{comment.user.initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{comment.user.name}</span>
                    <Badge variant="outline">{comment.type}</Badge>
                    <span className="text-sm text-muted-foreground">{comment.timestamp}</span>
                  </div>
                  <p className="mt-1">{comment.content}</p>
                  {comment.reactions && (
                    <div className="flex gap-2 mt-2">
                      {comment.reactions.map((reaction, i) => (
                        <button
                          key={i}
                          className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-sm"
                        >
                          <span>{reaction.emoji}</span>
                          <span>{reaction.count}</span>
                        </button>
                      ))}
                      <button className="text-muted-foreground hover:text-foreground text-sm">
                        + Add Reaction
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div className="flex gap-4 pt-4 border-t">
              <Avatar>
                <AvatarFallback>SK</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="mb-2"
                />
                <div className="flex items-center gap-2">
                  <Button>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send
                  </Button>
                  <Button variant="outline">
                    Team Only
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 h-fit">
        <h3 className="text-lg font-medium mb-4">Internal Notes</h3>
        <Textarea
          placeholder="Add internal notes, links, or documentation..."
          className="min-h-[200px] mb-4"
        />
        <Button className="w-full">
          Save Notes
        </Button>
      </Card>
    </div>
  );
}