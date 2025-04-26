import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Clock, Plus } from "lucide-react";

interface Task {
  id: string;
  title: string;
  assignee: { name: string; initials: string };
  dueDate: string;
  checklist: { total: number; completed: number };
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

export function TaskBoardTab() {
  const [columns, setColumns] = useState<Column[]>([
    {
      id: 'brief',
      title: 'Brief',
      tasks: [
        {
          id: '1',
          title: 'Review client requirements',
          assignee: { name: 'Sarah Khan', initials: 'SK' },
          dueDate: 'Jan 20, 2024',
          checklist: { total: 5, completed: 3 },
        },
      ],
    },
    {
      id: 'research',
      title: 'Research',
      tasks: [
        {
          id: '2',
          title: 'Competitor analysis',
          assignee: { name: 'Mike Chen', initials: 'MC' },
          dueDate: 'Jan 25, 2024',
          checklist: { total: 4, completed: 2 },
        },
      ],
    },
    {
      id: 'concept',
      title: 'Concept',
      tasks: [],
    },
    {
      id: 'draft',
      title: 'Draft',
      tasks: [],
    },
    {
      id: 'feedback',
      title: 'Feedback',
      tasks: [],
    },
    {
      id: 'final',
      title: 'Final',
      tasks: [],
    },
  ]);

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId !== destination.droppableId) {
      const sourceColumn = columns.find(col => col.id === source.droppableId);
      const destColumn = columns.find(col => col.id === destination.droppableId);
      const sourceItems = [...sourceColumn!.tasks];
      const destItems = [...destColumn!.tasks];
      const [removed] = sourceItems.splice(source.index, 1);
      destItems.splice(destination.index, 0, removed);

      setColumns(columns.map(col => {
        if (col.id === source.droppableId) {
          return { ...col, tasks: sourceItems };
        }
        if (col.id === destination.droppableId) {
          return { ...col, tasks: destItems };
        }
        return col;
      }));
    } else {
      const column = columns.find(col => col.id === source.droppableId);
      const copiedItems = [...column!.tasks];
      const [removed] = copiedItems.splice(source.index, 1);
      copiedItems.splice(destination.index, 0, removed);

      setColumns(columns.map(col => {
        if (col.id === source.droppableId) {
          return { ...col, tasks: copiedItems };
        }
        return col;
      }));
    }
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-4 min-w-[1200px] p-1">
        <DragDropContext onDragEnd={onDragEnd}>
          {columns.map(column => (
            <div key={column.id} className="flex-1">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-medium">{column.title}</h3>
                <span className="text-sm text-muted-foreground">{column.tasks.length}</span>
              </div>

              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="bg-gray-50 rounded-lg p-2 min-h-[500px]"
                  >
                    {column.tasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="p-3 mb-2 bg-white"
                          >
                            <div className="mb-2">
                              <h4 className="font-medium">{task.title}</h4>
                            </div>
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {task.assignee.initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {task.dueDate}
                                </span>
                                <span>
                                  {task.checklist.completed}/{task.checklist.total}
                                </span>
                              </div>
                            </div>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    <Button
                      variant="ghost"
                      className="w-full mt-2 text-muted-foreground"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Task
                    </Button>
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </DragDropContext>
      </div>
    </div>
  );
}