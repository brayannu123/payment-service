# Deploy script for PowerShell

$ErrorActionPreference = "Stop"

Write-Host "🚀 Iniciando despliegue de Payment Service..." -ForegroundColor Cyan

# 1. Instalar dependencias
Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
npm install

# 2. Construir el proyecto
Write-Host "🏗️ Construyendo el proyecto NestJS..." -ForegroundColor Yellow
npm run build

# 3. Preparar el paquete para Lambda
Write-Host "🤐 Creando paquete ZIP para Lambda..." -ForegroundColor Yellow
$zipPath = "terraform/lambda_function_payload.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath }

# Usar Compress-Archive de PowerShell
# Nota: node_modules puede ser muy grande, esto podría tardar un poco
Compress-Archive -Path "dist", "node_modules", "package.json" -DestinationPath $zipPath

Write-Host "✅ Paquete Lambda preparado en $zipPath" -ForegroundColor Green

# 4. Desplegar con Terraform
Write-Host "🌍 Desplegando infraestructura con Terraform..." -ForegroundColor Yellow
Set-Location terraform

terraform init
terraform apply -auto-approve

Write-Host "✨ Despliegue completado con éxito!" -ForegroundColor Green
Set-Location ..
