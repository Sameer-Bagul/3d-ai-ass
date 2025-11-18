#!/bin/bash

# Ollama Setup Script for 3D AI Avatar Server

OLLAMA_URL="${OLLAMA_URL:-http://localhost:11434}"
MODEL="${OLLAMA_MODEL:-llama2}"

echo "🔍 Checking Ollama status..."

# Check if Ollama is running
if ! curl -s "${OLLAMA_URL}/api/tags" > /dev/null 2>&1; then
    echo "❌ Ollama is not running at ${OLLAMA_URL}"
    echo ""
    echo "To start Ollama, run:"
    echo "  ollama serve"
    echo ""
    exit 1
fi

echo "✅ Ollama is running at ${OLLAMA_URL}"

# List available models
echo ""
echo "📋 Checking for model: ${MODEL}"

MODELS=$(curl -s "${OLLAMA_URL}/api/tags" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)

if echo "$MODELS" | grep -q "^${MODEL}"; then
    echo "✅ Model '${MODEL}' is already installed"
else
    echo "⚠️  Model '${MODEL}' not found"
    echo ""
    echo "Available models:"
    echo "$MODELS" | sed 's/^/  - /'
    echo ""
    read -p "Do you want to pull '${MODEL}'? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📥 Pulling model: ${MODEL}..."
        ollama pull "${MODEL}"
        echo "✅ Model pulled successfully!"
    else
        echo "⏭️  Skipping model pull"
        echo ""
        echo "To pull manually, run:"
        echo "  ollama pull ${MODEL}"
    fi
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Available models:"
curl -s "${OLLAMA_URL}/api/tags" | grep -o '"name":"[^"]*"' | cut -d'"' -f4 | sed 's/^/  - /'
