param([switch]$SkipBuild)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $repoRoot

$config = Get-Content -Raw -Encoding utf8 "src-tauri/tauri.conf.json" | ConvertFrom-Json
$version = [version]$config.version
$packageVersion = "{0}.{1}.{2}.0" -f $version.Major, $version.Minor, $version.Build
$identityName = "fabriidev.BeautyShell"
$publisher = "CN=655D2DEA-D0F4-4ADB-AD63-9CA0893DA73F"
$publisherDisplayName = "fabriidev"

$storeRoot = Join-Path $repoRoot "release\store"
$stage = Join-Path $storeRoot "staging"
$packagePath = Join-Path $storeRoot ("BeautyShell_{0}_x64.msix" -f $version)
$stageFull = [System.IO.Path]::GetFullPath($stage)
$storeRootFull = [System.IO.Path]::GetFullPath($storeRoot)
if (-not $stageFull.StartsWith($storeRootFull + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "The staging folder must stay inside release\store."
}

$sdkRoot = Join-Path ${env:ProgramFiles(x86)} "Windows Kits\10\bin"
$makeAppx = Get-ChildItem -Path $sdkRoot -Filter "makeappx.exe" -Recurse -ErrorAction SilentlyContinue |
  Where-Object { $_.Directory.Name -eq "x64" } |
  Sort-Object { [version]$_.Directory.Parent.Name } -Descending |
  Select-Object -First 1
if (-not $makeAppx) { throw "makeappx.exe from the Windows SDK was not found." }
New-Item -ItemType Directory -Force -Path $storeRoot | Out-Null
if (Test-Path -LiteralPath $stageFull) {
  Remove-Item -LiteralPath $stageFull -Recurse -Force
}
New-Item -ItemType Directory -Force -Path (Join-Path $stage "Assets") | Out-Null

if (-not $SkipBuild) {
  $previousDistribution = $env:VITE_DISTRIBUTION
  try {
    $env:VITE_DISTRIBUTION = "store"
    npm run tauri -- build --no-bundle
    if ($LASTEXITCODE -ne 0) { throw "The Tauri build for the Microsoft Store failed." }
  } finally {
    if ($null -eq $previousDistribution) {
      Remove-Item Env:VITE_DISTRIBUTION -ErrorAction SilentlyContinue
    } else {
      $env:VITE_DISTRIBUTION = $previousDistribution
    }
  }
}

$appBinary = Join-Path $repoRoot "src-tauri\target\release\vidrio.exe"
if (-not (Test-Path -LiteralPath $appBinary)) { throw "The compiled executable was not found: $appBinary" }
Copy-Item -LiteralPath $appBinary -Destination (Join-Path $stage "vidrio.exe")

foreach ($asset in @("StoreLogo.png", "Square44x44Logo.png", "Square71x71Logo.png", "Square150x150Logo.png")) {
  $assetPath = Join-Path $repoRoot ("src-tauri\icons\{0}" -f $asset)
  if (-not (Test-Path -LiteralPath $assetPath)) { throw "A required icon is missing: $assetPath" }
  Copy-Item -LiteralPath $assetPath -Destination (Join-Path $stage "Assets\$asset")
}

$manifest = @"
<?xml version="1.0" encoding="utf-8"?>
<Package xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10"
         xmlns:uap="http://schemas.microsoft.com/appx/manifest/uap/windows10"
         xmlns:uap10="http://schemas.microsoft.com/appx/manifest/uap/windows10/10"
         xmlns:rescap="http://schemas.microsoft.com/appx/manifest/foundation/windows10/restrictedcapabilities"
         IgnorableNamespaces="uap uap10 rescap">
  <Identity Name="$identityName" Publisher="$publisher" Version="$packageVersion" ProcessorArchitecture="x64" />
  <Properties>
    <DisplayName>Beauty Shell</DisplayName>
    <PublisherDisplayName>$publisherDisplayName</PublisherDisplayName>
    <Description>Terminal para Windows con pestañas, paneles divididos y varias shells.</Description>
    <Logo>Assets\StoreLogo.png</Logo>
  </Properties>
  <Dependencies>
    <TargetDeviceFamily Name="Windows.Desktop" MinVersion="10.0.19041.0" MaxVersionTested="10.0.26100.0" />
  </Dependencies>
  <Resources>
    <Resource Language="es-AR" />
  </Resources>
  <Applications>
    <Application Id="BeautyShell" Executable="vidrio.exe" uap10:RuntimeBehavior="packagedClassicApp" uap10:TrustLevel="mediumIL">
      <uap:VisualElements DisplayName="Beauty Shell" Description="Terminal para Windows" BackgroundColor="transparent" Square150x150Logo="Assets\Square150x150Logo.png" Square44x44Logo="Assets\Square44x44Logo.png">
        <uap:DefaultTile Square71x71Logo="Assets\Square71x71Logo.png" />
      </uap:VisualElements>
    </Application>
  </Applications>
  <Capabilities>
    <rescap:Capability Name="runFullTrust" />
  </Capabilities>
</Package>
"@
[System.IO.File]::WriteAllText((Join-Path $stage "AppxManifest.xml"), $manifest, [System.Text.UTF8Encoding]::new($false))

& $makeAppx.FullName pack /d $stage /p $packagePath /o
if ($LASTEXITCODE -ne 0) { throw "MakeAppx could not create the MSIX package." }

Write-Host "MSIX ready for Partner Center: $packagePath"
Write-Host "The Microsoft Store signs the package on submission."
