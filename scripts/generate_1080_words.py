# -*- coding: utf-8 -*-
"""
Curriculum-aligned 1,080 English Vocabulary Generator for Smart Sarai English
Grades: ม.1 to ม.6 (180 words each = 1,080 words)
Aligned with Thai Ministry of Education Core Curriculum (สพฐ.), O-NET, TGAT, and A-Level.
"""

import os
import json

VOCAB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../src/data/vocab'))
os.makedirs(VOCAB_DIR, exist_ok=True)

def esc(s):
    if not s:
        return ""
    return str(s).replace('\\', '\\\\').replace("'", "\\'")

TOPICS = [
    'สิ่งแวดล้อมและธรรมชาติ',
    'วิทยาศาสตร์และเทคโนโลยี',
    'การศึกษาและอาชีพ',
    'สังคมและวัฒนธรรม',
    'สุขภาพและการดำเนินชีวิต',
    'การสื่อสารและสื่อ',
    'เศรษฐกิจและธุรกิจ',
    'การเดินทางและการท่องเที่ยว'
]

def write_grade_file(grade_num, level, words):
    file_name = f"m{grade_num}Data.ts"
    file_path = os.path.join(VOCAB_DIR, file_name)
    export_name = f"M{grade_num}_VOCABULARY"

    lines = []
    lines.append("// ===========================================================================")
    lines.append(f"// Smart Sarai English - คลังคำศัพท์มาตรฐาน มัธยมศึกษาปีที่ {grade_num} (ม.{grade_num})")
    lines.append(f"// สอดคล้องกับหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน (สพฐ.) - จำนวน {len(words)} คำ")
    lines.append("// ===========================================================================")
    lines.append("import { SecondaryVocabWord } from '../secondaryVocabData';")
    lines.append("")
    lines.append(f"export const {export_name}: SecondaryVocabWord[] = [")

    for idx, w in enumerate(words):
        wid = f"m{grade_num}-{idx+1:03d}"
        syns = w.get('syn', [])
        syns_str = ", ".join([f"'{esc(s)}'" for s in syns])
        emoji = w.get('em', '📖')

        lines.append("  {")
        lines.append(f"    id: '{wid}',")
        lines.append(f"    word: '{esc(w['w'])}',")
        lines.append(f"    pos: '{w.get('pos', 'n.')}',")
        lines.append(f"    grade: 'ม.{grade_num}',")
        lines.append(f"    level: '{level}',")
        lines.append(f"    meaningTh: '{esc(w['th'])}',")
        lines.append(f"    phoneticIPA: '{esc(w.get('ipa', ''))}',")
        lines.append(f"    phoneticTh: '{esc(w.get('tipa', ''))}',")
        lines.append(f"    topic: '{esc(w.get('top', 'การศึกษาและอาชีพ'))}',")
        lines.append(f"    sentence: '{esc(w.get('s', ''))}',")
        lines.append(f"    sentenceTh: '{esc(w.get('sth', ''))}',")
        lines.append(f"    emoji: '{emoji}',")
        lines.append(f"    synonyms: [{syns_str}]")
        lines.append("  },")

    lines.append("];")
    lines.append("")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(lines))
    print(f"✅ Generated {file_name} with {len(words)} words.")

# Let's verify python can run this generator
print("Generator script template ready.")
