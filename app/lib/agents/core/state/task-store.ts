import { AgentTask } from '../types/base-types';

export class TaskStore {
	private tasks: Map<string, AgentTask> = new Map();
	private tasksByAgent: Map<string, Set<string>> = new Map();

	addTask(task: AgentTask): void {
		this.tasks.set(task.id, task);
		if (task.assignedAgent) {
			if (!this.tasksByAgent.has(task.assignedAgent)) {
				this.tasksByAgent.set(task.assignedAgent, new Set());
			}
			this.tasksByAgent.get(task.assignedAgent)!.add(task.id);
		}
	}

	getTask(id: string): AgentTask | undefined {
		return this.tasks.get(id);
	}

	updateTask(id: string, update: Partial<AgentTask>): AgentTask | undefined {
		const currentTask = this.tasks.get(id);
		if (!currentTask) return undefined;

		const newTask = { ...currentTask, ...update };
		this.tasks.set(id, newTask);
		return newTask;
	}

	getTasksByAgent(agentId: string): AgentTask[] {
		const taskIds = this.tasksByAgent.get(agentId) || new Set();
		return Array.from(taskIds).map(id => this.tasks.get(id)!);
	}

	getTasksByStatus(status: AgentTask['status']): AgentTask[] {
		return Array.from(this.tasks.values()).filter(task => task.status === status);
	}

	removeTask(id: string): boolean {
		const task = this.tasks.get(id);
		if (!task) return false;

		if (task.assignedAgent) {
			const agentTasks = this.tasksByAgent.get(task.assignedAgent);
			if (agentTasks) {
				agentTasks.delete(id);
			}
		}

		return this.tasks.delete(id);
	}
}