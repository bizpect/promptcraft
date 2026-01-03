import type { RpcArrayResult } from "@/lib/db/repositories/types";

export function ensureArray<Row>(data: RpcArrayResult<Row>): Row[] {
  if (Array.isArray(data)) {
    return data;
  }

  return [];
}
