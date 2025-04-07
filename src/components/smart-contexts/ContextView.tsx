// components/smart-contexts/ContextView.tsx
"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Task, Category } from "@/lib/supabase";

type TaskWithCategory = Task & {
  category?: Category;
};

type Context = {
  id: string;
  name: string;
  tasks: TaskWithCategory[];
  priority: "high" | "medium" | "low";
};

export default function ContextView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contexts, setContexts] = useState<Context[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update current time every minute
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      // Get all tasks with their categories
      const { data, error } = await supabase
        .from("tasks")
        .select(
          `
          *,
          categories(*)
        `
        )
        .not("status", "eq", "completed");

      if (error) throw error;

      // Format tasks with categories
      const formattedTasks = data.map((task) => ({
        ...task,
        category: task.categories,
      })) as TaskWithCategory[];

      // Generate smart contexts
      const smartContexts = generateSmartContexts(formattedTasks, currentTime);
      setContexts(smartContexts);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch tasks";
      setError(errorMessage);
      console.error("Error fetching tasks for contexts:", err);
    } finally {
      setLoading(false);
    }
  };

  // Using useCallback to memoize fetchTasks to avoid dependency issues
  const memoizedFetchTasks = React.useCallback(() => {
    fetchTasks();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    memoizedFetchTasks();
  }, [memoizedFetchTasks]);

  const generateSmartContexts = (
    tasks: TaskWithCategory[],
    currentTime: Date
  ): Context[] => {
    // Set of contexts to generate
    const contexts: Context[] = [];

    // 1. Due Today Context
    const today = new Date(currentTime);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dueTodayTasks = tasks.filter((task) => {
      if (!task.due_date) return false;
      const dueDate = new Date(task.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() === today.getTime();
    });

    if (dueTodayTasks.length > 0) {
      contexts.push({
        id: "due-today",
        name: "Due Today",
        tasks: dueTodayTasks,
        priority: "high",
      });
    }

    // 2. High Priority Context
    const highPriorityTasks = tasks.filter(
      (task) =>
        task.priority === "high" && !dueTodayTasks.some((t) => t.id === task.id)
    );

    if (highPriorityTasks.length > 0) {
      contexts.push({
        id: "high-priority",
        name: "High Priority",
        tasks: highPriorityTasks,
        priority: "high",
      });
    }

    // 3. Time-based Context (Morning/Afternoon/Evening)
    const hour = currentTime.getHours();
    let timeBasedName = "";
    if (hour < 12) {
      timeBasedName = "Morning Focus";
    } else if (hour < 17) {
      timeBasedName = "Afternoon Tasks";
    } else {
      timeBasedName = "Evening Wrap-up";
    }

    // Get tasks that are in progress
    const inProgressTasks = tasks.filter(
      (task) =>
        task.status === "in_progress" &&
        !dueTodayTasks.some((t) => t.id === task.id) &&
        !highPriorityTasks.some((t) => t.id === task.id)
    );

    if (inProgressTasks.length > 0) {
      contexts.push({
        id: "time-based",
        name: timeBasedName,
        tasks: inProgressTasks,
        priority: "medium",
      });
    }

    // 4. Category-based Context (group by most common category)
    const categoryTasksMap = new Map<string, TaskWithCategory[]>();
    tasks.forEach((task) => {
      if (
        task.category &&
        !dueTodayTasks.some((t) => t.id === task.id) &&
        !highPriorityTasks.some((t) => t.id === task.id) &&
        !inProgressTasks.some((t) => t.id === task.id)
      ) {
        const categoryId = task.category.id;
        if (!categoryTasksMap.has(categoryId)) {
          categoryTasksMap.set(categoryId, []);
        }
        categoryTasksMap.get(categoryId)?.push(task);
      }
    });

    // Find category with most tasks
    let maxTasks = 0;
    let mainCategoryId = "";
    categoryTasksMap.forEach((categoryTasks, categoryId) => {
      if (categoryTasks.length > maxTasks) {
        maxTasks = categoryTasks.length;
        mainCategoryId = categoryId;
      }
    });

    if (mainCategoryId && categoryTasksMap.get(mainCategoryId)!.length > 0) {
      const categoryTasks = categoryTasksMap.get(mainCategoryId)!;
      const categoryName = categoryTasks[0].category!.name;

      contexts.push({
        id: `category-${mainCategoryId}`,
        name: `Focus: ${categoryName}`,
        tasks: categoryTasks,
        priority: "medium",
      });
    }

    // 5. Recently Created Context
    const oneWeekAgo = new Date(currentTime);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentlyCreatedTasks = tasks.filter((task) => {
      if (
        dueTodayTasks.some((t) => t.id === task.id) ||
        highPriorityTasks.some((t) => t.id === task.id) ||
        inProgressTasks.some((t) => t.id === task.id) ||
        (task.category &&
          categoryTasksMap.get(task.category.id)?.some((t) => t.id === task.id))
      ) {
        return false;
      }

      const createdDate = new Date(task.created_at);
      return createdDate > oneWeekAgo;
    });

    if (recentlyCreatedTasks.length > 0) {
      contexts.push({
        id: "recently-created",
        name: "Recently Added",
        tasks: recentlyCreatedTasks,
        priority: "low",
      });
    }

    // 6. Default Context - everything else
    const remainingTasks = tasks.filter(
      (task) =>
        !dueTodayTasks.some((t) => t.id === task.id) &&
        !highPriorityTasks.some((t) => t.id === task.id) &&
        !inProgressTasks.some((t) => t.id === task.id) &&
        !recentlyCreatedTasks.some((t) => t.id === task.id) &&
        !(
          task.category &&
          categoryTasksMap.get(task.category.id)?.some((t) => t.id === task.id)
        )
    );

    if (remainingTasks.length > 0) {
      contexts.push({
        id: "other",
        name: "Other Tasks",
        tasks: remainingTasks,
        priority: "low",
      });
    }

    return contexts;
  };

  const handleStatusChange = async (
    taskId: string,
    newStatus: Task["status"]
  ) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId);

      if (error) throw error;

      // Refresh tasks after update
      fetchTasks();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error updating task";
      console.error("Error updating task status:", errorMessage);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "No due date";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Helper function to determine next status
  const getNextStatus = (currentStatus: string): Task["status"] => {
    if (currentStatus === "pending") return "in_progress";
    if (currentStatus === "in_progress") return "completed";
    return "pending"; // Default fallback
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="spinner"></div>
        <p className="mt-2 text-sm text-gray-500">
          Analyzing your tasks and contexts...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <button
          onClick={fetchTasks}
          className="mt-2 text-indigo-600 hover:text-indigo-800"
        >
          Try again
        </button>
      </div>
    );
  }

  if (contexts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          No active tasks found. Add some tasks to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {contexts.map((context) => (
        <div
          key={context.id}
          className="bg-white shadow overflow-hidden sm:rounded-lg"
        >
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {context.name}
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({context.tasks.length}{" "}
                  {context.tasks.length === 1 ? "task" : "tasks"})
                </span>
              </h3>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  context.priority === "high"
                    ? "bg-red-100 text-red-800"
                    : context.priority === "medium"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {context.priority} priority
              </span>
            </div>
          </div>
          <ul className="divide-y divide-gray-200">
            {context.tasks.map((task) => (
              <li key={task.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <button
                      onClick={() =>
                        handleStatusChange(task.id, getNextStatus(task.status))
                      }
                      className={`flex-shrink-0 h-5 w-5 rounded-full border ${
                        task.status === "pending"
                          ? "border-gray-300"
                          : task.status === "in_progress"
                          ? "border-yellow-400 bg-yellow-100"
                          : "border-green-500 bg-green-500"
                      } mr-3`}
                      aria-label={`Change task status`}
                    >
                      {task.status === "completed" && (
                        <svg
                          className="h-5 w-5 text-white"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                    <div>
                      <h4
                        className={`text-sm font-medium ${
                          task.status === "completed"
                            ? "text-gray-400 line-through"
                            : "text-gray-900"
                        }`}
                      >
                        {task.title}
                      </h4>
                      <p className="mt-1 text-xs text-gray-500 line-clamp-1">
                        {task.description || "No description"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {task.category && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                        {task.category.name}
                      </span>
                    )}
                    <div className="text-xs text-gray-500">
                      {formatDate(task.due_date)}
                    </div>
                    <div
                      className={`h-2 w-2 rounded-full ${
                        task.priority === "high"
                          ? "bg-red-600"
                          : task.priority === "medium"
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      title={`${task.priority} priority`}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
