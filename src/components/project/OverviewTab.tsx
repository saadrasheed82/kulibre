import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, DollarSign, Eye } from "lucide-react";

export function OverviewTab() {
  const tags = ['Branding', 'Social Media', 'Urgent'];
  const milestones = [
    { title: 'Project Kickoff', status: 'completed', date: 'Jan 15, 2024' },
    { title: 'Brand Strategy', status: 'completed', date: 'Feb 1, 2024' },
    { title: 'Visual Identity', status: 'in-progress', date: 'Feb 15, 2024' },
    { title: 'Client Approval', status: 'pending', date: 'Mar 1, 2024' },
    { title: 'Asset Delivery', status: 'pending', date: 'Mar 30, 2024' },
  ];
  const clientActivity = [
    { action: 'Viewed project', time: '2 hours ago', user: 'John Doe' },
    { action: 'Left comment on video v2', time: '5 hours ago', user: 'John Doe' },
    { action: 'Approved logo design', time: '1 day ago', user: 'Jane Smith' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Project Summary */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Project Summary</h3>
          <div className="prose max-w-none">
            <p>
              Complete brand refresh for Acme Corp, including new visual identity,
              brand guidelines, and marketing collateral. The goal is to modernize
              the brand while maintaining its core values and recognition in the market.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {tags.map((tag, i) => (
              <Badge key={i} variant="secondary">{tag}</Badge>
            ))}
          </div>
        </Card>

        {/* Budget & Cost Tracker */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Budget & Cost Tracker</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-muted-foreground">Estimated Budget</div>
              <div className="text-2xl font-semibold flex items-center gap-1">
                <DollarSign className="h-5 w-5" />
                50,000
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-muted-foreground">Spent</div>
              <div className="text-2xl font-semibold flex items-center gap-1">
                <DollarSign className="h-5 w-5" />
                32,450
              </div>
            </div>
          </div>
          <Progress value={65} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">65% of budget used</p>
        </Card>

        {/* Milestones */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Milestones</h3>
          <div className="space-y-4">
            {milestones.map((milestone, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className={`h-3 w-3 rounded-full ${
                      milestone.status === 'completed' ? 'bg-green-500' :
                      milestone.status === 'in-progress' ? 'bg-blue-500' :
                      'bg-gray-300'
                    }`}
                  />
                  <div>
                    <div className="font-medium">{milestone.title}</div>
                    <div className="text-sm text-muted-foreground">{milestone.date}</div>
                  </div>
                </div>
                <Badge
                  variant={milestone.status === 'completed' ? 'default' : 'secondary'}
                >
                  {milestone.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Client Activity Feed */}
      <Card className="p-6 h-fit">
        <h3 className="text-lg font-semibold mb-4">Client Activity</h3>
        <div className="space-y-4">
          {clientActivity.map((activity, i) => (
            <div key={i} className="flex items-start gap-3">
              <Avatar>
                <AvatarFallback>{activity.user[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{activity.user}</div>
                <div className="text-sm text-muted-foreground">{activity.action}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" />
                  {activity.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}