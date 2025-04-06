// app/dashboard/tasks/page.tsx
import TaskList from "@/components/tasks/TaskList";
import CategoryManager from "@/components/categories/CategoryManager";

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TaskList />
        </div>
        <div>
          <CategoryManager />
        </div>
      </div>
    </div>
  );
}
