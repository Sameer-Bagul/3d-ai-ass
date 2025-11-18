#!/usr/bin/env bash

set -e

echo "🔧 Fine-tuning script for Ollama + Mistral"
echo "=========================================="
echo ""

DATASET_FILE="${1:-./data/training_dataset.jsonl}"
MODEL_NAME="${2:-mistral}"
OUTPUT_NAME="${3:-mistral-avatar-tuned}"

if [ ! -f "$DATASET_FILE" ]; then
  echo "❌ Dataset file not found: $DATASET_FILE"
  echo "Usage: ./fine_tune.sh <dataset_file> [model_name] [output_name]"
  exit 1
fi

echo "📁 Dataset: $DATASET_FILE"
echo "🤖 Base model: $MODEL_NAME"
echo "💾 Output model: $OUTPUT_NAME"
echo ""

echo "⚠️  NOTE: This is a placeholder script."
echo "    Ollama fine-tuning support is limited. Consider:"
echo "    1. Use Ollama Modelfile to create custom system prompts"
echo "    2. Use external LoRA training (e.g., with HuggingFace)"
echo "    3. Use few-shot prompting with examples in the dataset"
echo ""

if command -v ollama &> /dev/null; then
  echo "✅ Ollama is installed"
  
  echo "📝 Creating Modelfile with custom system prompt..."
  cat > /tmp/Modelfile <<EOF
FROM $MODEL_NAME

SYSTEM """
You are an AI avatar controller. Generate structured JSON responses that include:
1. "reply": Your text response
2. "animation": Animation commands in the format:
   {
     "type": "blendshape" | "head" | "gesture",
     "targets": [{"k": "blendshapeName", "v": value}],
     "start": timeInSeconds,
     "end": timeInSeconds
   }

Example:
{
  "reply": "Hello! How are you?",
  "animation": [
    {"type": "blendshape", "targets": [{"k": "jawOpen", "v": 0.8}], "start": 0.0, "end": 0.3},
    {"type": "head", "keyframes": [{"t": 0.0, "pitch": 0.0, "yaw": 0.0}, {"t": 0.5, "pitch": 0.1, "yaw": -0.05}]}
  ]
}
"""

PARAMETER temperature 0.7
PARAMETER top_p 0.9
EOF

  echo "🚀 Creating custom model: $OUTPUT_NAME"
  ollama create "$OUTPUT_NAME" -f /tmp/Modelfile
  
  echo "✅ Custom model created successfully!"
  echo "   Use it with: ollama run $OUTPUT_NAME"
  
else
  echo "❌ Ollama is not installed"
  echo "   Install from: https://ollama.ai"
fi

echo ""
echo "🎓 For real fine-tuning with LoRA:"
echo "   1. Export your training data in JSONL format"
echo "   2. Use tools like axolotl, llama.cpp, or HuggingFace transformers"
echo "   3. Train LoRA adapter on animation command generation"
echo "   4. Convert adapter to Ollama-compatible format"
echo ""
