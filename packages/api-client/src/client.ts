import { EventSourceParserStream, type EventSourceMessage } from "eventsource-parser/stream";
import axios, { type AxiosInstance } from "axios";
import {
  type AgentExecutionRecord,
  type AgentInputContentBlock,
  type AgentStatus,
  type ClientLogger,
  type ExecuteOptions,
  type ExecutionAccepted,
  type ExecutionControlResult,
  type FinalDeliveryClaimResponse,
  type FinalDeliveryMutationResult,
  type MessageAccepted,
  type MessageOptions,
  type ReleaseThreadResult,
  type SpawnOptions,
  type SpawnResult,
  type StreamEvent,
  type ThreadExecutionSummary,
  type ThreadMessageRecord,
  type WorkflowEventAccepted,
  type WorkflowRunAccepted,
  type WorkflowRunOptions,
} from "./types";

export type {
  AgentExecutionRecord,
  AgentInputContentBlock,
  AgentStatus,
  ExecuteOptions,
  ExecutionAccepted,
  ExecutionControlResult,
  FinalDeliveryClaimResponse,
  FinalDeliveryMutationResult,
  InputContentBlock,
  MessageAccepted,
  MessageOptions,
  ReleaseThreadResult,
  SpawnOptions,
  SpawnResult,
  StreamEvent,
  ThreadExecutionSummary,
  ThreadMessageRecord,
  WorkflowEventAccepted,
  WorkflowRunAccepted,
  WorkflowRunOptions,
} from "./types";

export class CentaurClient {
  readonly http: AxiosInstance;
  private log?: ClientLogger;

  constructor(opts: {
    apiUrl: string;
    apiKey: string;
    timeoutMs?: number;
    logger?: ClientLogger;
  }) {
    this.log = opts.logger;
    this.http = axios.create({
      baseURL: opts.apiUrl,
      headers: { Authorization: `Bearer ${opts.apiKey}` },
      timeout: opts.timeoutMs ?? 30_000,
    });
  }

  private get authHeader(): string {
    return (this.http.defaults.headers["Authorization"] ??
      this.http.defaults.headers.common?.["Authorization"]) as string;
  }

  async spawn(opts: SpawnOptions): Promise<SpawnResult> {
    const { data } = await this.http.post("/agent/spawn", {
      thread_key: opts.threadKey,
      spawn_id: opts.spawnId,
      harness: opts.harness,
      engine: opts.engine,
      persona_id: opts.personaId,
      agents_md_override: opts.agentsMdOverride,
    });
    return data as SpawnResult;
  }

  async message(opts: MessageOptions): Promise<MessageAccepted> {
    const body: Record<string, unknown> = {
      thread_key: opts.threadKey,
      assignment_generation: opts.assignmentGeneration,
      message_id: opts.messageId,
      metadata: opts.metadata,
      user_id: opts.userId,
    };

    if (opts.event) {
      body.event = opts.event;
    } else {
      body.role = opts.role ?? "user";
      body.parts = opts.parts ?? [];
    }

    const { data } = await this.http.post("/agent/message", body);
    return data as MessageAccepted;
  }

  async execute(opts: ExecuteOptions): Promise<ExecutionAccepted> {
    const { data } = await this.http.post("/agent/execute", {
      thread_key: opts.threadKey,
      assignment_generation: opts.assignmentGeneration,
      execute_id: opts.executeId,
      harness: opts.harness,
      platform: opts.platform,
      user_id: opts.userId,
      metadata: opts.metadata,
      delivery: opts.delivery,
    });
    return data as ExecutionAccepted;
  }

  async startWorkflowRun(opts: WorkflowRunOptions): Promise<WorkflowRunAccepted> {
    const { data } = await this.http.post("/workflows/runs", {
      workflow_name: opts.workflowName,
      trigger_key: opts.triggerKey,
      input: opts.input ?? {},
      eager_start: opts.eagerStart ?? false,
    }, {
      timeout: opts.timeoutMs,
    });
    return data as WorkflowRunAccepted;
  }

  async getWorkflowRun(runId: string): Promise<WorkflowRunAccepted> {
    const { data } = await this.http.get(`/workflows/runs/${encodeURIComponent(runId)}`);
    return data as WorkflowRunAccepted;
  }

  async listWorkflowRuns(opts?: {
    workflowName?: string;
    threadKey?: string;
    status?: string;
    parentRunId?: string;
    limit?: number;
  }): Promise<{ ok: boolean; items: WorkflowRunAccepted[] }> {
    const { data } = await this.http.get("/workflows/runs", {
      params: {
        workflow_name: opts?.workflowName,
        thread_key: opts?.threadKey,
        status: opts?.status,
        parent_run_id: opts?.parentRunId,
        limit: opts?.limit,
      },
    });
    return data as { ok: boolean; items: WorkflowRunAccepted[] };
  }

  async getWorkflowChildren(runId: string, limit = 200): Promise<{ ok: boolean; items: WorkflowRunAccepted[] }> {
    const { data } = await this.http.get(`/workflows/runs/${encodeURIComponent(runId)}/children`, {
      params: { limit },
    });
    return data as { ok: boolean; items: WorkflowRunAccepted[] };
  }

  async cancelWorkflowRun(runId: string): Promise<WorkflowRunAccepted> {
    const { data } = await this.http.post(`/workflows/runs/${encodeURIComponent(runId)}/cancel`);
    return data as WorkflowRunAccepted;
  }

  async sendWorkflowEvent(opts: {
    eventType: string;
    correlationId: string;
    payload?: Record<string, unknown>;
  }): Promise<WorkflowEventAccepted> {
    const { data } = await this.http.post("/workflows/events", {
      event_type: opts.eventType,
      correlation_id: opts.correlationId,
      payload: opts.payload ?? {},
    });
    return data as WorkflowEventAccepted;
  }

  async *streamEvents(opts: {
    threadKey: string;
    afterEventId?: number;
    executionId?: string;
    pollMs?: number;
    signal?: AbortSignal;
  }): AsyncGenerator<StreamEvent, void, undefined> {
    const params = new URLSearchParams();
    if (opts.afterEventId !== undefined) params.set("after_event_id", String(opts.afterEventId));
    if (opts.executionId) params.set("execution_id", opts.executionId);
    if (opts.pollMs !== undefined) params.set("poll_ms", String(opts.pollMs));

    const url = `${this.http.defaults.baseURL}/agent/threads/${encodeURIComponent(opts.threadKey)}/events?${params.toString()}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: this.authHeader,
        "X-Centaur-Thread-Key": opts.threadKey,
      },
      signal: opts.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`/agent/threads/{thread}/events failed (${res.status}): ${text.slice(0, 300)}`);
    }
    if (!res.body) return;

    const stream = (res.body as ReadableStream<Uint8Array>)
      .pipeThrough(new TextDecoderStream() as unknown as TransformStream<Uint8Array, string>)
      .pipeThrough(new EventSourceParserStream());

    for await (const event of stream as unknown as AsyncIterable<EventSourceMessage>) {
      if (!event.data || event.data === "[DONE]") continue;
      let parsed: StreamEvent["data"] = { type: "unknown", raw: event.data };
      try {
        const value = JSON.parse(event.data) as unknown;
        parsed = assertStreamData(value);
      } catch {
        // keep raw fallback
      }
      yield {
        eventId: Number(event.id || 0),
        eventKind: event.event || "message",
        data: parsed,
      };
    }
  }

  async getExecution(executionId: string): Promise<AgentExecutionRecord> {
    const { data } = await this.http.get(`/agent/executions/${encodeURIComponent(executionId)}`);
    return data as AgentExecutionRecord;
  }

  async getMessages(threadKey: string, opts?: { cursor?: string; limit?: number }): Promise<{
    messages: ThreadMessageRecord[];
    cursor: string | null;
    has_more: boolean;
  }> {
    const { data } = await this.http.get("/agent/messages", {
      params: {
        thread_key: threadKey,
        cursor: opts?.cursor,
        limit: opts?.limit ?? 50,
      },
    });
    return data as {
      messages: ThreadMessageRecord[];
      cursor: string | null;
      has_more: boolean;
    };
  }

  async listExecutions(threadKey: string, limit = 20): Promise<{
    thread_key: string;
    executions: ThreadExecutionSummary[];
  }> {
    const { data } = await this.http.get(
      `/agent/threads/${encodeURIComponent(threadKey)}/executions`,
      { params: { limit } },
    );
    return data as { thread_key: string; executions: ThreadExecutionSummary[] };
  }

  async cancelExecution(executionId: string): Promise<ExecutionControlResult> {
    const { data } = await this.http.post(`/agent/executions/${encodeURIComponent(executionId)}/cancel`);
    return data as ExecutionControlResult;
  }

  async steerExecution(
    executionId: string,
    opts?: {
      contentBlocks?: AgentInputContentBlock[];
      messageId?: string;
      userId?: string;
      metadata?: Record<string, unknown>;
      suppressCancellationDelivery?: boolean;
    },
  ): Promise<ExecutionControlResult> {
    const { data } = await this.http.post(`/agent/executions/${encodeURIComponent(executionId)}/steer`, {
      content_blocks: opts?.contentBlocks,
      message_id: opts?.messageId,
      user_id: opts?.userId,
      metadata: {
        ...(opts?.metadata || {}),
        ...(opts?.suppressCancellationDelivery === undefined
          ? {}
          : { steer_replacement: opts.suppressCancellationDelivery }),
      },
    });
    return data as ExecutionControlResult;
  }

  async releaseThread(
    threadKey: string,
    opts?: { releaseId?: string; cancelInflight?: boolean },
  ): Promise<ReleaseThreadResult> {
    const { data } = await this.http.post(
      `/agent/threads/${encodeURIComponent(threadKey)}/release`,
      {
        release_id: opts?.releaseId,
        cancel_inflight: opts?.cancelInflight ?? false,
      },
    );
    return data as ReleaseThreadResult;
  }

  async claimFinalDeliveries(opts: {
    consumerId: string;
    limit?: number;
    leaseSeconds?: number;
    platform?: string;
  }): Promise<FinalDeliveryClaimResponse> {
    const { data } = await this.http.post("/agent/final-deliveries/claim", {
      consumer_id: opts.consumerId,
      limit: opts.limit ?? 1,
      lease_seconds: opts.leaseSeconds ?? 60,
      platform: opts.platform,
    });
    return data as FinalDeliveryClaimResponse;
  }

  async renewFinalDeliveryLease(
    executionId: string,
    opts: { consumerId: string; leaseSeconds?: number },
  ): Promise<FinalDeliveryMutationResult> {
    const { data } = await this.http.post(
      `/agent/final-deliveries/${encodeURIComponent(executionId)}/heartbeat`,
      {
        consumer_id: opts.consumerId,
        lease_seconds: opts.leaseSeconds ?? 60,
      },
    );
    return data as FinalDeliveryMutationResult;
  }

  async markFinalDelivered(
    executionId: string,
    consumerId?: string,
  ): Promise<FinalDeliveryMutationResult> {
    const { data } = await this.http.post(
      `/agent/final-deliveries/${encodeURIComponent(executionId)}/delivered`,
      { consumer_id: consumerId },
    );
    return data as FinalDeliveryMutationResult;
  }

  async markFinalFailed(
    executionId: string,
    error: string,
    opts?: {
      consumerId?: string;
      retryAfterSeconds?: number;
      nonRetryable?: boolean;
      errorClass?: string;
    },
  ): Promise<FinalDeliveryMutationResult> {
    const { data } = await this.http.post(
      `/agent/final-deliveries/${encodeURIComponent(executionId)}/failed`,
      {
        consumer_id: opts?.consumerId,
        error,
        retry_after_seconds: opts?.retryAfterSeconds ?? 15,
        non_retryable: opts?.nonRetryable ?? false,
        error_class: opts?.errorClass,
      },
    );
    return data as FinalDeliveryMutationResult;
  }

  async getStatus(threadKey: string): Promise<AgentStatus> {
    const { data } = await this.http.get("/agent/status", { params: { key: threadKey } });
    return data as AgentStatus;
  }
}

function assertStreamData(value: unknown): StreamEvent["data"] {
  const record = assertRecord(value);
  if (typeof record.type !== "string") throw new Error("stream event data missing type");
  return record as StreamEvent["data"];
}

function assertRecord(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("expected object");
  }
  return value as Record<string, unknown>;
}
