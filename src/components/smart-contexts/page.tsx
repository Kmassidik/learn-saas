// app/dashboard/page.tsx
import ContextView from "@/components/smart-contexts/ContextView";

export default function SmartContextPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Smart Focus</h1>
          <p className="text-gray-600">
            Tasks organized by context to help you focus on what matters now.
          </p>
        </div>
      </div>

      <ContextView />
    </div>
  );
}
