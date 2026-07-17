// MVP Implementation: Project Manager Provider
import type {
  ProjectManagerProvider,
  ProjectSpec,
  ProjectTask,
  TaskAssignment,
} from "../plugin-sdk/project-manager.js";

export const createMvpProjectManagerProvider = (): ProjectManagerProvider => {
  const projects = new Map<string, { spec: ProjectSpec; tasks: ProjectTask[] }>();

  return {
    id: "project-manager-mvp-ref",
    label: "MVP Project Manager (Reference)",
    capabilities: ["task-planning", "scheduling", "progress-tracking", "risk-management"],

    createProject: async (spec: ProjectSpec) => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const projectId = `project-${Date.now()}`;
      projects.set(projectId, { spec, tasks: [] });
      return { projectId };
    },

    planTasks: async (projectId: string, goals: string[]) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const tasks: ProjectTask[] = [];
      goals.forEach((goal, goalIndex) => {
        const mainTask: ProjectTask = {
          id: `task-${projectId}-${goalIndex}`,
          title: goal,
          description: `Implementation task for: ${goal}`,
          status: "backlog",
          priority: goalIndex === 0 ? "critical" : "high",
          estimatedHours: Math.floor(Math.random() * 40) + 10,
          subtasks: [
            {
              id: `subtask-${projectId}-${goalIndex}-1`,
              title: `Research and analysis for ${goal}`,
              status: "backlog",
              priority: "high",
              estimatedHours: 8,
            },
            {
              id: `subtask-${projectId}-${goalIndex}-2`,
              title: `Implementation of ${goal}`,
              status: "backlog",
              priority: "high",
              estimatedHours: 16,
            },
            {
              id: `subtask-${projectId}-${goalIndex}-3`,
              title: `Testing and validation`,
              status: "backlog",
              priority: "medium",
              estimatedHours: 6,
            },
          ],
        };
        tasks.push(mainTask);
      });

      if (projects.has(projectId)) {
        const project = projects.get(projectId)!;
        project.tasks = tasks;
      }
      return tasks;
    },

    assignWork: async (projectId: string, assignments: TaskAssignment[]) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      const errors: string[] = [];
      if (!projects.has(projectId)) {
        errors.push(`Project ${projectId} not found`);
      }
      return {
        assigned: Math.max(0, assignments.length - errors.length),
        errors,
      };
    },

    trackProgress: async (projectId: string) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const project = projects.get(projectId);
      const spec = project?.spec;

      if (!spec) {
        return {
          id: projectId,
          name: "Unknown Project",
          onTrack: false,
          completionPercent: 0,
          tasksTotal: 0,
          tasksDone: 0,
          tasksBlocked: 0,
          lastUpdated: Date.now(),
        };
      }

      const tasksTotal = project?.tasks.length || 0;
      const tasksDone = Math.floor(tasksTotal * 0.35);
      const tasksBlocked = Math.floor(tasksTotal * 0.1);

      return {
        id: projectId,
        name: spec.name,
        onTrack: true,
        completionPercent: tasksTotal > 0 ? (tasksDone / tasksTotal) * 100 : 0,
        tasksTotal,
        tasksDone,
        tasksBlocked,
        budgetUsed: spec.budget ? Math.floor(spec.budget * 0.42) : undefined,
        budgetTotal: spec.budget,
        timeRemaining: Math.max(0, (spec.endDate - Date.now()) / 3600000),
        risks: [
          "Resource allocation timeline",
          "External dependency delays",
          "Technical complexity",
        ],
        lastUpdated: Date.now(),
      };
    },

    generateReport: async (projectId: string) => {
      await new Promise((resolve) => setTimeout(resolve, 700));
      const project = projects.get(projectId);
      return {
        summary: `Project Status Report for ${project?.spec.name || "Project"}: On track with 35% completion. All critical milestones on schedule.`,
        metrics: {
          velocity: 12,
          burndownRate: 0.15,
          riskScore: 0.25,
          teamCapacity: 0.85,
          budgetUtilization: 0.42,
        },
      };
    },

    updateTaskStatus: async (_taskId: string, _status) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return true;
    },

    identifyRisks: async (_projectId: string) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return [
        "Resource availability in Q3",
        "Third-party API latency",
        "Data migration complexity",
        "Team coordination across timezones",
        "Technology stack compatibility",
      ];
    },
  };
};
