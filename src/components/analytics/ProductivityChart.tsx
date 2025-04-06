// components/analytics/ProductivityChart.tsx
"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    fetchProductivityData();
  }, [timeframe]);

  const fetchProductivityData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get current date
      const now = new Date();
      let startDate = new Date();

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
      let currentDate = new Date(startDate);
      while (currentDate <= now) {
        const dateKey = currentDate.toISOString().split("T")[0];
        productivityByDay.set(dateKey, { created: 0, completed: 0 });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Count created tasks
      createdTasks.forEach((task) => {
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
      completedTasks.forEach((task) => {
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
    } catch (err: any) {
      console.error("Error fetching productivity data:", err);
      setError(err.message || "Failed to fetch productivity data");
    } finally {
      setLoading(false);
    }
  };

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

// components/analytics/CategoryBreakdown.tsx
("use client");

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
    } catch (err: any) {
      console.error("Error fetching category data:", err);
      setError(err.message || "Failed to fetch category breakdown");
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

// components/analytics/CompletionRate.tsx
("use client");

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function CompletionRate() {
  const [stats, setStats] = useState({
    completedTasks: 0,
    totalTasks: 0,
    completionRate: 0,
    averageCompletionTime: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCompletionStats();
  }, []);

  const fetchCompletionStats = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get all tasks
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("*");

      if (tasksError) throw tasksError;

      // Get task activities for completion time calculation
      const { data: activities, error: activitiesError } = await supabase
        .from("task_activities")
        .select("*");

      if (activitiesError) throw activitiesError;

      // Calculate completion stats
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(
        (task) => task.status === "completed"
      ).length;
      const completionRate =
        totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // Map task creation and completion times for calculating average completion time
      const taskTimestamps: Record<
        string,
        { created?: Date; completed?: Date }
      > = {};

      activities.forEach((activity) => {
        const taskId = activity.task_id;

        if (!taskTimestamps[taskId]) {
          taskTimestamps[taskId] = {};
        }

        if (activity.activity_type === "create") {
          taskTimestamps[taskId].created = new Date(activity.created_at);
        } else if (activity.activity_type === "complete") {
          taskTimestamps[taskId].completed = new Date(activity.created_at);
        }
      });

      // Calculate average completion time in hours
      let totalCompletionTime = 0;
      let completedTaskCount = 0;

      Object.values(taskTimestamps).forEach((timestamps) => {
        if (timestamps.created && timestamps.completed) {
          const timeDiff =
            timestamps.completed.getTime() - timestamps.created.getTime();
          const hoursDiff = timeDiff / (1000 * 60 * 60); // Convert ms to hours
          totalCompletionTime += hoursDiff;
          completedTaskCount++;
        }
      });

      const averageCompletionTime =
        completedTaskCount > 0 ? totalCompletionTime / completedTaskCount : 0;

      setStats({
        completedTasks,
        totalTasks,
        completionRate,
        averageCompletionTime,
      });
    } catch (err: any) {
      console.error("Error fetching completion stats:", err);
      setError(err.message || "Failed to fetch completion statistics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-6">
        <div className="spinner"></div>
        <p className="mt-2 text-sm text-gray-500">Loading statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <p className="text-red-500">{error}</p>
        <button
          onClick={fetchCompletionStats}
          className="mt-2 text-indigo-600 hover:text-indigo-800"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">
        Task Completion Stats
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Completion Rate */}
        <div className="text-center">
          <div className="text-3xl font-bold text-indigo-600">
            {stats.completionRate.toFixed(1)}%
          </div>
          <div className="mt-1 text-sm text-gray-500">Task Completion Rate</div>
          <div className="mt-2 text-xs text-gray-500">
            {stats.completedTasks} / {stats.totalTasks} tasks completed
          </div>
        </div>

        {/* Average Completion Time */}
        <div className="text-center">
          <div className="text-3xl font-bold text-indigo-600">
            {stats.averageCompletionTime.toFixed(1)}
          </div>
          <div className="mt-1 text-sm text-gray-500">
            Avg. Completion Time (hours)
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {(stats.averageCompletionTime / 24).toFixed(1)} days on average
          </div>
        </div>
      </div>
    </div>
  );
}
