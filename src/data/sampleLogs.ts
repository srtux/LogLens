export const sampleLogs = [
  {
    "textPayload": "🚀 Starting Unified SRE Agent on port 8080...",
    "insertId": "69764b7e0002fd19d5d52a7b",
    "resource": {
      "type": "cloud_run_revision",
      "labels": {
        "service_name": "autosre",
        "location": "us-central1"
      }
    },
    "timestamp": "2026-01-25T16:57:34.195865Z",
    "severity": "INFO"
  },
  {
    "textPayload": "\u001b[32;20m2026-01-25 16:58:01 [INFO] sre_agent.tools: ✅ Trace enabled.\u001b[0m",
    "insertId": "69764b990005e069a99a97aa",
    "resource": {
      "type": "cloud_run_revision",
      "labels": {
        "service_name": "autosre"
      }
    },
    "timestamp": "2026-01-25T16:58:01.385129Z"
  },
  {
    "textPayload": "Received request: GET /api/v1/health",
    "insertId": "69764b990005e069a99a97ab",
    "resource": {
      "type": "cloud_run_revision",
      "labels": {
        "service_name": "autosre"
      }
    },
    "timestamp": "2026-01-25T16:58:02.100000Z",
    "severity": "DEBUG"
  },
  {
    "textPayload": "\u001b[31m[ERROR] Connection to database timed out after 5000ms\u001b[0m",
    "insertId": "69764b990005e069a99a97ac",
    "resource": {
      "type": "cloud_sql_database",
      "labels": {
        "database_id": "prod-db"
      }
    },
    "timestamp": "2026-01-25T16:58:05.500000Z",
    "severity": "ERROR"
  },
  {
    "textPayload": "Retrying connection (attempt 1/3)...",
    "insertId": "69764b990005e069a99a97ad",
    "resource": {
      "type": "cloud_sql_database",
      "labels": {
        "database_id": "prod-db"
      }
    },
    "timestamp": "2026-01-25T16:58:05.600000Z",
    "severity": "WARNING"
  },
  {
    "textPayload": "\u001b[34m[AUDIT] User admin@example.com accessed resource: secrets/v1\u001b[0m",
    "insertId": "69764b990005e069a99a97ae",
    "resource": {
      "type": "gce_instance",
      "labels": {
        "instance_id": "i-1234567890abcdef0"
      }
    },
    "timestamp": "2026-01-25T16:59:10.000000Z",
    "severity": "NOTICE"
  }
];
