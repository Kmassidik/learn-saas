// components/workspaces/WorkspaceForm.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

type Workspace = {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
};

interface WorkspaceFormProps {
  initialWorkspace?: Partial<Workspace>;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function WorkspaceForm({ initialWorkspace, onSuccess, onCancel }: WorkspaceFormProps) {
  const [name, setName] = useState(initialWorkspace?.name || '');
  const [description, setDescription] = useState(initialWorkspace?.description || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (initialWorkspace?.id) {
        // Update existing workspace
        const { error } = await supabase
          .from('workspaces')
          .update({ name, description })
          .eq('id', initialWorkspace.id);

        if (error) throw error;
      } else {
        // Create new workspace
        const { error } = await supabase
          .from('workspaces')
          .insert([{ name, description }]);

        if (error) throw error;
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the workspace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Workspace Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description (optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Saving...' : initialWorkspace?.id ? 'Update Workspace' : 'Create Workspace'}
        </button>
      </div>
    </form>
  );
}