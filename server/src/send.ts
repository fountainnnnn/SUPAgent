import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

interface SendRequest {
  to?: string;
  subject: string;
  body: string;
}

interface SendResponse {
  ok: boolean;
  error?: string;
  to?: string;
  messageId?: string;
}

router.post('/', async (req, res): Promise<void> => {
  const { to, subject, body } = req.body as SendRequest;

  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;
  const allowedRecipientsStr = process.env.ALLOWED_RECIPIENTS || '';
  const demoRecipient = process.env.DEMO_RECIPIENT;

  // Parse allow-listed recipients (comma-separated, case-insensitive, trimmed)
  const allowedRecipients = allowedRecipientsStr
    .split(',')
    .map((r) => r.trim().toLowerCase())
    .filter((r) => r.length > 0);

  // Resolve recipient
  let recipient: string;
  if (to && to !== 'self') {
    const trimmedTo = to.trim();
    if (!allowedRecipients.includes(trimmedTo.toLowerCase())) {
      res.status(403).json({
        ok: false,
        error: 'recipient not allow-listed',
        to: trimmedTo,
      } as SendResponse);
      return;
    }
    recipient = trimmedTo;
  } else {
    recipient = demoRecipient || gmailUser || '';
  }

  // Check if email is configured
  if (!gmailUser || !gmailPassword) {
    res.json({
      ok: false,
      error: 'email not configured',
      to: recipient,
    } as SendResponse);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: gmailUser,
        pass: gmailPassword,
      },
    });

    const info = await transporter.sendMail({
      from: gmailUser,
      to: recipient,
      subject,
      text: body,
    });

    res.json({
      ok: true,
      to: recipient,
      messageId: info.messageId,
    } as SendResponse);
  } catch (err) {
    res.json({
      ok: false,
      error: String(err),
      to: recipient,
    } as SendResponse);
  }
});

export default router;
