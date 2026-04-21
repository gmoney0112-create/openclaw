# Infra

Quick index of infra scripts and runbooks tracked in this repo.

## Playwright

- Vendor patch notes: `infra/PLAYWRIGHT-PATCHES.md`
- Re-apply patch (after Playwright upgrades): `infra/scripts/patch-playwright-url-api.ps1`
- Regression check (fails on `[DEP0169]`): `infra/scripts/check-playwright-dep0169.ps1`

Example:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File infra\scripts\patch-playwright-url-api.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File infra\scripts\check-playwright-dep0169.ps1
```

