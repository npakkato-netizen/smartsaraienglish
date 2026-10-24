# coding: utf-8
import os
from scripts.data_m2 import M2_WORDS
from scripts.data_m3 import M3_WORDS
from scripts.data_m4 import M4_WORDS
from scripts.data_m5 import M5_WORDS
from scripts.data_m6 import M6_WORDS

OUT_DIR = os.path.join(os.path.dirname(__file__), '../src/data/vocab')
os.makedirs(OUT_DIR, exist_ok=True)

def esc(s):
    if not s:
        return ""
    return str(s).replace('\\', '\\\\').replace("'", "\\'")

def generate_file(grade_num, level, words_tuples):
    file_name = f"m{grade_num}Data.ts"
    out_path = os.path.join(OUT_DIR, file_name)
    export_name = f"M{grade_num}_VOCABULARY"

    lines = []
    lines.append("import { SecondaryVocabWord } from '../secondaryVocabData';")
    lines.append("")
    lines.append(f"// มัธยมศึกษาปีที่ {grade_num} (ม.{grade_num}) - คลังคำศัพท์หลักสูตรแกนกลาง ({len(words_tuples)} คำ)")
    lines.append(f"export const {export_name}: SecondaryVocabWord[] = [")

    for idx, item in enumerate(words_tuples):
        wid = f"m{grade_num}-{idx+1:03d}"
        word, pos, meaningTh, ipa, tipa, topic, sentence, sentenceTh, emoji, syns = item
        syns_str = ", ".join([f"'{esc(s)}'" for s in syns])

        lines.append("  {")
        lines.append(f"    id: '{wid}',")
        lines.append(f"    word: '{esc(word)}',")
        lines.append(f"    pos: '{pos}',")
        lines.append(f"    grade: 'ม.{grade_num}',")
        lines.append(f"    level: '{level}',")
        lines.append(f"    meaningTh: '{esc(meaningTh)}',")
        lines.append(f"    phoneticIPA: '{esc(ipa)}',")
        lines.append(f"    phoneticTh: '{esc(tipa)}',")
        lines.append(f"    topic: '{esc(topic)}',")
        lines.append(f"    sentence: '{esc(sentence)}',")
        lines.append(f"    sentenceTh: '{esc(sentenceTh)}',")
        lines.append(f"    emoji: '{emoji}',")
        lines.append(f"    synonyms: [{syns_str}]")
        lines.append("  },")

    lines.append("];")
    lines.append("")

    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Generated {file_name}: {len(words_tuples)} words.")

if __name__ == "__main__":
    generate_file(2, "lower", M2_WORDS)
    generate_file(3, "lower", M3_WORDS)
    generate_file(4, "upper", M4_WORDS)
    generate_file(5, "upper", M5_WORDS)
    generate_file(6, "upper", M6_WORDS)
    print("All grade files (M.2 - M.6) successfully generated!")
