import { BaseAgent } from '../base-agent';
import { AgentRole, AgentTask, AgentContext } from '../types/base-types';
import { EventType } from '../types/event-types';
import { ProviderAdapter } from '../llm/provider-adapter';

export interface ReviewResult {
	status: 'approved' | 'changes_requested' | 'rejected';
	comments: Array<{
		file: string;
		line?: number;
		severity: 'info' | 'warning' | 'error';
		message: string;
		suggestion?: string;
	}>;
	metrics: {
		quality: number;
		coverage: number;
		complexity: number;
		maintainability: number;
	};
	recommendations: string[];
}

export class ReviewerAgent extends BaseAgent {
	private reviews: Map<string, ReviewResult> = new Map();
	private qualityThresholds: {
		minQuality: number;
		minCoverage: number;
		maxComplexity: number;
		minMaintainability: number;
	};
	private providerAdapter: ProviderAdapter;

	constructor(id: string, initialContext: AgentContext) {
		super(
			id,
			AgentRole.REVIEWER,
			[{ 
				role: AgentRole.REVIEWER, 
				confidence: 1, 
				specialties: ['code_review', 'design_review', 'security_audit'] 
			}],
			initialContext
		);

		this.qualityThresholds = this.initializeThresholds();
		this.providerAdapter = ProviderAdapter.getInstance();
	}

	async analyzeTask(task: AgentTask): Promise<boolean> {
		return ['code_review', 'design_review', 'security_audit'].includes(task.type);
	}

	async executeTask(task: AgentTask): Promise<unknown> {
		const response = await this.providerAdapter.generateResponse({
			role: AgentRole.REVIEWER,
			task: task.type,
			context: {
				task: task,
				currentReviews: Array.from(this.reviews.values()),
				qualityThresholds: this.qualityThresholds,
				context: this.context
			}
		}, {
			preferredProvider: 'Anthropic',
			model: 'claude-3-opus-latest'
		});

		switch (task.type) {
			case 'code_review':
				return this.handleCodeReview(task, response);
			case 'design_review':
				return this.handleDesignReview(task, response);
			case 'security_audit':
				return this.handleSecurityAudit(task, response);
			default:
				throw new Error(`Unsupported task type: ${task.type}`);
		}
	}

	async reviewOutput(output: unknown): Promise<boolean> {
		const result = output as ReviewResult;
		return this.validateReviewOutput(result);
	}

	private async handleCodeReview(task: AgentTask, response: string): Promise<ReviewResult> {
		// Collaborate with Coder for context
		await this.requestCollaboration(AgentRole.CODER, {
			type: 'implementation',
			component: task.context.component
		});

		const review = await this.performCodeReview(task);
		this.reviews.set(task.id, review);

		if (review.status === 'changes_requested') {
			await this.delegateSubtask(
				{
					id: crypto.randomUUID(),
					type: 'bug_fix',
					role: AgentRole.CODER,
					priority: task.priority,
					description: 'Fix issues found in code review',
					dependencies: [task.id],
					status: 'pending',
					context: {
						review: review
					}
				},
				AgentRole.CODER
			);
		}

		return review;
	}

	private async handleDesignReview(task: AgentTask, response: string): Promise<ReviewResult> {
		// Collaborate with Architect for context
		await this.requestCollaboration(AgentRole.ARCHITECT, {
			type: 'system_design',
			component: task.context.component
		});

		const review = this.parseReviewResponse(response);
		this.reviews.set(task.id, review);

		return review;
	}

	private async handleSecurityAudit(task: AgentTask, response: string): Promise<ReviewResult> {
		const review = this.parseReviewResponse(response);
		this.reviews.set(task.id, review);

		if (review.status === 'rejected') {
			await this.delegateSubtask(
				{
					id: crypto.randomUUID(),
					type: 'security_fix',
					role: AgentRole.CODER,
					priority: task.priority + 1, // Higher priority for security issues
					description: 'Fix security vulnerabilities found in audit',
					dependencies: [task.id],
					status: 'pending',
					context: {
						review: review
					}
				},
				AgentRole.CODER
			);
		}

		return review;
	}

	private parseReviewResponse(response: string): ReviewResult {
		try {
			const parsedResponse = JSON.parse(response);
			return {
				status: parsedResponse.status || 'changes_requested',
				comments: parsedResponse.comments || [],
				metrics: {
					quality: parsedResponse.metrics?.quality || 0,
					coverage: parsedResponse.metrics?.coverage || 0,
					complexity: parsedResponse.metrics?.complexity || 0,
					maintainability: parsedResponse.metrics?.maintainability || 0
				},
				recommendations: parsedResponse.recommendations || []
			};
		} catch (error) {
			return {
				status: 'changes_requested',
				comments: [{
					file: 'response',
					severity: 'error',
					message: 'Failed to parse LLM response',
					suggestion: 'Review response format'
				}],
				metrics: {
					quality: 0,
					coverage: 0,
					complexity: 0,
					maintainability: 0
				},
				recommendations: ['Review and fix response parsing']
			};
		}
	}

	private validateReviewOutput(review: ReviewResult): boolean {
		if (!review) return false;

		const validStatus = ['approved', 'changes_requested', 'rejected'].includes(review.status);
		const validComments = Array.isArray(review.comments) && review.comments.every(c => 
			c.file && c.severity && c.message
		);
		const validMetrics = 
			review.metrics.quality >= 0 &&
			review.metrics.coverage >= 0 &&
			review.metrics.complexity >= 0 &&
			review.metrics.maintainability >= 0;

		return validStatus && validComments && validMetrics;
	}

	private initializeThresholds(): {
		minQuality: number;
		minCoverage: number;
		maxComplexity: number;
		minMaintainability: number;
	} {
		return {
			minQuality: 0.8,
			minCoverage: 0.85,
			maxComplexity: 20,
			minMaintainability: 0.7
		};
	}
}