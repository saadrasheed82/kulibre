
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";

interface TeamMember {
  name: string;
  tasks: number;
  max: number;
}

interface TeamWorkloadChartProps {
  data: TeamMember[];
}

export function TeamWorkloadChart({ data }: TeamWorkloadChartProps) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
          barSize={20}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" scale="point" padding={{ left: 10, right: 10 }} />
          <YAxis />
          <Tooltip />
          <Bar 
            dataKey="tasks" 
            fill="#9b87f5" 
            radius={[4, 4, 0, 0]}
            name="Current Tasks" 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
