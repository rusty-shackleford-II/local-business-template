#!/bin/bash

# validate-before-deploy.sh
# Run this before deploying to catch issues early

set -e  # Exit on any error

echo "🔍 Validating template before deployment..."
echo ""

cd "$(dirname "$0")"

echo "📦 Installing dependencies..."
npm ci --quiet
echo "✅ Dependencies installed"
echo ""

echo "🔎 Running ESLint..."
npm run lint
echo "✅ Lint passed"
echo ""

echo "🏗️  Running build..."
npm run build
echo "✅ Build succeeded"
echo ""

echo "✨ All validation checks passed! Safe to deploy."

