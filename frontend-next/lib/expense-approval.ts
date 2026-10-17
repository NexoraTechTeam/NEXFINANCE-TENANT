/** User feedback for the two-step (dual control) expense approval. */
export interface ApprovalResult {
  status?: string;
  approvals?: unknown[];
}

export function approvalMessage(expense: ApprovalResult): string {
  if (expense.status === 'approved') return 'Pengeluaran disetujui dan dicatat ke jurnal.';
  const done = expense.approvals?.length ?? 0;
  return `Persetujuan ${done} dari 2 tercatat — menunggu persetujuan orang kedua.`;
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  const message = (error as { response?: { data?: { error?: unknown } } })?.response?.data?.error;
  return typeof message === 'string' && message ? message : fallback;
}
