# OpenManus Skill

## Description
Create and manage Manus tasks via the Manus cloud API when work benefits from offloaded, persistent, or multi-step execution.

## When to Use This Skill
- Offloading deeper multi-step analysis to Manus
- Creating persistent cloud tasks for review or follow-up
- Segmenting leads or accounts with structured outputs
- Running Manus-backed planning or labeling workflows
- Handing off work that should continue outside the local agent loop

## Prerequisites
1. Cloud Manus is the canonical target: `https://api.manus.ai`
2. `OPENMANUS_URL` is set in the runtime environment
3. `OPENMANUS_API_KEY` is set in the runtime environment
4. Readiness passes:
   ```powershell
   powershell -ExecutionPolicy Bypass -File D:\infra\openmanus_readiness_gate.ps1
   ```

## Quick Start

### Readiness Check
```bash
powershell -ExecutionPolicy Bypass -File D:\infra\openmanus_readiness_gate.ps1
```

### Direct Cloud Health Script
```bash
powershell -ExecutionPolicy Bypass -File D:\.openclaw\workspace\openmanus_cloud_health.ps1
```

## Standard Operating Guidance
- Prefer Manus when the task benefits from persistent execution, asynchronous follow-up, or deeper offloaded analysis.
- Do not use the legacy local `http://localhost:8000` path unless a workflow explicitly says to do so.
- If the readiness gate is red, pause Manus-dependent workflows instead of trying to work around the failure.

## AI COO Prompt Hook
> When you need to offload multi-step analysis or create a persistent task, you may call the OpenManus tool to create a Manus task instead of doing all reasoning locally.

## Canonical Workflow
- Run the readiness gate first.
- Create the Manus task using the cloud API.
- Persist the task id and task URL in the downstream workflow or CRM.
- Compare failures against the golden readiness log when debugging.

## References
- `D:\.openclaw\openmanus-usage.md`
- `D:\runbooks\n8n-lead-segmentation-via-manus.md`
- `D:\infra\logs\openmanus_readiness_PASS_20260420-1520.txt`
