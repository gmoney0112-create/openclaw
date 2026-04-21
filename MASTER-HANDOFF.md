# Master Handoff

Remote: `https://github.com/gmoney0112-create/openclaw.git` (branch: `master`)

## Infra quick checks

- Playwright DEP0169 regression check:
  - `powershell.exe -NoProfile -ExecutionPolicy Bypass -File infra\scripts\check-playwright-dep0169.ps1`
- Re-apply Playwright vendor patch (after upgrades):
  - `powershell.exe -NoProfile -ExecutionPolicy Bypass -File infra\scripts\patch-playwright-url-api.ps1`

## OpenManus (cloud)

Canonical URL: `https://api.manus.ai`

Local readiness gate (external to this repo):

- `D:\infra\openmanus_readiness_gate.ps1`
- Golden log: `D:\infra\logs\openmanus_readiness_PASS_20260420-1520.txt`

