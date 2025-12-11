import APIService from 'frontend/services/api.service';
import { AccessToken, ApiResponse } from 'frontend/types';
import { JsonObject } from 'frontend/types/common-types';
import { PaginatedTasks, Task, TaskInput } from 'frontend/types/task';

export default class TaskService extends APIService {
  getTasks = async (
    userAccessToken: AccessToken,
    page?: number,
    size?: number,
  ): Promise<ApiResponse<PaginatedTasks>> => {
    if (!userAccessToken?.accountId) {
      throw new Error('Invalid access token: accountId is missing');
    }
    const response = await this.apiClient.get<JsonObject>(
      `/accounts/${userAccessToken.accountId}/tasks`,
      {
        params: { page, size },
        headers: {
          Authorization: `Bearer ${userAccessToken.token}`,
        },
      },
    );

    const items = (response.data?.items as JsonObject[] | undefined)?.map(
      (taskJson) => new Task(taskJson),
    );

    return new ApiResponse({
      ...response.data,
      items: items ?? [],
      pagination_params: response.data?.pagination_params,
    } as PaginatedTasks);
  };

  createTask = async (
    userAccessToken: AccessToken,
    task: TaskInput,
  ): Promise<ApiResponse<Task>> => {
    if (!userAccessToken?.accountId) {
      throw new Error('Invalid access token: accountId is missing');
    }
    const response = await this.apiClient.post<JsonObject>(
      `/accounts/${userAccessToken.accountId}/tasks`,
      task,
      {
        headers: {
          Authorization: `Bearer ${userAccessToken.token}`,
        },
      },
    );
    return new ApiResponse(new Task(response.data));
  };

  updateTask = async (
    userAccessToken: AccessToken,
    taskId: string,
    task: TaskInput,
  ): Promise<ApiResponse<Task>> => {
    if (!userAccessToken?.accountId) {
      throw new Error('Invalid access token: accountId is missing');
    }
    const response = await this.apiClient.patch<JsonObject>(
      `/accounts/${userAccessToken.accountId}/tasks/${taskId}`,
      task,
      {
        headers: {
          Authorization: `Bearer ${userAccessToken.token}`,
        },
      },
    );
    return new ApiResponse(new Task(response.data));
  };

  deleteTask = async (
    userAccessToken: AccessToken,
    taskId: string,
  ): Promise<ApiResponse<void>> => {
    if (!userAccessToken?.accountId) {
      throw new Error('Invalid access token: accountId is missing');
    }
    await this.apiClient.delete(`/accounts/${userAccessToken.accountId}/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${userAccessToken.token}` },
    });
    return new ApiResponse();
  };
}

