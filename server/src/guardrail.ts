import express from 'express';

const router = express.Router();

interface GuardrailRequest {
  action: string;
  amount?: number;
  to?: string;
  verified?: boolean;
}

interface GuardrailResponse {
  allowed: boolean;
  reason?: string;
}

router.post('/', (req, res): void => {
  const { action, amount, to, verified } = req.body as GuardrailRequest;

  const refundCap = Number(process.env.REFUND_CAP ?? 100);
  const allowedRecipientsStr = process.env.ALLOWED_RECIPIENTS || '';

  // Parse allow-listed recipients (comma-separated, case-insensitive, trimmed)
  const allowedRecipients = allowedRecipientsStr
    .split(',')
    .map((r) => r.trim().toLowerCase())
    .filter((r) => r.length > 0);

  // Step 1: Refund cap
  if (action === 'refund' && amount !== undefined && amount >= refundCap) {
    res.json({
      allowed: false,
      reason: `Refund $${amount} exceeds the $${refundCap} auto-approve cap — escalated to a human.`,
    } as GuardrailResponse);
    return;
  }

  // Step 2: Recipient allow-list
  if (to !== undefined) {
    const trimmedTo = to.trim().toLowerCase();
    if (!allowedRecipients.includes(trimmedTo)) {
      res.json({
        allowed: false,
        reason: `Recipient ${to} is not allow-listed — blocked.`,
      } as GuardrailResponse);
      return;
    }
  }

  // Step 3: Identity gate (PII/order/lookup actions)
  if (
    (action.includes('lookup') ||
      action.includes('pii') ||
      action.includes('order')) &&
    verified !== true
  ) {
    res.json({
      allowed: false,
      reason: 'Customer identity not verified — refusing to return account data.',
    } as GuardrailResponse);
    return;
  }

  // Step 4: All checks passed
  res.json({
    allowed: true,
  } as GuardrailResponse);
});

export default router;
