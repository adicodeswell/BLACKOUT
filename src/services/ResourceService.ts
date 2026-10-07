import type { DataEngine } from "../contracts/data/DataEngine";
import type { Result } from "../contracts/common/Result";
import type {
  ResourceDto,
  ResourceFilter,
  CreateResourceRequest,
  UpdateResourceRequest,
} from "../contracts/data/ResourceDto";
import type { DataEvent } from "../contracts/data/DataEvents";

export class ResourceService {
  constructor(private readonly dataEngine: DataEngine) {}

  async listResources(filter?: ResourceFilter): Promise<Result<ResourceDto[]>> {
    try {
      return await this.dataEngine.listResources(filter);
    } catch (err) {
      return {
        ok: false,
        error: {
          code: "STORAGE",
          message: err instanceof Error ? err.message : String(err),
          retryable: true,
          module: "DATA",
        },
      };
    }
  }

  async getResource(resourceId: string): Promise<Result<ResourceDto>> {
    try {
      // Use listResources filter fallback if getResource is not directly on DataEngine interface
      const listRes = await this.dataEngine.listResources();
      if (!listRes.ok) return listRes as any;

      const found = listRes.data.find((r) => r.resource_id === resourceId);
      if (!found) {
        return {
          ok: false,
          error: { code: "NOT_FOUND", message: `Resource ${resourceId} not found`, retryable: false, module: "DATA" },
        };
      }
      return { ok: true, data: found };
    } catch (err) {
      return {
        ok: false,
        error: {
          code: "STORAGE",
          message: err instanceof Error ? err.message : String(err),
          retryable: true,
          module: "DATA",
        },
      };
    }
  }

  async createResource(request: CreateResourceRequest): Promise<Result<ResourceDto>> {
    try {
      return await this.dataEngine.createResource(request);
    } catch (err) {
      return {
        ok: false,
        error: {
          code: "STORAGE",
          message: err instanceof Error ? err.message : String(err),
          retryable: true,
          module: "DATA",
        },
      };
    }
  }

  async updateResource(request: UpdateResourceRequest): Promise<Result<ResourceDto>> {
    try {
      return await this.dataEngine.updateResource(request);
    } catch (err) {
      return {
        ok: false,
        error: {
          code: "STORAGE",
          message: err instanceof Error ? err.message : String(err),
          retryable: true,
          module: "DATA",
        },
      };
    }
  }

  subscribeToResourceEvents(listener: (event: DataEvent) => void): () => void {
    return this.dataEngine.subscribe(listener);
  }
}
