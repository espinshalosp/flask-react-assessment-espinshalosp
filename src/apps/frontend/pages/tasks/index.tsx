import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import routes from 'frontend/constants/routes';
import { TaskService } from 'frontend/services';
import { Task, TaskInput } from 'frontend/types/task';
import { getAccessTokenFromStorage } from 'frontend/utils/storage-util';

const taskService = new TaskService();

const emptyTask: TaskInput = { title: '', description: '' };

const TasksPage: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [formValues, setFormValues] = useState<TaskInput>(emptyTask);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const accessToken = useMemo(() => getAccessTokenFromStorage(), []);

  const ensureAuthenticated = useCallback(() => {
    if (!accessToken) {
      toast.error('Please login again');
      navigate(routes.LOGIN);
      return false;
    }
    if (!accessToken.accountId) {
      toast.error('Invalid session. Please login again');
      navigate(routes.LOGIN);
      return false;
    }
    return true;
  }, [accessToken, navigate]);

  const loadTasks = useCallback(async () => {
    if (!ensureAuthenticated() || !accessToken?.accountId) {
      return;
    }
    setIsLoading(true);
    try {
      const response = await taskService.getTasks(accessToken);
      setTasks(response.data?.items ?? []);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Unable to load tasks';
      if (err?.response?.status === 404) {
        toast.error('No tasks found for your account');
        setTasks([]);
      } else if (err?.response?.status === 401) {
        toast.error('Session expired. Please login again');
        navigate(routes.LOGIN);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, ensureAuthenticated, navigate]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const resetForm = () => {
    setFormValues(emptyTask);
    setEditingTaskId(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formValues.title || !formValues.description) {
      toast.error('Title and description are required');
      return;
    }
    if (!ensureAuthenticated() || !accessToken?.accountId) {
      return;
    }

    setIsSaving(true);
    try {
      if (editingTaskId) {
        await taskService.updateTask(accessToken, editingTaskId, formValues);
        toast.success('Task updated successfully');
      } else {
        await taskService.createTask(accessToken, formValues);
        toast.success('Task created successfully');
      }
      resetForm();
      await loadTasks();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Unable to save task';
      if (err?.response?.status === 401) {
        toast.error('Session expired. Please login again');
        navigate(routes.LOGIN);
      } else if (err?.response?.status === 404) {
        toast.error('Task not found. It may have been deleted.');
        await loadTasks();
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setFormValues({ title: task.title, description: task.description });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (taskId: string) => {
    if (!ensureAuthenticated() || !accessToken?.accountId) {
      return;
    }
    const confirmed = window.confirm('Are you sure you want to delete this task?');
    if (!confirmed) return;

    try {
      await taskService.deleteTask(accessToken, taskId);
      toast.success('Task deleted successfully');
      await loadTasks();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Unable to delete task';
      if (err?.response?.status === 401) {
        toast.error('Session expired. Please login again');
        navigate(routes.LOGIN);
      } else if (err?.response?.status === 404) {
        toast.error('Task not found. It may have already been deleted.');
        await loadTasks();
      } else {
        toast.error(errorMessage);
      }
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="rounded-lg bg-white p-6 shadow-md dark:bg-boxdark">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Tasks</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create, edit, and manage your tasks.
            </p>
          </div>
          {editingTaskId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <form className="grid grid-cols-1 gap-4 md:grid-cols-3" onSubmit={handleSubmit}>
          <div className="md:col-span-1">
            <label
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              htmlFor="task-title"
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="task-title"
              name="title"
              type="text"
              value={formValues.title}
              onChange={(e) => setFormValues({ ...formValues, title: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-boxdark-2 dark:text-white"
              placeholder="Enter task title"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              htmlFor="task-description"
            >
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="task-description"
              name="description"
              value={formValues.description}
              onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-boxdark-2 dark:text-white"
              placeholder="What needs to be done?"
              rows={3}
              required
            />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={isSaving || !formValues.title || !formValues.description}
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:bg-opacity-60"
            >
              {isSaving ? (
                <>
                  <svg
                    className="mr-2 h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </>
              ) : editingTaskId ? (
                'Update Task'
              ) : (
                'Add Task'
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-md dark:bg-boxdark">
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
          Your Tasks ({tasks.length})
        </h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <svg
              className="h-8 w-8 animate-spin text-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading tasks...</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No tasks yet. Create your first task above.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start justify-between rounded-md border border-gray-200 p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:hover:shadow-lg"
              >
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    {task.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {task.description}
                  </p>
                </div>
                <div className="ml-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(task)}
                    className="rounded-md border border-primary px-3 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-white dark:border-primary dark:text-primary"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(task.id)}
                    className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksPage;

