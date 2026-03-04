import { db } from "@/db";
import {
  EmailRecipient,
  apiKeys,
  emailEvents,
  emailRecipients,
  emails,
  gmailAccounts,
} from "@/db/schema";
import { hash } from "@/lib/crypto-helpers";
import { isValidEventType, isValidEventSource } from "@/lib/email-enums";
import { sendEmail } from "@/lib/send-email";
import { extractEmailAddress, validateEmail } from "@/lib/utils";
import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse, after } from "next/server";

export async function POST(request: NextRequest) {
  const headersList = await headers();
  const auth = headersList.get("Authorization");
  if (!auth) {
    return NextResponse.json({ statusCode: 401, message: "Missing API Key", name: "missing_api_key" }, { status: 401 });
  }

  const apiKey = auth.split(" ")[1];
  const hashedApiKey = hash(apiKey);

  const apiKeyRecord = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.apiKey, hashedApiKey),
  });

  if (!apiKeyRecord) {
    return NextResponse.json({ statusCode: 403, message: "API key is invalid", name: "invalid_api_Key" }, { status: 403 });
  }

  let reqBody: any;
  try {
    reqBody = await request.json();
  } catch (error) {
    return NextResponse.json({ statusCode: 400, message: "Invalid JSON payload", name: "invalid_json_payload" }, { status: 400 });
  }

  const requiredFields = ["from", "to", "subject"];
  for (const field of requiredFields) {
    if (!reqBody[field]) {
      return NextResponse.json({ statusCode: 422, message: `Missing \`${field}\` field`, name: "missing_required_field" }, { status: 422 });
    }
  }

  const fromAddress = extractEmailAddress(reqBody.from);
  const gmailAccount = await db.query.gmailAccounts.findFirst({
    where: and(eq(gmailAccounts.userId, apiKeyRecord.userId), eq(gmailAccounts.email, fromAddress)),
  });

  if (!gmailAccount) {
    return NextResponse.json({ statusCode: 403, message: `The \`${fromAddress}\` gmail account is not linked to your account.`, name: "invalid_from_address" }, { status: 403 });
  }

  const emailId = randomUUID();

  after(async () => {
    try {
      const replyTo = reqBody.reply_to ? JSON.stringify(reqBody.reply_to) : null;
      await db.insert(emails).values({
        id: emailId,
        userId: apiKeyRecord.userId,
        apiKeyId: apiKeyRecord.id,
        from: reqBody.from,
        subject: reqBody.subject,
        replyTo,
        textContent: reqBody.text ?? null,
        htmlContent: reqBody.html ?? null,
      });

      // Store business metadata in email_events table if provided
      if (reqBody.event_type || reqBody.event_source) {
        const eventType = reqBody.event_type || "unknown";
        const eventSource = reqBody.event_source || "api-v3";
        
        // Validate event types and sources if provided
        if (reqBody.event_type && !isValidEventType(reqBody.event_type)) {
          console.warn(`Invalid event_type: ${reqBody.event_type}`);
        }
        if (reqBody.event_source && !isValidEventSource(reqBody.event_source)) {
          console.warn(`Invalid event_source: ${reqBody.event_source}`);
        }

        await db.insert(emailEvents).values({
          id: randomUUID(),
          emailId,
          eventType,
          eventSource,
          organizationId: reqBody.organization_id || null,
          businessUserId: reqBody.business_user_id || null,
          correlationId: reqBody.correlation_id || null,
          metadata: reqBody.metadata || null,
        });
      }

      const recipients: EmailRecipient[] = [];
      for (const type of ["to", "cc", "bcc"] as const) {
        if (reqBody[type]) {
          const list = Array.isArray(reqBody[type]) ? reqBody[type] : [reqBody[type]];
          for (const recipient of list) {
            recipients.push({ id: randomUUID(), emailId, recepientEmail: recipient, type });
          }
        }
      }
      if (recipients.length > 0) await db.insert(emailRecipients).values(recipients);

      await sendEmail(emailId);
    } catch (e) {
      console.error("v3 background error:", e);
    }
  });

  return NextResponse.json({ id: emailId }, { status: 200 });
}
