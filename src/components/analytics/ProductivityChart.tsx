// components/analytics/ProductivityChart.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type ProductivityData = {
  day: string;
  completed: number;
  created: number;
};

export default function ProductivityChart() {
  const [data, setData] = useState<ProductivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<"week" | "month">("week");

  const fetchProductivityData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get current date
      const now = new Date();
      const startDate = new Date();

      // Calculate start date based on timeframe
      if (timeframe === "week") {
        startDate.setDate(now.getDate() - 7);
      } else {
        startDate.setDate(now.getDate() - 30);
      }

      // Format dates for Supabase query
      const startDateStr = startDate.toISOString();
      const endDateStr = now.toISOString();

      // Get created tasks
      const { data: createdTasks, error: createdError } = await supabase
        .from("task_activities")
        .select("*")
        .eq("activity_type", "create")
        .gte("created_at", startDateStr)
        .lte("created_at", endDateStr);

      if (createdError) throw createdError;

      // Get completed tasks
      const { data: completedTasks, error: completedError } = await supabase
        .from("task_activities")
        .select("*")
        .eq("activity_type", "complete")
        .gte("created_at", startDateStr)
        .lte("created_at", endDateStr);

      if (completedError) throw completedError;

      // Process data for chart
      const productivityByDay = new Map<
        string,
        { created: number; completed: number }
      >();

      // Initialize dates in range
      const currentDate = new Date(startDate);
      while (currentDate <= now) {
        const dateKey = currentDate.toISOString().split("T")[0];
        productivityByDay.set(dateKey, { created: 0, completed: 0 });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Count created tasks
      createdTasks?.forEach((task) => {
        const dateKey = new Date(task.created_at).toISOString().split("T")[0];
        if (productivityByDay.has(dateKey)) {
          const dayData = productivityByDay.get(dateKey)!;
          productivityByDay.set(dateKey, {
            ...dayData,
            created: dayData.created + 1,
          });
        }
      });

      // Count completed tasks
      completedTasks?.forEach((task) => {
        const dateKey = new Date(task.created_at).toISOString().split("T")[0];
        if (productivityByDay.has(dateKey)) {
          const dayData = productivityByDay.get(dateKey)!;
          productivityByDay.set(dateKey, {
            ...dayData,
            completed: dayData.completed + 1,
          });
        }
      });

      // Convert to array for chart
      const chartData: ProductivityData[] = Array.from(
        productivityByDay.entries()
      )
        .map(([day, counts]) => ({
          day: formatDate(day),
          created: counts.created,
          completed: counts.completed,
        }))
        .sort((a, b) => a.day.localeCompare(b.day));

      setData(chartData);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to fetch productivity data");
      } else {
        setError("Failed to fetch productivity data");
      }
      console.error("Error fetching productivity data:", err);
    } finally {
      setLoading(false);
    }
  }, [timeframe]); // Include timeframe as a dependency here

  useEffect(() => {
    fetchProductivityData();
  }, [fetchProductivityData]); // Now fetchProductivityData is the only dependency

  // Format date as "Apr 7" or "Apr 07"
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="spinner"></div>
        <p className="mt-2 text-sm text-gray-500">
          Loading productivity data...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <button
          onClick={fetchProductivityData}
          className="mt-2 text-indigo-600 hover:text-indigo-800"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">
          Productivity Overview
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setTimeframe("week")}
            className={`px-3 py-1 text-sm rounded-md ${
              timeframe === "week"
                ? "bg-indigo-100 text-indigo-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setTimeframe("month")}
            className={`px-3 py-1 text-sm rounded-md ${
              timeframe === "month"
                ? "bg-indigo-100 text-indigo-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="created" fill="#8884d8" name="Tasks Created" />
            <Bar dataKey="completed" fill="#82ca9d" name="Tasks Completed" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
