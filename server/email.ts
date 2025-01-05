import sgMail from "@sendgrid/mail";
import type { SelectList } from "@db/schema";

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY is required");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendListEmail(list: SelectList, recipientEmail: string, subject: string, summary: string) {
  const designersHtml = list.designers?.map(({ designer, notes }) => `
    <div style="margin-bottom: 24px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        ${designer.photoUrl ? 
          `<img src="${designer.photoUrl}" alt="${designer.name}" style="width: 48px; height: 48px; border-radius: 9999px; margin-right: 16px;">` :
          `<div style="width: 48px; height: 48px; border-radius: 9999px; background-color: #e5e7eb; margin-right: 16px; display: flex; align-items: center; justify-content: center; font-weight: 500;">${designer.name.split(' ').map(n => n[0]).join('')}</div>`
        }
        <div>
          <h3 style="margin: 0; font-size: 16px; font-weight: 500;">${designer.name}</h3>
          <p style="margin: 0; font-size: 14px; color: #6b7280;">${designer.title}</p>
        </div>
      </div>
      ${notes ? `
        <div style="margin-top: 8px;">
          <p style="margin: 0; font-size: 14px; font-weight: 500;">Notes:</p>
          <p style="margin: 0; font-size: 14px; color: #6b7280;">${notes}</p>
        </div>
      ` : ''}
    </div>
  `).join('') || '';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${list.name} - Designer List</title>
      </head>
      <body style="font-family: system, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; margin: 0; padding: 24px;">
        <div style="max-width: 600px; margin: 0 auto;">
          <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600;">${list.name}</h1>
          ${summary ? `<p style="margin: 0 0 24px 0; color: #6b7280;">${summary}</p>` : ''}
          <div style="margin-top: 24px;">
            ${designersHtml}
          </div>
          <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">
            Shared via Design Matchmaker
          </p>
        </div>
      </body>
    </html>
  `;

  const msg = {
    to: recipientEmail,
    from: 'noreply@designmatchmaker.com', // Update this with your verified sender
    subject: subject,
    html: html,
  };

  try {
    await sgMail.send(msg);
  } catch (error: any) {
    console.error('Error sending email:', error);
    if (error.response) {
      throw new Error(error.response.body.errors[0].message);
    }
    throw error;
  }
}
