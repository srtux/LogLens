import { AnsiUp } from 'ansi_up';
import { sampleLogs } from '../data/sampleLogs';

const ansi_up = new AnsiUp();
ansi_up.use_classes = true; // Use classes instead of inline styles where possible

export interface LogEntry {
  id: string;
  timestamp: string | null;
  textPayload: string;
  severity: string;
  raw: any;
  resourceType?: string;
  logName?: string;
  labels?: Record<string, string>;
}

export function parseLogsFromDOM(): LogEntry[] {
  try {
    const rawText = document.body.innerText;
    // Attempt to find the start of a JSON array
    const jsonStartIndex = rawText.indexOf('[');
    const jsonEndIndex = rawText.lastIndexOf(']');

    if (jsonStartIndex === -1 || jsonEndIndex === -1) {
      // In development/preview mode, the body won't contain logs.
      // Fallback to sample data for demonstration purposes.
      console.warn('No JSON array found in document body. Using sample data.');
      return sampleLogs.map(normalizeLogEntry);
    }

    const jsonString = rawText.substring(jsonStartIndex, jsonEndIndex + 1);
    const parsed = JSON.parse(jsonString);

    if (!Array.isArray(parsed)) {
      throw new Error('Parsed content is not a JSON array.');
    }

    return parsed.map(normalizeLogEntry);
  } catch (error) {
    console.error('Failed to parse logs from DOM:', error);
    // Also fallback on error for better dev experience
    return sampleLogs.map(normalizeLogEntry);
  }
}

function normalizeLogEntry(entry: any, index: number): LogEntry {
  // Generate a stable ID if insertId is missing
  const id = entry.insertId || `log-${index}-${Date.now()}`;
  
  // Extract timestamp
  const timestamp = entry.timestamp || null;

  // Extract payload
  let textPayload = '';
  if (entry.textPayload) {
    textPayload = entry.textPayload;
  } else if (entry.jsonPayload) {
    textPayload = JSON.stringify(entry.jsonPayload);
  } else if (entry.protoPayload) {
     // Handle protoPayload commonly found in audit logs
     textPayload = JSON.stringify(entry.protoPayload);
  } else {
    // Fallback: stringify the whole entry excluding common metadata to avoid circular refs if any (though JSON parse result won't have them)
    // Just stringify the whole thing for safety
    textPayload = JSON.stringify(entry);
  }

  // Extract severity
  const severity = entry.severity || 'DEFAULT';

  // Extract resource type for faceting
  const resourceType = entry.resource?.type || 'unknown';
  
  // Extract logName (often a full path, we might want just the last part, but let's keep full for now)
  const logName = entry.logName || '';

  // Flatten labels from resource.labels and entry.labels
  const labels: Record<string, string> = {};
  if (entry.resource?.labels) {
    Object.entries(entry.resource.labels).forEach(([k, v]) => {
      labels[`resource.labels.${k}`] = String(v);
    });
  }
  if (entry.labels) {
    Object.entries(entry.labels).forEach(([k, v]) => {
      labels[`labels.${k}`] = String(v);
    });
  }

  return {
    id,
    timestamp,
    textPayload,
    severity,
    resourceType,
    logName,
    labels,
    raw: entry,
  };
}

export function parseLogsFromJSON(data: string | any[]): LogEntry[] {
  const entries = typeof data === 'string' ? JSON.parse(data) : data;

  if (!Array.isArray(entries)) {
    throw new Error('Expected a JSON array of LogEntry objects.');
  }

  return entries.map(normalizeLogEntry);
}

export function convertAnsiToHtml(text: string): string {
  return ansi_up.ansi_to_html(text);
}
