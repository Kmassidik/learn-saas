// components/tasks/TaskList.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Task, Category } from "@/lib/supabase";
import TaskForm from "./TaskForm";

export default function TaskList() {
  const [tasks, setTasks] = useState<(Task & { category?: Category })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<
    "all" | "pending" | "in_progress" | "completed"
  >("all");

  // At the top of your component, memoize the fetchTasks function
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("tasks")
        .select(
          `
        *,
        categories(*)
      `
        )
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Format the data to match our expected type
      const formattedTasks = data.map((task) => ({
        ...task,
        category: task.categories,
      })) as (Task & { category?: Category })[];

      setTasks(formattedTasks);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Error fetching tasks");
      } else {
        setError("Error fetching tasks");
      }
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]); // Now fetchTasks only changes when filter changes

  // Then in your useEffect
  useEffect(() => {
    fetchTasks();

    // Setup real-time subscription
    const subscription = supabase
      .channel("tasks-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchTasks]); // Now this is safe and won't cause infinite loops

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
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Error updating task status");
      } else {
        setError("Error updating task status");
      }
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);

      if (error) throw error;
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Error deleting task");
      } else {
        setError("Error deleting task");
      }
      console.error("Error deleting task:", err);
    }
  };

  const openFormForEdit = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingTask(null);
  };

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isFormOpen) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium text-gray-900">
            {editingTask ? "Edit Task" : "Create New Task"}
          </h2>
        </div>
        <TaskForm
          initialTask={editingTask || undefined}
          onSuccess={() => {
            closeForm();
            fetchTasks();
          }}
          onCancel={closeForm}
        />
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="flex justify-between items-center p-6 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-medium text-gray-900">Tasks</h2>
          <div className="flex rounded-md shadow-sm">
            <select
              value={filter}
              onChange={(e) => {
                const value = e.target.value;
                if (
                  value === "all" ||
                  value === "pending" ||
                  value === "in_progress" ||
                  value === "completed"
                ) {
                  setFilter(value);
                }
              }}
              className="rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            >
              <option value="all">All Tasks</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add Task
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="spinner"></div>
          <p className="mt-2 text-sm text-gray-500">Loading tasks...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
          <button
            onClick={fetchTasks}
            className="mt-2 text-indigo-600 hover:text-indigo-800"
          >
            Try again
          </button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No tasks found. Create your first task!
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {tasks.map((task) => (
            <li key={task.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={task.status === "completed"}
                      onChange={() =>
                        handleStatusChange(
                          task.id,
                          task.status === "completed" ? "pending" : "completed"
                        )
                      }
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <div className="ml-3">
                      <p
                        className={`text-sm font-medium ${
                          task.status === "completed"
                            ? "line-through text-gray-500"
                            : "text-gray-900"
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="mt-1 text-sm text-gray-500 truncate">
                          {task.description}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            task.status
                          )}`}
                        >
                          {task.status.replace("_", " ")}
                        </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>
                        {task.category && (
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${task.category.color}20`,
                              color: task.category.color,
                            }}
                          >
                            {task.category.name}
                          </span>
                        )}
                        {task.due_date && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      const newStatus =
                        task.status === "pending"
                          ? "in_progress"
                          : task.status === "in_progress"
                          ? "completed"
                          : "pending";
                      handleStatusChange(task.id, newStatus);
                    }}
                    className="text-sm text-indigo-600 hover:text-indigo-900"
                  >
                    {task.status === "pending"
                      ? "Start"
                      : task.status === "in_progress"
                      ? "Complete"
                      : "Reopen"}
                  </button>
                  <button
                    onClick={() => openFormForEdit(task)}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-sm text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
