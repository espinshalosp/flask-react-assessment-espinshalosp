import { JsonObject } from 'frontend/types/common-types';

export interface TaskInput {
  title: string;
  description: string;
}

export class Task {
  id: string;
  account_id: string;
  title: string;
  description: string;

  constructor(taskJson: JsonObject) {
    this.id = taskJson.id as string;
    this.account_id = taskJson.account_id as string;
    this.title = taskJson.title as string;
    this.description = taskJson.description as string;
  }
}

export interface PaginationParams {
  page: number;
  size: number;
}

export interface PaginatedTasks {
  items: Task[];
  pagination_params: PaginationParams;
  total_count: number;
  total_pages: number;
}

