import { createClient, createConfig } from './generated/client';
import type { Client } from './generated/client';
import * as api from './generated/sdk.gen';
import type {
  CreateAgentDto,
  CreateAuthConfigDto,
  CreateConnectedAccountLinkDto,
  CreateMcpServerDto,
  CreateSkillDto,
  CreateThreadDto,
  CreateToolkitDto,
  ExecuteToolDto,
  ResumeWorkflowExecutionDto,
  TriggerWorkflowDto,
  UpdateWorkflowStatusDto,
  UpdateSkillDto,
  UpsertTriggerInstanceDto,
  AuthConfigControllerGetAuthConfigsData,
  ConnectedAccountsControllerGetConnectedAccountsData,
  ExternalUsersControllerCreateData,
  ExternalUsersControllerListData,
  FileControllerGetFilesData,
  FileControllerUploadSingleFileData,
  GraphifyControllerGetThreadHistoryData,
  GraphifyControllerListRunsData,
  GraphifyControllerCancelRunData,
  GraphifyControllerJoinThreadRunStreamData,
  GraphifyControllerSearchThreadsData,
  GraphifyControllerSendOperatorReplyData,
  GraphifyControllerSetThreadReplyModeData,
  GraphifyControllerStreamThreadRunData,
  GraphifyControllerUpdateThreadData,
  BrowserControllerBrowserViewData,
  FileControllerDeleteManyFilesData,
  FileControllerPruneOldestFilesData,
  KnowledgeControllerCreateCollectionData,
  KnowledgeControllerDeleteSourceData,
  KnowledgeControllerGetChunksData,
  KnowledgeControllerIngestFileData,
  KnowledgeControllerIngestTextData,
  KnowledgeControllerIngestUrlData,
  KnowledgeControllerRenameCollectionData,
  KnowledgeControllerSearchCollectionData,
  KnowledgeControllerSetExposeViaMcpData,
  LlmControllerChatData,
  LlmControllerGenerateData,
  AiModelControllerGetModelsData,
  McpControllerHandleHostedPostData,
  McpControllerHandlePostData,
  McpManagerControllerCreateMcpServerData,
  McpManagerControllerListMcpServersData,
  McpManagerControllerUpdateMcpServerData,
  SandboxControllerCreateSessionData,
  SandboxControllerExecuteInSessionData,
  SandboxControllerRunEphemeralData,
  SkillsControllerCatalogBrowseData,
  SkillsControllerImportGithubData,
  SkillsControllerListData,
  SkillsControllerRegistryInstallData,
  SkillsControllerRegistryListData,
  SkillsControllerRegistrySearchData,
  TableControllerCreateDocumentData,
  TableControllerGetCollectionDocumentsData,
  TableControllerSetCollectionExposeViaMcpData,
  TableControllerUpdateDocumentData,
  ToolkitsControllerCreateToolkitData,
  ToolkitsControllerGetToolkitsData,
  ToolkitsControllerGetToolkitsWithToolsData,
  ToolkitsControllerUpdateToolkitData,
  ToolsControllerGetToolsData,
  TriggersControllerGetTriggerInstancesData,
  TriggersControllerGetTriggerInvocationLogsData,
  WorkflowManagerControllerAddConnectionData,
  WorkflowManagerControllerChangeConnectionData,
  WorkflowManagerControllerClearAuthConfigData,
  WorkflowManagerControllerClearConnectionData,
  WorkflowManagerControllerGetWorkflowExecutionsData,
  WorkflowManagerControllerListData,
  WorkflowManagerControllerSetAuthConfigData,
  WorkflowManagerControllerUpdateData,
  UsageControllerListData,
} from './generated/types.gen';
import type { StreamUsageEvent } from './stream-usage';
export type { StreamUsageEvent } from './stream-usage';
export { parseSseChunk, extractStreamUsage } from './stream-usage';

export type FlowraOptions = {
  /** Project API key (sent as `x-api-key`). */
  apiKey: string;
  /** API origin. Defaults to `https://flowra.dev`. */
  baseUrl?: string;
  /** Optional external user to act as (`x-username`). */
  username?: string;
  /** Throw on non-2xx responses. Defaults to `true`. */
  throwOnError?: boolean;
};

function unwrapData<T>(result: { data?: T; error?: unknown }): T {
  if (result.error) {
    throw result.error instanceof Error
      ? result.error
      : new Error(typeof result.error === 'string' ? result.error : JSON.stringify(result.error));
  }
  return result.data as T;
}

/**
 * Flowra SDK — product facade over the generated OpenAPI client.
 *
 * Every API-key endpoint is also on {@link Flowra.raw}.
 */
export class Flowra {
  readonly client: Client;
  readonly raw = api;
  private readonly options: FlowraOptions;

  constructor(options: FlowraOptions) {
    this.options = options;
    const headers: Record<string, string> = {};
    if (options.username) {
      headers['x-username'] = options.username;
    }

    this.client = createClient(
      createConfig({
        baseUrl: options.baseUrl ?? 'https://flowra.dev',
        auth: options.apiKey,
        headers,
        throwOnError: options.throwOnError ?? true,
      }),
    );
  }

  /** Return a client scoped to a different external user. */
  asUser(username: string): Flowra {
    return new Flowra({
      ...this.options,
      username,
    });
  }

  /** GET /api/v1/users/profile */
  async getProfile() {
    return unwrapData(await api.usersControllerGetProfile({ client: this.client }));
  }

  readonly tools = {
    list: async (query?: ToolsControllerGetToolsData['query']) =>
      unwrapData(await api.toolsControllerGetTools({ client: this.client, query })),

    get: async (id: string) =>
      unwrapData(await api.toolsControllerGetToolById({ client: this.client, path: { id } })),

    create: async (body: NonNullable<Parameters<typeof api.toolsControllerCreateTool>[0]>['body']) =>
      unwrapData(await api.toolsControllerCreateTool({ client: this.client, body })),

    update: async (
      id: string,
      body: NonNullable<Parameters<typeof api.toolsControllerUpdateTool>[0]>['body'],
    ) =>
      unwrapData(await api.toolsControllerUpdateTool({ client: this.client, path: { id }, body })),

    remove: async (id: string) =>
      unwrapData(await api.toolsControllerDeleteTool({ client: this.client, path: { id } })),

    setActive: async (id: string) =>
      unwrapData(await api.toolsControllerActiveStatus({ client: this.client, path: { id } })),

    execute: async (toolSlug: string, body: ExecuteToolDto = {}) =>
      unwrapData(
        await api.toolsControllerExecuteTool({
          client: this.client,
          path: { toolSlug },
          body,
        }),
      ),

    executionLogs: async (
      query?: Parameters<typeof api.toolsControllerGetToolExecutionLogs>[0] extends infer O
        ? O extends { query?: infer Q }
          ? Q
          : never
        : never,
    ) =>
      unwrapData(await api.toolsControllerGetToolExecutionLogs({ client: this.client, query })),
  };

  readonly toolkits = {
    list: async (query?: ToolkitsControllerGetToolkitsData['query']) =>
      unwrapData(await api.toolkitsControllerGetToolkits({ client: this.client, query })),

    listWithTools: async (query?: ToolkitsControllerGetToolkitsWithToolsData['query']) =>
      unwrapData(await api.toolkitsControllerGetToolkitsWithTools({ client: this.client, query })),

    get: async (id: string) =>
      unwrapData(await api.toolkitsControllerGetToolkitById({ client: this.client, path: { id } })),

    create: async (body: CreateToolkitDto | ToolkitsControllerCreateToolkitData['body']) =>
      unwrapData(await api.toolkitsControllerCreateToolkit({ client: this.client, body })),

    update: async (id: string, body: ToolkitsControllerUpdateToolkitData['body']) =>
      unwrapData(await api.toolkitsControllerUpdateToolkit({ client: this.client, path: { id }, body })),

    remove: async (id: string) =>
      unwrapData(await api.toolkitsControllerDeleteToolkit({ client: this.client, path: { id } })),

    setActive: async (id: string) =>
      unwrapData(await api.toolkitsControllerActiveStatus({ client: this.client, path: { id } })),

    messagingChannels: async () =>
      unwrapData(await api.toolkitsControllerGetMessagingChannels({ client: this.client })),

    listCategories: async () =>
      unwrapData(await api.toolkitsControllerListCategories({ client: this.client })),
  };

  readonly skills = {
    list: async (query?: SkillsControllerListData['query']) =>
      unwrapData(await api.skillsControllerList({ client: this.client, query })),

    get: async (id: string) =>
      unwrapData(await api.skillsControllerDetail({ client: this.client, path: { id } })),

    create: async (body: CreateSkillDto) =>
      unwrapData(await api.skillsControllerCreate({ client: this.client, body })),

    update: async (id: string, body: UpdateSkillDto) =>
      unwrapData(await api.skillsControllerUpdate({ client: this.client, path: { id }, body })),

    remove: async (id: string) =>
      unwrapData(await api.skillsControllerRemove({ client: this.client, path: { id } })),

    addToLibrary: async (id: string) =>
      unwrapData(await api.skillsControllerAddToLibrary({ client: this.client, path: { id } })),

    catalogBrowse: async (query?: SkillsControllerCatalogBrowseData['query']) =>
      unwrapData(await api.skillsControllerCatalogBrowse({ client: this.client, query })),

    importGithub: async (body: SkillsControllerImportGithubData['body']) =>
      unwrapData(await api.skillsControllerImportGithub({ client: this.client, body })),

    registryInstall: async (body: SkillsControllerRegistryInstallData['body']) =>
      unwrapData(await api.skillsControllerRegistryInstall({ client: this.client, body })),

    registryList: async (query?: SkillsControllerRegistryListData['query']) =>
      unwrapData(await api.skillsControllerRegistryList({ client: this.client, query })),

    registrySearch: async (query: SkillsControllerRegistrySearchData['query']) =>
      unwrapData(await api.skillsControllerRegistrySearch({ client: this.client, query })),

    registrySync: async (id: string) =>
      unwrapData(
        await this.client.post({
          url: `/api/v1/skills/registry/sync/${id}`,
        }),
      ),
  };

  readonly workflows = {
    list: async (query?: WorkflowManagerControllerListData['query']) =>
      unwrapData(await api.workflowManagerControllerList({ client: this.client, query })),

    get: async (id: string) =>
      unwrapData(await api.workflowManagerControllerDetail({ client: this.client, path: { id } })),

    create: async (body: CreateAgentDto) =>
      unwrapData(await api.workflowManagerControllerCreate({ client: this.client, body })),

    update: async (id: string, body: WorkflowManagerControllerUpdateData['body']) =>
      unwrapData(await api.workflowManagerControllerUpdate({ client: this.client, path: { id }, body })),

    remove: async (id: string) =>
      unwrapData(await api.workflowManagerControllerDelete({ client: this.client, path: { id } })),

    setActive: async (id: string, body: UpdateWorkflowStatusDto) =>
      unwrapData(
        await api.workflowManagerControllerUpdateStatus({
          client: this.client,
          path: { id },
          body,
        }),
      ),

    run: async (id: string, body: TriggerWorkflowDto = {}) =>
      unwrapData(
        await api.workflowManagerControllerExecute({
          client: this.client,
          path: { id },
          body,
        }),
      ),

    status: async (threadId: string) =>
      unwrapData(
        await api.workflowManagerControllerGetExecutionStatus({
          client: this.client,
          path: { threadId },
        }),
      ),

    resume: async (threadId: string, body: ResumeWorkflowExecutionDto = {}) =>
      unwrapData(
        await api.workflowManagerControllerResumeExecution({
          client: this.client,
          path: { threadId },
          body,
        }),
      ),

    executions: async (
      query?: Parameters<typeof api.workflowManagerControllerGetExecutions>[0] extends infer O
        ? O extends { query?: infer Q }
          ? Q
          : never
        : never,
    ) =>
      unwrapData(await api.workflowManagerControllerGetExecutions({ client: this.client, query })),

    execution: async (id: string) =>
      unwrapData(
        await api.workflowManagerControllerGetExecutionDetail({
          client: this.client,
          path: { id },
        }),
      ),

    statistics: async (id: string) =>
      unwrapData(
        await api.workflowManagerControllerGetWorkflowStatistics({
          client: this.client,
          path: { id },
        }),
      ),

    executionsFor: async (
      id: string,
      query?: WorkflowManagerControllerGetWorkflowExecutionsData['query'],
    ) =>
      unwrapData(
        await api.workflowManagerControllerGetWorkflowExecutions({
          client: this.client,
          path: { id },
          query,
        }),
      ),

    addConnection: async (body: WorkflowManagerControllerAddConnectionData['body']) =>
      unwrapData(await api.workflowManagerControllerAddConnection({ client: this.client, body })),

    changeConnection: async (
      id: string,
      body: WorkflowManagerControllerChangeConnectionData['body'],
    ) =>
      unwrapData(
        await api.workflowManagerControllerChangeConnection({
          client: this.client,
          path: { id },
          body,
        }),
      ),

    setAuthConfig: async (id: string, body: WorkflowManagerControllerSetAuthConfigData['body']) =>
      unwrapData(
        await api.workflowManagerControllerSetAuthConfig({
          client: this.client,
          path: { id },
          body,
        }),
      ),

    clearAuthConfig: async (
      id: string,
      body: WorkflowManagerControllerClearAuthConfigData['body'],
    ) =>
      unwrapData(
        await api.workflowManagerControllerClearAuthConfig({
          client: this.client,
          path: { id },
          body,
        }),
      ),

    clearConnection: async (
      id: string,
      body: WorkflowManagerControllerClearConnectionData['body'],
    ) =>
      unwrapData(
        await api.workflowManagerControllerClearConnection({
          client: this.client,
          path: { id },
          body,
        }),
      ),
  };

  readonly connections = {
    list: async (query?: ConnectedAccountsControllerGetConnectedAccountsData['query']) =>
      unwrapData(
        await api.connectedAccountsControllerGetConnectedAccounts({
          client: this.client,
          query,
        }),
      ),

    listGrouped: async () =>
      unwrapData(
        await api.connectedAccountsControllerGetConnectedAccountsGroupedByToolkit({
          client: this.client,
        }),
      ),

    create: async (
      body: NonNullable<
        Parameters<typeof api.connectedAccountsControllerCreateConnectedAccount>[0]
      >['body'],
    ) =>
      unwrapData(
        await api.connectedAccountsControllerCreateConnectedAccount({
          client: this.client,
          body,
        }),
      ),

    createLink: async (body: CreateConnectedAccountLinkDto) =>
      unwrapData(
        await api.connectedAccountsControllerCreateConnectedAccountLink({
          client: this.client,
          body,
        }),
      ),

    update: async (
      id: string,
      body: NonNullable<
        Parameters<typeof api.connectedAccountsControllerUpdateConnectedAccount>[0]
      >['body'],
    ) =>
      unwrapData(
        await api.connectedAccountsControllerUpdateConnectedAccount({
          client: this.client,
          path: { id },
          body,
        }),
      ),

    remove: async (id: string) =>
      unwrapData(
        await api.connectedAccountsControllerDeleteConnectedAccount({
          client: this.client,
          path: { id },
        }),
      ),
  };

  readonly authConfigs = {
    list: async (query?: AuthConfigControllerGetAuthConfigsData['query']) =>
      unwrapData(await api.authConfigControllerGetAuthConfigs({ client: this.client, query })),

    get: async (id: string) =>
      unwrapData(await api.authConfigControllerGetAuthConfigById({ client: this.client, path: { id } })),

    create: async (body: CreateAuthConfigDto) =>
      unwrapData(await api.authConfigControllerCreateAuthConfig({ client: this.client, body })),

    remove: async (id: string) =>
      unwrapData(await api.authConfigControllerDeleteAuthConfig({ client: this.client, path: { id } })),
  };

  readonly users = {
    list: async (query?: ExternalUsersControllerListData['query']) =>
      unwrapData(await api.externalUsersControllerList({ client: this.client, query })),

    create: async (body: ExternalUsersControllerCreateData['body']) =>
      unwrapData(await api.externalUsersControllerCreate({ client: this.client, body })),

    getByUsername: async (username: string) =>
      unwrapData(
        await api.externalUsersControllerGetByUsername({
          client: this.client,
          path: { username },
        }),
      ),

    toggleActive: async (id: string) =>
      unwrapData(
        await api.externalUsersControllerToggleActive({
          client: this.client,
          path: { id },
        }),
      ),

    refreshAvatar: async (id: string) =>
      unwrapData(
        await api.externalUsersControllerRefreshAvatar({
          client: this.client,
          path: { id },
        }),
      ),
  };

  readonly triggers = {
    list: async (query?: TriggersControllerGetTriggerInstancesData['query']) =>
      unwrapData(await api.triggersControllerGetTriggerInstances({ client: this.client, query })),

    upsert: async (slug: string, body: UpsertTriggerInstanceDto) =>
      unwrapData(
        await api.triggersControllerUpsertTriggerInstance({
          client: this.client,
          path: { slug },
          body,
        }),
      ),

    remove: async (triggerId: string) =>
      unwrapData(
        await api.triggersControllerDeleteTriggerInstanceManage({
          client: this.client,
          path: { triggerId },
        }),
      ),

    setStatus: async (triggerId: string) =>
      unwrapData(
        await api.triggersControllerUpdateTriggerInstanceStatus({
          client: this.client,
          path: { triggerId },
        }),
      ),

    invocationLogs: async (query?: TriggersControllerGetTriggerInvocationLogsData['query']) =>
      unwrapData(
        await api.triggersControllerGetTriggerInvocationLogs({ client: this.client, query }),
      ),

    replayWebhook: async (logId: string) =>
      unwrapData(
        await api.triggersControllerReplayInvocationWebhook({
          client: this.client,
          path: { logId },
        }),
      ),
  };

  readonly chat = {
    createThread: async (body: CreateThreadDto = {}) =>
      unwrapData(await api.graphifyControllerCreateThread({ client: this.client, body })),

    getThread: async (thread_id: string) =>
      unwrapData(await api.graphifyControllerGetThread({ client: this.client, path: { thread_id } })),

    updateThread: async (thread_id: string, body: GraphifyControllerUpdateThreadData['body']) =>
      unwrapData(
        await api.graphifyControllerUpdateThread({
          client: this.client,
          path: { thread_id },
          body,
        }),
      ),

    deleteThread: async (thread_id: string) =>
      unwrapData(
        await api.graphifyControllerDeleteThread({ client: this.client, path: { thread_id } }),
      ),

    searchThreads: async (body: GraphifyControllerSearchThreadsData['body']) =>
      unwrapData(await api.graphifyControllerSearchThreads({ client: this.client, body })),

    history: async (thread_id: string, body: GraphifyControllerGetThreadHistoryData['body'] = {}) =>
      unwrapData(
        await api.graphifyControllerGetThreadHistory({
          client: this.client,
          path: { thread_id },
          body,
        }),
      ),

    state: async (thread_id: string) =>
      unwrapData(
        await api.graphifyControllerGetThreadState({ client: this.client, path: { thread_id } }),
      ),

    stream: async (thread_id: string, body: GraphifyControllerStreamThreadRunData['body']) =>
      unwrapData(
        await api.graphifyControllerStreamThreadRun({
          client: this.client,
          path: { thread_id },
          body,
        }),
      ),

    listRuns: async (
      thread_id: string,
      query: GraphifyControllerListRunsData['query'] = {
        limit: 20,
        offset: 0,
      },
    ) =>
      unwrapData(
        await api.graphifyControllerListRuns({
          client: this.client,
          path: { thread_id },
          query,
        }),
      ),

    cancelRun: async (
      thread_id: string,
      run_id: string,
      query: GraphifyControllerCancelRunData['query'] = { wait: 'false', action: 'interrupt' },
    ) =>
      unwrapData(
        await api.graphifyControllerCancelRun({
          client: this.client,
          path: { thread_id, run_id },
          query,
        }),
      ),

    generateTitle: async (thread_id: string) =>
      unwrapData(
        await api.graphifyControllerGenerateThreadTitle({
          client: this.client,
          path: { thread_id },
        }),
      ),

    sendOperatorReply: async (
      thread_id: string,
      body: GraphifyControllerSendOperatorReplyData['body'],
    ) =>
      unwrapData(
        await api.graphifyControllerSendOperatorReply({
          client: this.client,
          path: { thread_id },
          body,
        }),
      ),

    setReplyMode: async (
      thread_id: string,
      body: GraphifyControllerSetThreadReplyModeData['body'],
    ) =>
      unwrapData(
        await api.graphifyControllerSetThreadReplyMode({
          client: this.client,
          path: { thread_id },
          body,
        }),
      ),

    joinStream: async (
      thread_id: string,
      run_id: string,
      query?: GraphifyControllerJoinThreadRunStreamData['query'],
      headers?: GraphifyControllerJoinThreadRunStreamData['headers'],
    ) =>
      unwrapData(
        await api.graphifyControllerJoinThreadRunStream({
          client: this.client,
          path: { thread_id, run_id },
          query,
          headers,
        }),
      ),
  };

  readonly files = {
    list: async (query?: FileControllerGetFilesData['query']) =>
      unwrapData(await api.fileControllerGetFiles({ client: this.client, query })),

    upload: async (
      fileType: FileControllerUploadSingleFileData['path']['fileType'],
      body: FileControllerUploadSingleFileData['body'],
    ) =>
      unwrapData(
        await api.fileControllerUploadSingleFile({
          client: this.client,
          path: { fileType },
          body,
          // multipart handled by generated serializer when FormData is passed
        } as never),
      ),

    remove: async (id: string) =>
      unwrapData(await api.fileControllerDeleteFile({ client: this.client, path: { id } })),

    download: async (id: string) =>
      unwrapData(await api.fileControllerDownloadFile({ client: this.client, path: { id } })),

    storageBreakdown: async () =>
      unwrapData(await api.fileControllerGetStorageBreakdown({ client: this.client })),

    serveByFilename: async (filename: string) =>
      unwrapData(
        await api.fileControllerServeFileByFilename({ client: this.client, path: { filename } }),
      ),

    deleteMany: async (body: FileControllerDeleteManyFilesData['body']) =>
      unwrapData(await api.fileControllerDeleteManyFiles({ client: this.client, body })),

    fileType: async (fileType: string) =>
      unwrapData(await api.fileControllerFileType({ client: this.client, path: { fileType } })),

    fileTypes: async () =>
      unwrapData(await api.fileControllerFileTypeList({ client: this.client })),

    pruneOldest: async (body: FileControllerPruneOldestFilesData['body']) =>
      unwrapData(await api.fileControllerPruneOldestFiles({ client: this.client, body })),
  };

  readonly knowledge = {
    list: async () =>
      unwrapData(await api.knowledgeControllerGetCollections({ client: this.client })),

    create: async (body: KnowledgeControllerCreateCollectionData['body']) =>
      unwrapData(await api.knowledgeControllerCreateCollection({ client: this.client, body })),

    get: async (id: string) =>
      unwrapData(await api.knowledgeControllerGetCollection({ client: this.client, path: { id } })),

    rename: async (id: string, body: KnowledgeControllerRenameCollectionData['body']) =>
      unwrapData(
        await api.knowledgeControllerRenameCollection({
          client: this.client,
          path: { id },
          body,
        }),
      ),

    remove: async (id: string) =>
      unwrapData(await api.knowledgeControllerDeleteCollection({ client: this.client, path: { id } })),

    chunks: async (id: string, query?: KnowledgeControllerGetChunksData['query']) =>
      unwrapData(
        await api.knowledgeControllerGetChunks({ client: this.client, path: { id }, query }),
      ),

    sources: async (id: string) =>
      unwrapData(await api.knowledgeControllerGetSources({ client: this.client, path: { id } })),

    deleteSource: async (id: string, body: KnowledgeControllerDeleteSourceData['body']) =>
      unwrapData(
        await api.knowledgeControllerDeleteSource({
          client: this.client,
          path: { id },
          body,
        }),
      ),

    ingestFile: async (id: string, body: KnowledgeControllerIngestFileData['body']) =>
      unwrapData(
        await api.knowledgeControllerIngestFile({
          client: this.client,
          path: { id },
          body,
        }),
      ),

    ingestText: async (id: string, body: KnowledgeControllerIngestTextData['body']) =>
      unwrapData(
        await api.knowledgeControllerIngestText({
          client: this.client,
          path: { id },
          body,
        }),
      ),

    ingestUrl: async (id: string, body: KnowledgeControllerIngestUrlData['body']) =>
      unwrapData(
        await api.knowledgeControllerIngestUrl({
          client: this.client,
          path: { id },
          body,
        }),
      ),

    search: async (id: string, body: KnowledgeControllerSearchCollectionData['body']) =>
      unwrapData(
        await api.knowledgeControllerSearchCollection({
          client: this.client,
          path: { id },
          body,
        }),
      ),

    setExposeViaMcp: async (id: string, body: KnowledgeControllerSetExposeViaMcpData['body']) =>
      unwrapData(
        await api.knowledgeControllerSetExposeViaMcp({
          client: this.client,
          path: { id },
          body,
        }),
      ),
  };

  readonly database = {
    list: async () =>
      unwrapData(await api.tableControllerGetCollections({ client: this.client })),

    get: async (id: string) =>
      unwrapData(
        await api.tableControllerGetCollectionMetadata({ client: this.client, path: { id } }),
      ),

    remove: async (id: string) =>
      unwrapData(await api.tableControllerDeleteCollection({ client: this.client, path: { id } })),

    documents: async (id: string, query?: TableControllerGetCollectionDocumentsData['query']) =>
      unwrapData(
        await api.tableControllerGetCollectionDocuments({
          client: this.client,
          path: { id },
          query,
        }),
      ),

    createDocument: async (
      collectionId: string,
      body: TableControllerCreateDocumentData['body'],
    ) =>
      unwrapData(
        await api.tableControllerCreateDocument({
          client: this.client,
          path: { collectionId },
          body,
        }),
      ),

    updateDocument: async (
      collectionId: string,
      documentId: string,
      body: TableControllerUpdateDocumentData['body'],
    ) =>
      unwrapData(
        await api.tableControllerUpdateDocument({
          client: this.client,
          path: { collectionId, documentId },
          body,
        }),
      ),

    deleteDocument: async (collectionId: string, documentId: string) =>
      unwrapData(
        await api.tableControllerDeleteDocument({
          client: this.client,
          path: { collectionId, documentId },
        }),
      ),

    setExposeViaMcp: async (id: string, body: TableControllerSetCollectionExposeViaMcpData['body']) =>
      unwrapData(
        await api.tableControllerSetCollectionExposeViaMcp({
          client: this.client,
          path: { id },
          body,
        }),
      ),
  };

  readonly sandbox = {
    runEphemeral: async (body: SandboxControllerRunEphemeralData['body']) =>
      unwrapData(await api.sandboxControllerRunEphemeral({ client: this.client, body })),

    createSession: async (body: SandboxControllerCreateSessionData['body'] = {}) =>
      unwrapData(await api.sandboxControllerCreateSession({ client: this.client, body })),

    getSession: async (id: string) =>
      unwrapData(await api.sandboxControllerGetSession({ client: this.client, path: { id } })),

    execute: async (id: string, body: SandboxControllerExecuteInSessionData['body']) =>
      unwrapData(
        await api.sandboxControllerExecuteInSession({
          client: this.client,
          path: { id },
          body,
        }),
      ),

    releaseSession: async (id: string) =>
      unwrapData(await api.sandboxControllerReleaseSession({ client: this.client, path: { id } })),

    startThreadComputer: async (threadId: string) =>
      unwrapData(
        await api.sandboxControllerStartThreadComputer({
          client: this.client,
          path: { threadId },
        }),
      ),

    getThreadComputer: async (threadId: string) =>
      unwrapData(
        await api.sandboxControllerGetThreadComputer({
          client: this.client,
          path: { threadId },
        }),
      ),

    releaseThreadComputer: async (threadId: string) =>
      unwrapData(
        await api.sandboxControllerReleaseThreadComputer({
          client: this.client,
          path: { threadId },
        }),
      ),
  };

  readonly mcp = {
    list: async (query?: McpManagerControllerListMcpServersData['query']) =>
      unwrapData(await api.mcpManagerControllerListMcpServers({ client: this.client, query })),

    get: async (id: string) =>
      unwrapData(await api.mcpManagerControllerGetMcpServer({ client: this.client, path: { id } })),

    create: async (body: CreateMcpServerDto | McpManagerControllerCreateMcpServerData['body']) =>
      unwrapData(await api.mcpManagerControllerCreateMcpServer({ client: this.client, body })),

    update: async (id: string, body: McpManagerControllerUpdateMcpServerData['body']) =>
      unwrapData(
        await api.mcpManagerControllerUpdateMcpServer({
          client: this.client,
          path: { id },
          body,
        }),
      ),

    remove: async (id: string) =>
      unwrapData(await api.mcpManagerControllerDeleteMcpServer({ client: this.client, path: { id } })),

    config: async (id: string) =>
      unwrapData(
        await api.mcpManagerControllerGetMcpServerConfig({ client: this.client, path: { id } }),
      ),

    setAuthConfig: async (
      id: string,
      body: { toolkitSlug: string; authConfigId: string },
    ) =>
      unwrapData(
        await api.mcpManagerControllerSetAuthConfig({
          client: this.client,
          path: { id },
          body,
        } as never),
      ),

    clearAuthConfig: async (id: string, body: { toolkitSlug: string }) =>
      unwrapData(
        await api.mcpManagerControllerClearAuthConfig({
          client: this.client,
          path: { id },
          body,
        } as never),
      ),

    hostedSse: async () =>
      unwrapData(await api.mcpControllerHandleHostedSse({ client: this.client })),

    hostedPost: async (body: McpControllerHandleHostedPostData['body']) =>
      unwrapData(await api.mcpControllerHandleHostedPost({ client: this.client, body })),

    handleSse: async (serverId: string) =>
      unwrapData(await api.mcpControllerHandleSse({ client: this.client, path: { serverId } })),

    handlePost: async (serverId: string, body: McpControllerHandlePostData['body']) =>
      unwrapData(
        await api.mcpControllerHandlePost({
          client: this.client,
          path: { serverId },
          body,
        }),
      ),
  };

  readonly llm = {
    models: async (query: AiModelControllerGetModelsData['query'] = { kind: 'chat' }) =>
      unwrapData(await api.aiModelControllerGetModels({ client: this.client, query })),

    chat: async (body: LlmControllerChatData['body']) =>
      unwrapData(await api.llmControllerChat({ client: this.client, body })),

    generate: async (body: LlmControllerGenerateData['body']) =>
      unwrapData(await api.llmControllerGenerate({ client: this.client, body })),
  };

  readonly browser = {
    status: async (sessionId: string) =>
      unwrapData(
        await api.browserControllerBrowserStatus({ client: this.client, path: { sessionId } }),
      ),

    touch: async (sessionId: string) =>
      unwrapData(
        await api.browserControllerBrowserTouch({ client: this.client, path: { sessionId } }),
      ),

    close: async (sessionId: string) =>
      unwrapData(
        await api.browserControllerBrowserClose({ client: this.client, path: { sessionId } }),
      ),

    view: async (sessionId: string, query: BrowserControllerBrowserViewData['query']) =>
      unwrapData(
        await api.browserControllerBrowserView({
          client: this.client,
          path: { sessionId },
          query,
        }),
      ),

    completeConnection: async (sessionId: string) =>
      unwrapData(
        await api.browserControllerCompleteBrowserConnection({
          client: this.client,
          path: { sessionId },
        }),
      ),
  };

  readonly usage = {
    list: async (query?: UsageControllerListData['query']) =>
      unwrapData(await api.usageControllerList({ client: this.client, query })),

    balance: async () => unwrapData(await api.usageControllerBalance({ client: this.client })),

    forExecution: async (executionId: string) =>
      unwrapData(
        await api.usageControllerExecutionUsage({
          client: this.client,
          path: { executionId },
        }),
      ),
  };
}
