// components/analytics/CategoryBreakdown.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

type CategoryCount = {
  name: string;
  count: number;
  color: string;
};

export default function CategoryBreakdown() {
  const [data, setData] = useState<CategoryCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategoryData();
  }, []);

  const fetchCategoryData = async () => {
    setLoading(true);
    setError(null);

    try {
      // First get all categories
      const { data: categories, error: catError } = await supabase
        .from("categories")
        .select("*");

      if (catError) throw catError;

      // Then get task counts by category
      const { data: tasks, error: taskError } = await supabase
        .from("tasks")
        .select("category_id");

      if (taskError) throw taskError;

      // Count tasks by category
      const categoryCounts = new Map<string, number>();
      tasks.forEach((task) => {
        const categoryId = task.category_id || "uncategorized";
        categoryCounts.set(
          categoryId,
          (categoryCounts.get(categoryId) || 0) + 1
        );
      });

      // Format data for chart
      const chartData: CategoryCount[] = categories.map((category) => ({
        name: category.name,
        count: categoryCounts.get(category.id) || 0,
        color: category.color,
      }));

      // Add uncategorized if needed
      const uncategorizedCount = categoryCounts.get("uncategorized") || 0;
      if (uncategorizedCount > 0) {
        chartData.push({
          name: "Uncategorized",
          count: uncategorizedCount,
          color: "#9CA3AF", // Gray color
        });
      }

      // Sort by count descending
      chartData.sort((a, b) => b.count - a.count);

      setData(chartData);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to fetch category breakdown");
      } else {
        setError("Failed to fetch category breakdown");
      }
      console.error("Failed to fetch category breakdown:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="spinner"></div>
        <p className="mt-2 text-sm text-gray-500">Loading category data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <button
          onClick={fetchCategoryData}
          className="mt-2 text-indigo-600 hover:text-indigo-800"
        >
          Try again
        </button>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No category data available yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">
        Tasks by Category
      </h3>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
              nameKey="name"
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [`${value} tasks`, name]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
