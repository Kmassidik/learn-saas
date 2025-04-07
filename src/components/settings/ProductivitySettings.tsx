// components/settings/ProductivitySettings.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type ProductivitySettings = {
  peak_hours?: string[];
  work_days?: number[];
  focus_duration?: number;
};

export default function ProductivitySettings() {
  const [settings, setSettings] = useState<ProductivitySettings>({
    peak_hours: ["09:00", "14:00"],
    work_days: [1, 2, 3, 4, 5], // 1 = Monday, 7 = Sunday
    focus_duration: 25,
  });
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("Not authenticated");

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("productivity_settings")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      if (data.productivity_settings) {
        setSettings(data.productivity_settings);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to load settings");
      } else {
        setError("Failed to load settings");
      }
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("Not authenticated");

      // Update settings in the profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ productivity_settings: settings })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setSuccess("Productivity settings updated successfully!");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to update settings");
      } else {
        setError("Failed to update settings");
      }
      console.error("Failed to update settings:", err);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handlePeakStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSettings((prev) => ({
      ...prev,
      peak_hours: [value, prev.peak_hours?.[1] || "17:00"],
    }));
  };

  const handlePeakEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSettings((prev) => ({
      ...prev,
      peak_hours: [prev.peak_hours?.[0] || "09:00", value],
    }));
  };

  const handleWorkDayToggle = (day: number) => {
    setSettings((prev) => {
      const workDays = prev.work_days || [];
      if (workDays.includes(day)) {
        return {
          ...prev,
          work_days: workDays.filter((d) => d !== day),
        };
      } else {
        return {
          ...prev,
          work_days: [...workDays, day].sort(),
        };
      }
    });
  };

  const handleFocusDurationChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseInt(e.target.value);
    setSettings((prev) => ({
      ...prev,
      focus_duration: value,
    }));
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner"></div>
        <p className="mt-2 text-sm text-gray-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Productivity Settings
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Customize how TaskFlow optimizes your task management
        </p>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
        <form onSubmit={updateSettings} className="space-y-6">
          {/* Peak Hours */}
          <div>
            <h4 className="text-sm font-medium text-gray-900">
              Peak Productivity Hours
            </h4>
            <p className="text-xs text-gray-500 mb-2">
              When are you most productive? TaskFlow will prioritize tasks
              during these hours.
            </p>
            <div className="flex items-center space-x-4">
              <div>
                <label
                  htmlFor="peak-start"
                  className="block text-xs font-medium text-gray-700"
                >
                  Start Time
                </label>
                <input
                  type="time"
                  id="peak-start"
                  value={settings.peak_hours?.[0] || "09:00"}
                  onChange={handlePeakStartChange}
                  className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label
                  htmlFor="peak-end"
                  className="block text-xs font-medium text-gray-700"
                >
                  End Time
                </label>
                <input
                  type="time"
                  id="peak-end"
                  value={settings.peak_hours?.[1] || "17:00"}
                  onChange={handlePeakEndChange}
                  className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Work Days */}
          <div>
            <h4 className="text-sm font-medium text-gray-900">Work Days</h4>
            <p className="text-xs text-gray-500 mb-2">
              Which days do you typically work? Your dashboard will adjust
              accordingly.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { day: 1, label: "Mon" },
                { day: 2, label: "Tue" },
                { day: 3, label: "Wed" },
                { day: 4, label: "Thu" },
                { day: 5, label: "Fri" },
                { day: 6, label: "Sat" },
                { day: 7, label: "Sun" },
              ].map(({ day, label }) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleWorkDayToggle(day)}
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    settings.work_days?.includes(day)
                      ? "bg-indigo-100 text-indigo-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Focus Duration */}
          <div>
            <h4 className="text-sm font-medium text-gray-900">
              Focus Duration
            </h4>
            <p className="text-xs text-gray-500 mb-2">
              How long are your ideal focus sessions (in minutes)?
            </p>
            <input
              type="range"
              min="5"
              max="90"
              step="5"
              value={settings.focus_duration || 25}
              onChange={handleFocusDurationChange}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>5 min</span>
              <span>{settings.focus_duration || 25} min</span>
              <span>90 min</span>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="text-sm text-green-700">{success}</div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updateLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {updateLoading ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
