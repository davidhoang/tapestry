// Resend email integration (migrated from SendGrid)
import { Resend } from 'resend';
import type { SelectList } from "@db/schema";

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email
  };
}

// Get a fresh Resend client (tokens can expire)
async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    const { client } = await getResendClient();
    
    const { data, error } = await client.emails.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      html: params.html || params.text || '',
      text: params.text,
    });

    if (error) {
      console.error('Resend email error:', error);
      throw new Error(error.message);
    }

    console.log(`Email successfully sent to ${params.to}`);
    console.log('Resend response:', { id: data?.id });
    return true;
  } catch (error: any) {
    console.error('Resend email error:', error);
    throw error;
  }
}

export async function sendListEmail(
  list: SelectList,
  recipientEmail: string,
  subject: string,
  summary: string,
) {
  const baseUrl = process.env.BASE_URL || 'https://design-matchmaker.proofofconcept.pub';

  function getPhotoUrl(url: string | null): string | null {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const absoluteUrl = baseUrl + (url.startsWith('/') ? url : `/${url}`);
    return absoluteUrl;
  }

  const designersHtml =
    list.designers
      ?.map(
        ({ designer, notes }) => {
          const photoUrl = getPhotoUrl(designer.photoUrl);
          return `
    <div style="margin-bottom: 24px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: white;">
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        ${
          photoUrl
            ? `<img src="${photoUrl}" 
                   alt="${designer.name}" 
                   style="width: 48px; height: 48px; border-radius: 9999px; margin-right: 16px; object-fit: cover;">`
            : `<div style="width: 48px; height: 48px; border-radius: 9999px; background-color: #e5e7eb; margin-right: 16px; display: flex; align-items: center; justify-content: center; font-weight: 500; color: #6b7280;">${designer.name
                .split(" ")
                .map((n) => n[0])
                .join("")}</div>`
        }
        <div>
          <h3 style="margin: 0; font-size: 16px; font-weight: 500;">
            ${designer.linkedIn ? 
              `<a href="${designer.linkedIn}" style="color: #111827; text-decoration: none; hover: text-decoration: underline;">${designer.name}</a>` :
              designer.name
            }
          </h3>
          <p style="margin: 0; font-size: 14px; color: #6b7280;">${designer.title}</p>
        </div>
      </div>
      ${
        notes
          ? `
        <div style="margin-top: 8px; padding-left: 64px;">
          <p style="margin: 0; font-size: 14px; font-weight: 500;">Notes:</p>
          <p style="margin: 0; font-size: 14px; color: #6b7280;">${notes}</p>
        </div>
      `
          : ""
      }
    </div>
  `}
      )
      .join("") || "";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${list.name} - Designer List</title>
      </head>
      <body style="font-family: system, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; margin: 0; padding: 24px; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: #111827;">${list.name}</h1>
          ${summary ? `<p style="margin: 0 0 24px 0; color: #6b7280;">${summary}</p>` : ""}
          <div style="margin-top: 24px;">
            ${designersHtml}
          </div>
          <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">
            Shared via <a href="${baseUrl}" style="color: #6b7280; text-decoration: none; font-weight: 500;">Design Talent Match</a>
          </p>
          <p style="margin-top: 8px; font-size: 12px; color: #9ca3af;">
            <a href="${baseUrl}/lists/${list.id}" style="color: #6b7280; text-decoration: none;">View this list online</a>
          </p>
        </div>
      </body>
    </html>
  `;

  try {
    const { client, fromEmail } = await getResendClient();
    
    const senderEmail = "onboarding@resend.dev";
    
    const { data, error } = await client.emails.send({
      to: recipientEmail,
      from: senderEmail,
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('Resend email error:', error);
      throw new Error(error.message);
    }

    console.log(`List email sent to ${recipientEmail}`, { id: data?.id });
  } catch (error: any) {
    console.error("Error sending email:", error);
    throw error;
  }
}
