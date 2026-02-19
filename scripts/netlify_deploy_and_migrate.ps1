param(
  [string]$Token = "",  # Set via environment or pass as argument: ./script.ps1 -Token "your_token_here"
  [string]$SiteName = "ogunstatenapps",
  [string]$MigrationUrl = "https://ogunstatenapps.netlify.app/.netlify/functions/run-migration",
  [string]$AdminKey = ""  # Set via environment or pass as argument
)

$ErrorActionPreference = 'Stop'
$headers = @{ Authorization = "Bearer $Token" }
Write-Output "== GET /sites =="
$sites = Invoke-RestMethod -Uri "https://api.netlify.com/api/v1/sites" -Headers $headers -Method GET
Write-Output "Retrieved $($sites.Count) sites"

$site = $sites | Where-Object { $_.name -eq $SiteName -or $_.slug -eq $SiteName -or $_.site_name -eq $SiteName }
if(-not $site){ Write-Error "Site '$SiteName' not found with the provided token"; exit 2 }
Write-Output "Found site: $($site.name) (id: $($site.id))"
$siteId = $site.id

Write-Output "== trigger build =="
$build = Invoke-RestMethod -Uri "https://api.netlify.com/api/v1/sites/$siteId/builds" -Headers $headers -Method POST -Body '{}' -ContentType 'application/json'
Write-Output "Build triggered: $($build.id)"

Write-Output "== poll latest deploy (up to 10 minutes) =="
$state = ''
for($i=0;$i -lt 100;$i++){
  $d = Invoke-RestMethod -Uri "https://api.netlify.com/api/v1/sites/$siteId/deploys?per_page=1" -Headers $headers -Method GET
  if($d -and $d.Length -gt 0){ $state = $d[0].state; $published_at = $d[0].published_at }
  else { $state = 'no_deploys' }
  Write-Output "[$i] deploy-state:$state published_at:$published_at"
  if($state -eq 'ready'){ Write-Output 'deploy ready'; break }
  Start-Sleep -Seconds 6
}
if($state -ne 'ready'){ Write-Error 'Deploy did not become ready in time'; exit 3 }

Write-Output '== Calling migration endpoint =='
try{
  $mig = Invoke-RestMethod -Uri $MigrationUrl -Method POST -Headers @{ Authorization = "Bearer $AdminKey" } -ErrorAction Stop
  Write-Output 'Migration response JSON:'
  $mig | ConvertTo-Json -Depth 6 | Write-Output
}catch{
  Write-Error "Migration call failed: $_"
  exit 4
}

Write-Output 'All done.'
