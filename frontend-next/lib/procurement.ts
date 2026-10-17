/** Purchase order status helpers. The API creates POs as "issued"; older data used "ordered". */
const OPEN_STATUSES = new Set(['issued', 'ordered']);

export const canReceivePO = (status: string) => OPEN_STATUSES.has(status);

/** Badge key for a status (issued and ordered share the "ordered" badge). */
export const poStatusKey = (status: string) => (OPEN_STATUSES.has(status) ? 'ordered' : status);

type ListBody = { purchaseRequests?: unknown[]; purchaseOrders?: unknown[]; prs?: unknown[]; pos?: unknown[] } | undefined | null;

/** Rows from GET /procurement/pr (API key `purchaseRequests`; `prs` kept for older responses). */
export const prsFrom = <T = unknown>(body: ListBody): T[] => (body?.purchaseRequests ?? body?.prs ?? []) as T[];

/** Rows from GET /procurement/po (API key `purchaseOrders`; `pos` kept for older responses). */
export const posFrom = <T = unknown>(body: ListBody): T[] => (body?.purchaseOrders ?? body?.pos ?? []) as T[];
