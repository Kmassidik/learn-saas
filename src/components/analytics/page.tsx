// app/dashboard/analytics/page.tsx
import ProductivityChart from "@/components/analytics/ProductivityChart";
import CategoryBreakdown from "@/components/analytics/CategoryBreakdown";
import CompletionRate from "@/components/analytics/CompletionRate";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Productivity Analytics
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProductivityChart />
        </div>
        <div>
          <CompletionRate />
        </div>
      </div>

      <div>
        <CategoryBreakdown />
      </div>
    </div>
  );
}
