# coding: utf-8
import os
import json

vocab_dir = os.path.join(os.path.dirname(__file__), '../src/data/vocab')
os.makedirs(vocab_dir, exist_ok=True)

# Helper to escape quotes for TypeScript
def esc(s):
    if not s:
        return ""
    return str(s).replace('\\', '\\\\').replace("'", "\\'")

def write_ts_file(grade_num, level, words):
    file_name = f"m{grade_num}Data.ts"
    export_name = f"M{grade_num}_VOCABULARY"
    file_path = os.path.join(vocab_dir, file_name)

    lines = []
    lines.append("import { SecondaryVocabWord } from '../secondaryVocabData';")
    lines.append("")
    lines.append(f"export const {export_name}: SecondaryVocabWord[] = [")
    for idx, w in enumerate(words):
        wid = f"m{grade_num}-{idx+1:03d}"
        grade_str = f"ม.{grade_num}"
        syns_str = ", ".join([f"'{esc(s)}'" for s in w.get('synonyms', [])])
        emoji = w.get('emoji', '📖')
        lines.append("  {")
        lines.append(f"    id: '{wid}',")
        lines.append(f"    word: '{esc(w['word'])}',")
        lines.append(f"    pos: '{w['pos']}',")
        lines.append(f"    grade: '{grade_str}',")
        lines.append(f"    level: '{level}',")
        lines.append(f"    meaningTh: '{esc(w['meaningTh'])}',")
        lines.append(f"    phoneticIPA: '{esc(w['phoneticIPA'])}',")
        lines.append(f"    phoneticTh: '{esc(w['phoneticTh'])}',")
        lines.append(f"    topic: '{esc(w.get('topic', 'การศึกษาและอาชีพ'))}',")
        lines.append(f"    sentence: '{esc(w['sentence'])}',")
        lines.append(f"    sentenceTh: '{esc(w['sentenceTh'])}',")
        lines.append(f"    emoji: '{emoji}',")
        lines.append(f"    synonyms: [{syns_str}]")
        lines.append("  },")
    lines.append("];")
    lines.append("")

    with open(file_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Generated {file_name} with {len(words)} words.")

print("Writer helper ready.")
