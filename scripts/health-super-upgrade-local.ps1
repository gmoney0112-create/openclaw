$ErrorActionPreference = "Continue"

$services = @(
  @{ Name = "browser-cluster"; Url = "http://localhost:3100/browser/health" },
  @{ Name = "llm-router"; Url = "http://localhost:3101/llm/health" },
  @{ Name = "memory-layer"; Url = "http://localhost:3102/memory/health" },
  @{ Name = "workflow-engine"; Url = "http://localhost:3103/workflow/health" },
  @{ Name = "multi-agent"; Url = "http://localhost:3104/agent/health" },
  @{ Name = "skill-loader"; Url = "http://localhost:3105/skills/health" },
  @{ Name = "research-engine"; Url = "http://localhost:3106/research/health" },
  @{ Name = "os-controller"; Url = "http://localhost:3107/os/health" },
  @{ Name = "voice-operator"; Url = "http://localhost:3108/voice/health" },
  @{ Name = "auto-coder"; Url = "http://localhost:3109/autocoder/health" },
  @{ Name = "revenue-executor"; Url = "http://localhost:3110/revenue/health" },
  @{ Name = "revenue-actions"; Url = "http://localhost:3110/revenue/actions" }
)

$results = foreach ($service in $services) {
  try {
    $response = Invoke-RestMethod -Uri $service.Url -Method Get -TimeoutSec 8
    [PSCustomObject]@{
      service = $service.Name
      status  = "ok"
      url     = $service.Url
      detail  = ($response | ConvertTo-Json -Compress -Depth 8)
    }
  } catch {
    [PSCustomObject]@{
      service = $service.Name
      status  = "error"
      url     = $service.Url
      detail  = $_.Exception.Message
    }
  }
}

$results | Format-Table -AutoSize
