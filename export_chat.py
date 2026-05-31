import json
import os

log_path = r"C:\Users\horizon\.gemini\antigravity\brain\f96335b1-c7b3-4ac6-979c-cd17b8a51637\.system_generated\logs\transcript.jsonl"
output_path = r"f:\Open Code Projet\Projet A1\crypto-arb-pro\conversation_history.md"

with open(log_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open(output_path, 'w', encoding='utf-8') as out:
    out.write("# سجل المحادثة الكامل (Conversation History)\n\n")
    for line in lines:
        try:
            data = json.loads(line)
            source = data.get('source')
            msg_type = data.get('type')
            content = data.get('content', '')
            
            if source == 'USER_EXPLICIT' and msg_type == 'USER_INPUT':
                out.write(f"### 👤 أنت (User):\n{content}\n\n---\n\n")
            elif source == 'MODEL' and msg_type == 'PLANNER_RESPONSE':
                if content and content.strip():
                    out.write(f"### 🤖 المساعد الذكي:\n{content}\n\n---\n\n")
        except Exception as e:
            pass

print(f"Exported successfully to {output_path}")
