#!/bin/bash

# Script para generar secretos seguros para producción
# Uso: bash generate-secrets.sh

echo "================================================"
echo "Generador de Secretos para Producción"
echo "================================================"
echo ""

echo "📌 DB_PASSWORD (32 caracteres):"
openssl rand -base64 32 | tr -d '\n'
echo ""
echo ""

echo "📌 JWT_SECRET (64 caracteres):"
openssl rand -base64 64 | tr -d '\n'
echo ""
echo ""

echo "================================================"
echo "✅ Secretos generados exitosamente"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   1. Copia estos valores y guárdalos en un lugar seguro"
echo "   2. NO los compartas por medios inseguros"
echo "   3. Úsalos en las variables de entorno de Dockploy"
echo "================================================"
