// app/dashboard/workspaces/page.tsx
import WorkspaceList from "@/components/workspaces/WorkspaceList";

export default function WorkspacesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Team Collaboration</h1>
      <p className="text-gray-600">
        Create and manage workspaces to collaborate with your team members.
      </p>

      <div>
        <WorkspaceList />
      </div>
    </div>
  );
}
