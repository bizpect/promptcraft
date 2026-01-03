export type RpcArrayResult<Row> = Row[] | null | { Error: string };

export function normalizeRpcArray<Row>(
  data: RpcArrayResult<Row>
): Row[] {
  if (Array.isArray(data)) {
    return data;
  }

  return [];
}
