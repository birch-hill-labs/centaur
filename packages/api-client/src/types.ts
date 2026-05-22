// Re-export AxiosError as the standard error type for consumers.
export { AxiosError as ApiError } from "axios";

type ApiObject = Record<string, unknown>;

export type ClientLogValue = string | number | boolean | null | ApiObject | Error;
export type ClientLogger = {
  info: (...values: ClientLogValue[]) => void;
  warn: (...values: ClientLogValue[]) => void;
  error: (...values: ClientLogValue[]) => void;
};

export type AgentMessageRole = "user" | "assistant" | "system" | "tool";
export type AgentExecutionStatus =
  | "queued"
  | "running"
  | "retry_wait"
  | "cancel_requested"
  | "completed"
  | "failed_permanent"
  | "cancelled";

export type AgentTerminalReason =
  | "completed"
  | "cancel_requested"
  | "cancelled"
  | "released"
  | "harness_error"
  | "harness_auth_failed"
  | "amp_reconnect_timeout"
  | "assignment_missing"
  | "execution_error"
  | "stream_ended_without_turn_done"
  | "hard_deadline_exceeded"
  | "silence_deadline_exceeded";

export interface Base64Source extends ApiObject {
  type: "base64";
  media_type: string;
  data: string;
}

export interface TextContentBlock extends ApiObject {
  type: "text";
  text: string;
}

export interface BinaryContentBlock extends ApiObject {
  type: "image" | "document" | "file";
  name?: string;
  mime_type?: string;
  size?: number;
  slack_file_id?: string;
  source_path?: string;
  source: Base64Source;
}

export interface AttachmentRefContentBlock extends ApiObject {
  type: "attachment_ref";
  id?: string;
  attachment_id?: string;
  name: string;
  mime_type?: string;
  media_type?: string;
  source_path?: string;
  source_url?: string;
}

export interface ToolUseContentBlock extends ApiObject {
  type: "tool_use";
  id: string;
  name: string;
  input: ApiObject;
}

export interface ToolResultContentBlock extends ApiObject {
  type: "tool_result";
  tool_use_id: string;
  content?: unknown;
  is_error?: boolean;
}

export type AgentInputContentBlock =
  | TextContentBlock
  | BinaryContentBlock
  | AttachmentRefContentBlock;

export type AgentContentBlock =
  | AgentInputContentBlock
  | ToolUseContentBlock
  | ToolResultContentBlock;

export type InputContentBlock = AgentInputContentBlock;

export interface AgentMessagePayload extends ApiObject {
  role?: AgentMessageRole;
  content: AgentContentBlock[] | string;
  usage?: ApiObject;
  model?: string;
}

export interface AgentMessageEvent extends ApiObject {
  type: "user" | "assistant";
  message: AgentMessagePayload;
}

export interface SpawnOptions {
  threadKey: string;
  spawnId?: string;
  harness?: string;
  engine?: string;
  personaId?: string;
  agentsMdOverride?: string;
}

export interface SpawnResult extends ApiObject {
  ok: boolean;
  runtime_id: string;
  thread_key: string;
  trace_id?: string;
  assignment_state: string;
  assignment_generation: number;
  persona_id?: string | null;
  prompt_ref?: string | null;
  effective_agents_md_sha256?: string | null;
}

export interface MessageOptions {
  threadKey: string;
  assignmentGeneration: number;
  messageId?: string;
  role?: AgentMessageRole;
  event?: AgentMessageEvent;
  parts?: AgentInputContentBlock[];
  userId?: string;
  metadata?: ApiObject;
}

export interface MessageAccepted extends ApiObject {
  ok: boolean;
  message_id: string;
  stored_event_id?: string;
  attachment_ids: string[];
  idempotent?: boolean;
}

export interface ExecuteOptions {
  threadKey: string;
  assignmentGeneration: number;
  executeId?: string;
  harness?: string;
  platform?: string;
  userId?: string;
  metadata?: ApiObject;
  delivery?: AgentDelivery;
}

export interface ExecutionAccepted extends ApiObject {
  ok: boolean;
  execution_id: string;
  execute_id: string;
  assignment_generation: number;
  status: AgentExecutionStatus;
  final_key: string;
  delivery_token: string;
  idempotent?: boolean;
}

export interface WorkflowRunOptions {
  workflowName: string;
  triggerKey?: string;
  input?: ApiObject;
  eagerStart?: boolean;
  timeoutMs?: number;
}

export interface WorkflowRunAccepted extends ApiObject {
  ok: boolean;
  run_id: string;
  workflow_name: string;
  workflow_version?: string;
  workflow_source_path?: string | null;
  parent_run_id?: string | null;
  root_run_id?: string | null;
  status: string;
  thread_key?: string | null;
  execution_id?: string | null;
  output_json?: unknown;
  error_text?: string | null;
  latest_checkpoint_name?: string | null;
  latest_step_kind?: string | null;
  waiting_on?: ApiObject | null;
  child_runs_count?: number;
  created_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  idempotent?: boolean;
}

export interface WorkflowEventAccepted extends ApiObject {
  ok: boolean;
  event_type: string;
  correlation_id: string;
  runs_woken: number;
}

export interface ThreadMessageRecord extends ApiObject {
  id: string;
  role: AgentMessageRole | string;
  parts: AgentInputContentBlock[];
  user_id?: string | null;
  metadata?: ApiObject | null;
  created_at?: string | null;
}

export interface AgentRepoContext extends ApiObject {
  cwd?: string;
  repo_owner?: string;
  repo_name?: string;
  git_ref?: string;
  git_commit?: string;
}

export interface AgentExecutionRecord extends ApiObject {
  execution_id: string;
  thread_key: string;
  assignment_generation: number;
  execute_id: string;
  status: AgentExecutionStatus;
  durable_turn_id?: string | null;
  terminal_reason?: AgentTerminalReason | string | null;
  result_text?: string | null;
  error_text?: string | null;
  agent_thread_id: string;
  metadata: ApiObject;
  created_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  updated_at?: string | null;
}

export interface ThreadExecutionSummary extends ApiObject {
  execution_id: string;
  execute_id: string;
  status: AgentExecutionStatus;
  created_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface AgentDelivery extends ApiObject {
  platform?: string;
  channel?: string;
  channel_id?: string;
  thread_ts?: string;
  recipient_user_id?: string;
  recipient_team_id?: string;
}

export interface FinalDeliveryPayload extends ApiObject {
  execution_id?: string;
  thread_key?: string;
  status?: AgentExecutionStatus;
  terminal_reason?: AgentTerminalReason | string;
  session_title?: string;
  session_header?: string;
  result_text?: string;
  result?: string;
  text?: string;
  final_text?: string;
  message?: string;
  error_text?: string;
  slackbot_streamed_answer_chars?: number;
  agent_thread_id?: string;
  repo_context?: AgentRepoContext;
  suppress_final_delivery?: boolean;
}

export interface FinalDeliveryRecord extends ApiObject {
  execution_id: string;
  thread_key: string;
  trace_id?: string | null;
  traceparent?: string | null;
  attempt_count: number;
  delivery: AgentDelivery | null;
  final_payload: FinalDeliveryPayload | null;
}

export interface FinalDeliveryClaimResponse extends ApiObject {
  deliveries: FinalDeliveryRecord[];
}

export interface FinalDeliveryMutationResult extends ApiObject {
  ok: boolean;
  execution_id: string;
  idempotent?: boolean;
}

export interface ExecutionControlResult extends ApiObject {
  ok: boolean;
  execution_id: string;
  thread_key: string;
  status: AgentExecutionStatus | "steered";
  idempotent?: boolean;
}

export type ReleaseThreadResult =
  | {
      ok: true;
      thread_key: string;
      released: true;
      assignment_generation: number;
      runtime_id: string;
    }
  | {
      ok: true;
      thread_key: string;
      released: false;
      reason: "no_active_assignment" | string;
    };

export interface AgentStatus extends ApiObject {
  thread_key?: string;
  state?: string;
  harness?: string;
  engine?: string;
  pending_messages?: number;
  last_result?: string;
  active_assignment?: {
    assignment_generation: number;
    runtime_id: string;
    harness: string;
    persona_id?: string | null;
    prompt_ref?: string | null;
    effective_agents_md_sha256?: string | null;
    state: string;
  };
}

export interface ToolResultEntry extends ApiObject {
  tool_use_id: string;
  content?: unknown;
  is_error?: boolean;
}

export interface AgentAssistantStreamEvent extends ApiObject {
  type: "assistant";
  message: AgentMessagePayload;
}

export interface AgentUserStreamEvent extends ApiObject {
  type: "user";
  message?: AgentMessagePayload;
  content?: ToolResultEntry[];
}

export interface AgentToolStreamEvent extends ApiObject {
  type: "tool";
  content: ToolResultEntry[];
}

export interface AgentReasoningStreamEvent extends ApiObject {
  type: "reasoning";
  text: string;
}

export interface AgentCommandExecutionStreamEvent extends ApiObject {
  type: "command_execution";
  command?: string;
  aggregated_output?: string;
  exit_code?: number | string | null;
  status?: string;
}

export interface AgentFileChangeStreamEvent extends ApiObject {
  type: "file_change";
  changes: ApiObject[];
}

export interface AgentSubagentStreamEvent extends ApiObject {
  type: "subagent";
  status: string;
  subagent_id: string;
  name?: string;
  summary?: string;
  error?: string;
  activity?: string;
  activities?: Array<{ description: string; toolName?: string }>;
}

export interface AgentResultStreamEvent extends ApiObject {
  type: "result";
  text?: string;
  result?: string;
  result_text?: string;
  error?: string;
  is_error?: boolean;
}

export interface AgentErrorStreamEvent extends ApiObject {
  type: "error";
  error: string;
}

export interface AgentSystemStreamEvent extends ApiObject {
  type: "system" | "session" | "thread.started";
  subtype?: string;
  session_id?: string;
  thread_id?: string;
}

export interface AgentUsageStreamEvent extends ApiObject {
  type: "usage";
  usage: ApiObject;
  model?: string;
  authoritative?: boolean;
}

export interface AgentTurnDoneStreamEvent extends ApiObject {
  type: "turn.done" | "turn.completed";
  turn_id?: number;
  result?: string;
  result_text?: string;
  text?: string;
  error?: string;
  is_error?: boolean;
  repo_context?: AgentRepoContext;
}

export interface AgentExecutionStateEvent extends ApiObject {
  type: "execution.state";
  execution_id: string;
  thread_key: string;
  status: AgentExecutionStatus;
  terminal_reason?: AgentTerminalReason | string;
  result_text?: string;
  error_text?: string;
  agent_thread_id?: string;
  repo_context?: AgentRepoContext;
  suppress_final_delivery?: boolean;
}

export interface FinalDeliveryReadyEvent extends FinalDeliveryPayload {
  type: "final_delivery.ready";
  execution_id: string;
  thread_key: string;
  status: AgentExecutionStatus;
}

export interface FinalDeliveryDeliveredEvent extends ApiObject {
  type: "final_delivery.delivered";
  execution_id: string;
  thread_key: string;
}

export type CodexPassthroughEventType =
  | "turn.plan.updated"
  | "item.started"
  | "item.updated"
  | "item.completed"
  | "item.agentMessage.delta"
  | "item.plan.delta"
  | "item.commandExecution.outputDelta"
  | "item.fileChange.outputDelta"
  | "item.fileChange.patchUpdated"
  | "item.reasoning.summaryTextDelta"
  | "item.reasoning.summaryPartAdded"
  | "item.reasoning.textDelta";

export interface CodexPassthroughStreamEvent extends ApiObject {
  type: CodexPassthroughEventType;
}

export interface ObservationStreamEvent extends ApiObject {
  type: `obs.${string}`;
  execution_id?: string;
  thread_key?: string;
}

export interface ExecutionSummaryStreamEvent extends ApiObject {
  type: "execution.summary";
  execution_id: string;
  thread_key: string;
  status: AgentExecutionStatus;
  terminal_reason?: AgentTerminalReason | string;
}

export interface UnknownStreamData extends ApiObject {
  type: "unknown";
  raw: string;
}

export type AgentStreamData =
  | AgentAssistantStreamEvent
  | AgentUserStreamEvent
  | AgentToolStreamEvent
  | AgentReasoningStreamEvent
  | AgentCommandExecutionStreamEvent
  | AgentFileChangeStreamEvent
  | AgentSubagentStreamEvent
  | AgentResultStreamEvent
  | AgentErrorStreamEvent
  | AgentSystemStreamEvent
  | AgentUsageStreamEvent
  | AgentTurnDoneStreamEvent
  | AgentExecutionStateEvent
  | FinalDeliveryReadyEvent
  | FinalDeliveryDeliveredEvent
  | CodexPassthroughStreamEvent
  | ObservationStreamEvent
  | ExecutionSummaryStreamEvent
  | UnknownStreamData;

export type AgentStreamEventKind =
  | "amp_raw_event"
  | "execution_state"
  | "execution_started"
  | "execution_summary"
  | "final_delivery_ready"
  | "final_delivery_delivered"
  | "assistant_message_observed"
  | "assistant_tool_use_observed"
  | "tool_result_observed"
  | "command_observed"
  | "file_change_observed"
  | "usage_observed"
  | "message";

export interface StreamEvent {
  eventId: number;
  eventKind: AgentStreamEventKind | string;
  data: AgentStreamData;
}

export function isExecutionStateEvent(
  data: AgentStreamData,
): data is AgentExecutionStateEvent {
  return data.type === "execution.state";
}

export function resultTextFromStreamData(data: AgentStreamData): string {
  if (data.type === "execution.state" || data.type === "final_delivery.ready") {
    return typeof data.result_text === "string" ? data.result_text : "";
  }
  if (data.type === "result" || data.type === "turn.done" || data.type === "turn.completed") {
    return firstText(data.result_text, data.result, data.text);
  }
  return "";
}

export function assistantTextFromStreamData(data: AgentStreamData): string {
  if (data.type !== "assistant") return "";
  const content = data.message.content;
  if (typeof content === "string") return content;
  return content
    .filter((part): part is TextContentBlock => part.type === "text")
    .map(part => part.text)
    .filter(Boolean)
    .join("\n");
}

export function textFromStreamData(data: AgentStreamData): string {
  return resultTextFromStreamData(data) || assistantTextFromStreamData(data);
}

export function statusFromStreamData(data: AgentStreamData): AgentExecutionStatus | "" {
  return data.type === "execution.state" ? data.status : "";
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    let text = "";
    try {
      text = assertString(value).trim();
    } catch {
      continue;
    }
    if (text) return text;
  }
  return "";
}

function assertString(value: unknown): string {
  if (typeof value !== "string") throw new Error("expected string");
  return value;
}
