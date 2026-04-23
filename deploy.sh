#!/bin/bash

# Exit on error
set -e

echo "🚀 Iniciando despliegue de Payment Service..."

# 1. Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# 2. Construir el proyecto
echo "🏗️ Construyendo el proyecto NestJS..."
npm run build

# 3. Preparar el paquete para Lambda
echo "zipping..."
# Eliminamos zip previo si existe
rm -f terraform/lambda_function_payload.zip

# Creamos el zip con dist y node_modules
# Nota: En un entorno real, querrías solo las production dependencies
# pero para este script rápido incluiremos las actuales.
zip -r terraform/lambda_function_payload.zip dist node_modules package.json

echo "✅ Paquete Lambda preparado."

# 4. Desplegar con Terraform
echo "🌍 Desplegando infraestructura con Terraform..."
cd terraform

terraform init
terraform apply -auto-approve

echo "✨ Despliegue completado con éxito!"
