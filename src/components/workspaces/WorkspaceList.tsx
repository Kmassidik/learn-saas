// components/workspaces/WorkspaceList.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import WorkspaceForm from "./WorkspaceForm";

type Workspace = {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
};

type Member = {
  user_id: string;
  role: string;
  username: string;
};

export default function WorkspaceList() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(
    null
  );
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(
    null
  );
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const fetchWorkspaces = async () => {
    setLoading(true);
    try {
      // Get workspaces where user is a member
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("User not authenticated");

      // First, get workspaces created by the user
      const { data: ownedWorkspaces, error: ownedError } = await supabase
        .from("workspaces")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (ownedError) throw ownedError;

      // Then, get workspaces where the user is a member
      const { data: memberWorkspaces, error: memberError } = await supabase
        .from("workspace_members")
        .select(
          `
          workspace_id,
          workspaces (*)
        `
        )
        .eq("user_id", user.id);

      if (memberError) throw memberError;

      // Combine and deduplicate the workspaces
      const memberWorkspacesData = memberWorkspaces
        .map((item) => item.workspaces as Workspace)
        .filter(Boolean);

      const allWorkspaces = [...ownedWorkspaces, ...memberWorkspacesData];

      // Remove duplicates based on workspace id
      const uniqueWorkspaces = Array.from(
        new Map(allWorkspaces.map((item) => [item.id, item])).values()
      );

      setWorkspaces(uniqueWorkspaces);
    } catch (err: any) {
      setError(err.message || "Failed to fetch workspaces");
      console.error("Error fetching workspaces:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkspaceMembers = async (workspaceId: string) => {
    setLoadingMembers(true);
    try {
      const { data, error } = await supabase
        .from("workspace_members")
        .select(
          `
          user_id,
          role,
          profiles (username)
        `
        )
        .eq("workspace_id", workspaceId);

      if (error) throw error;

      const formattedMembers = data.map((member) => ({
        user_id: member.user_id,
        role: member.role,
        username: member.profiles?.username || "Unknown User",
      }));

      setMembers(formattedMembers);
    } catch (err: any) {
      console.error("Error fetching workspace members:", err);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();

    // Setup real-time subscription for workspaces
    const workspacesSubscription = supabase
      .channel("workspaces-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workspaces" },
        () => {
          fetchWorkspaces();
        }
      )
      .subscribe();

    return () => {
      workspacesSubscription.unsubscribe();
    };
  }, []);

  const openFormForEdit = (workspace: Workspace) => {
    setEditingWorkspace(workspace);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingWorkspace(null);
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    if (!confirm("Are you sure you want to delete this workspace?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("workspaces")
        .delete()
        .eq("id", workspaceId);

      if (error) throw error;
    } catch (err: any) {
      console.error("Error deleting workspace:", err);
      alert(
        "Failed to delete workspace. Check if it has active members or tasks."
      );
    }
  };

  const viewWorkspaceDetails = async (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    await fetchWorkspaceMembers(workspace.id);
  };

  const backToList = () => {
    setCurrentWorkspace(null);
    setMembers([]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isFormOpen) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium text-gray-900">
            {editingWorkspace ? "Edit Workspace" : "Create New Workspace"}
          </h2>
        </div>
        <WorkspaceForm
          initialWorkspace={editingWorkspace || undefined}
          onSuccess={() => {
            closeForm();
            fetchWorkspaces();
          }}
          onCancel={closeForm}
        />
      </div>
    );
  }

  if (currentWorkspace) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {currentWorkspace.name}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Created on {formatDate(currentWorkspace.created_at)}
              </p>
            </div>
            <button
              onClick={backToList}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back to Workspaces
            </button>
          </div>
        </div>

        <div className="px-4 py-5 sm:px-6">
          <div className="text-sm text-gray-500 mb-4">
            {currentWorkspace.description || "No description provided."}
          </div>

          <div className="mt-6">
            <h4 className="text-base font-medium text-gray-900 mb-2">
              Members
            </h4>
            {loadingMembers ? (
              <p className="text-sm text-gray-500">Loading members...</p>
            ) : members.length === 0 ? (
              <p className="text-sm text-gray-500">
                No members in this workspace yet.
              </p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {members.map((member) => (
                  <li
                    key={member.user_id}
                    className="py-3 flex justify-between items-center"
                  >
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800 font-medium">
                        {member.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-900">
                        {member.username}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-gray-500 uppercase">
                      {member.role}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6">
            <h4 className="text-base font-medium text-gray-900 mb-2">
              Team Tasks
            </h4>
            <p className="text-sm text-gray-500">
              Coming soon: Shared tasks and collaboration features
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="flex justify-between items-center p-6 border-b border-gray-200">
        <h2 className="text-xl font-medium text-gray-900">Workspaces</h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create Workspace
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="spinner"></div>
          <p className="mt-2 text-sm text-gray-500">Loading workspaces...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
          <button
            onClick={fetchWorkspaces}
            className="mt-2 text-indigo-600 hover:text-indigo-800"
          >
            Try again
          </button>
        </div>
      ) : workspaces.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No workspaces found. Create your first workspace!
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {workspaces.map((workspace) => (
            <li key={workspace.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => viewWorkspaceDetails(workspace)}
                >
                  <h3 className="text-sm font-medium text-gray-900">
                    {workspace.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-1">
                    {workspace.description || "No description"}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Created {formatDate(workspace.created_at)}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openFormForEdit(workspace)}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteWorkspace(workspace.id)}
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
