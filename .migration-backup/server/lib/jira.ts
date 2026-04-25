// Jira integration - uses Replit connection
import { Version3Client } from 'jira.js';

let connectionSettings: any;
let cloudId: string | null = null;

async function getAccessTokenAndCloudId() {
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
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=jira',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Jira not connected');
  }

  // Get cloud ID from accessible resources if not cached
  if (!cloudId) {
    const resourcesRes = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Accept': 'application/json'
      }
    });
    const resources = await resourcesRes.json();
    if (!resources || resources.length === 0) {
      throw new Error('No accessible Jira resources found');
    }
    cloudId = resources[0].id;
  }

  return { accessToken, cloudId: cloudId! };
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getUncachableJiraClient() {
  const { accessToken, cloudId } = await getAccessTokenAndCloudId();

  return new Version3Client({
    host: `https://api.atlassian.com/ex/jira/${cloudId}`,
    authentication: {
      oauth2: { accessToken },
    },
  });
}
