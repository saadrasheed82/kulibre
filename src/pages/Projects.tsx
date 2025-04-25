
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

export default function Projects() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      return data || [];
    }
  });

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">Manage your creative projects</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects?.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <CardTitle className="text-xl">{project.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">
                  {project.description || "No description provided"}
                </p>
                <div className="flex gap-2">
                  <Badge>{project.type}</Badge>
                  <Badge variant="outline">{project.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}

          {isLoading && (
            <p className="text-muted-foreground">Loading projects...</p>
          )}

          {!isLoading && !projects?.length && (
            <p className="text-muted-foreground col-span-full text-center py-8">
              No projects found. Create your first project to get started.
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
}
