// app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Task } from "@/lib/supabase";

// Simple dashboard components
const TaskCountCard = ({
  title,
  count,
  color,
}: {
  title: string;
  count: number;
  color: string;
}) => (
  <div
    className={`bg-white overflow-hidden shadow rounded-lg border-l-4 ${color}`}
  >
    <div className="px-4 py-5 sm:p-6">
      <dl>
        <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
        <dd className="mt-1 text-3xl font-semibold text-gray-900">{count}</dd>
      </dl>
    </div>
  </div>
);

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    upcomingDueTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [username, setUsername] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchDashboardData = async () => {
    setLoading(true);

    try {
      // Get user details
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();

        if (profileData) {
          setUsername(profileData.username);
        }
      }

      // Get task counts
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("*");

      if (tasksError) throw tasksError;

      // Calculate stats
      const now = new Date();
      const upcoming = new Date();
      upcoming.setDate(now.getDate() + 7); // Next 7 days

      const stats = {
        totalTasks: tasksData.length,
        pendingTasks: tasksData.filter((t) => t.status === "pending").length,
        inProgressTasks: tasksData.filter((t) => t.status === "in_progress")
          .length,
        completedTasks: tasksData.filter((t) => t.status === "completed")
          .length,
        upcomingDueTasks: tasksData.filter((t) => {
          if (!t.due_date) return false;
          const dueDate = new Date(t.due_date);
          return (
            dueDate > now && dueDate <= upcoming && t.status !== "completed"
          );
        }).length,
      };

      setStats(stats);

      // Get recent tasks
      const { data: recentTasksData, error: recentError } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (recentError) throw recentError;
      setRecentTasks(recentTasksData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Update time every minute
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  // Helper for greeting based on time of day
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Format date as "Monday, April 7"
  const formattedDate = currentTime.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "pending":
        return "text-gray-600";
      case "in_progress":
        return "text-blue-600";
      case "completed":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="spinner"></div>
          <p className="mt-2 text-sm text-gray-500">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {getGreeting()}, {username}!
        </h1>
        <p className="text-gray-500">{formattedDate}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <TaskCountCard
          title="Total Tasks"
          count={stats.totalTasks}
          color="border-gray-500"
        />
        <TaskCountCard
          title="Pending Tasks"
          count={stats.pendingTasks}
          color="border-yellow-500"
        />
        <TaskCountCard
          title="In Progress"
          count={stats.inProgressTasks}
          color="border-blue-500"
        />
        <TaskCountCard
          title="Completed"
          count={stats.completedTasks}
          color="border-green-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Tasks */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Due Soon ({stats.upcomingDueTasks})
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Tasks due in the next 7 days
            </p>
          </div>
          <div className="px-4 py-3">
            {/* Implement due soon tasks here */}
            <p className="text-gray-500 text-sm py-2">Coming soon</p>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Recent Tasks
            </h3>
          </div>
          <div className="px-4 py-3">
            {recentTasks.length === 0 ? (
              <p className="text-gray-500 text-sm py-2">No recent tasks</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {recentTasks.map((task) => (
                  <li key={task.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span
                          className={`inline-block h-2 w-2 rounded-full mr-2 ${getStatusColor(
                            task.status
                          )}`}
                        ></span>
                        <span className="text-sm font-medium text-gray-900">
                          {task.title}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(task.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
