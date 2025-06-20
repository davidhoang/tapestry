import sgMail from "@sendgrid/mail";
import type { SelectList } from "@db/schema";

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY is required");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  const msg = {
    to: params.to,
    from: {
      email: params.from,
      name: "Tapestry Team",
    },
    subject: params.subject,
    html: params.html || params.text,
  };

  try {
    await sgMail.send(msg);
    console.log(`Email successfully sent to ${params.to}`);
    return true;
  } catch (error: any) {
    console.error('SendGrid email error:', error);
    if (error.response && error.response.body) {
      console.error('SendGrid error details:', JSON.stringify(error.response.body, null, 2));
    }
    throw error;
  }
}

export async function sendListEmail(
  list: SelectList,
  recipientEmail: string,
  subject: string,
  summary: string,
) {
  // Get the base URL from the environment or construct it from the request
  const baseUrl = process.env.BASE_URL || 'https://design-matchmaker.proofofconcept.pub';

  function getPhotoUrl(url: string | null): string | null {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // Always use absolute URLs for email images
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

  const msg = {
    to: recipientEmail,
    from: {
      email: "david@davidhoang.com",
      name: "Design Talent Match",
    },
    subject: subject,
    html: html,
  };

  try {
    await sgMail.send(msg);
  } catch (error: any) {
    console.error("Error sending email:", error);
    if (error.response) {
      throw new Error(error.response.body.errors[0].message);
    }
    throw error;
  }
}