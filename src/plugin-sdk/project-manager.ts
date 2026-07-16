// Compat surface: openclaw/plugin-sdk/project-manager
// Provides stable types and registry for autonomous project management.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Project task status. */
export type TaskStatus = "backlog" | "todo" | "in-progress" | "review" | "done" | "blocked";

/** Task priority level. */
export type TaskPriority = "low" | "medium" | "high" | "critical";

/** Project task. */
export type ProjectTask = {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assignee?: string;
  dueDate?: number;
  priority: TaskPriority;
  dependencies?: string[]; // Task IDs this depends on
  estimatedHours?: number;
  actualHours?: number;
  subtasks?: ProjectTask[];
  metadata?: Record<string, unknown>;
};

/** Project milestone. */
export type Milestone = {
  id: string;
  name: string;
  description?: string;
  dueDate: number;
  progress: number; // 0-1
  tasks: string[]; // Task IDs
};

/** Project timeline. */
export type ProjectTimeline = {
  startDate: number;
  endDate: number;
  milestones: Milestone[];
  criticalPath: string[]; // Task IDs on critical path
  riskFactors?: string[];
  burndownRate?: number;
};

/** Project status. */
export type ProjectStatus = {
  id: string;
  name: string;
  onTrack: boolean;
  completionPercent: number; // 0-100
  tasksTotal: number;
  tasksDone: number;
  tasksBlocked: number;
  budgetUsed?: number;
  budgetTotal?: number;
  timeRemaining?: number; // In hours
  risks?: string[];
  lastUpdated: number;
};

/** Project creation specification. */
export type ProjectSpec = {
  name: string;
  description?: string;
  startDate: number;
  endDate: number;
  budget?: number;
  team?: string[];
  goals?: string[];
  metadata?: Record<string, unknown>;
};

/** Task assignment record. */
export type TaskAssignment = {
  taskId: string;
  assignee: string;
  assignedAt: number;
  estimatedCompletion?: number;
  notes?: string;
};

/** A provider that manages projects autonomously. */
export type ProjectManagerProvider = {
  id: string;
  label: string;
  capabilities: string[]; // e.g., ['task-planning', 'scheduling', 'progress-tracking']
  createProject: (spec: ProjectSpec) => Promise<{ projectId: string }>;
  planTasks: (projectId: string, goals: string[]) => Promise<ProjectTask[]>;
  assignWork: (
    projectId: string,
    assignments: TaskAssignment[],
  ) => Promise<{ assigned: number; errors: string[] }>;
  trackProgress: (projectId: string) => Promise<ProjectStatus>;
  generateReport?: (
    projectId: string,
  ) => Promise<{ summary: string; metrics: Record<string, unknown> }>;
  updateTaskStatus?: (taskId: string, status: TaskStatus) => Promise<boolean>;
  identifyRisks?: (projectId: string) => Promise<string[]>;
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const _registry = new Map<string, ProjectManagerProvider>();

/** Register a project-manager provider. */
export function registerProjectManagerProvider(provider: ProjectManagerProvider): void {
  _registry.set(provider.id, provider);
}

/** Retrieve a registered project-manager provider by ID. */
export function getProjectManagerProvider(id: string): ProjectManagerProvider | null {
  return _registry.get(id) ?? null;
}

/** List all registered project-manager providers. */
export function listProjectManagerProviders(): ProjectManagerProvider[] {
  return [..._registry.values()];
}
