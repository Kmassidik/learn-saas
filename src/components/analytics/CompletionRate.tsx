// components/analytics/CompletionRate.tsx
"use client";

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
