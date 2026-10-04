import json

with open('all_sheets_full.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

summary = {}
for sheet_name, rows in data.items():
    current_layer = 'General'
    questions = []
    
    for row_obj in rows:
        r = row_obj['row']
        cells = {c['col']: c['val'] for c in row_obj['cells']}
        
        row_text = ' '.join(cells.values())
        if 'เลเยอร์ 3' in row_text or 'Layer 3' in row_text or 'Layer#3' in row_text:
            if 'ตรวจประเมิน' in row_text or 'Monthly' in row_text or 'Systems Audit' in row_text:
                current_layer = 'Layer 3'
        if 'เลเยอร์ 2' in row_text or 'Layer 2' in row_text or 'Layer#2' in row_text:
            if 'ตรวจประเมิน' in row_text or 'Weekly' in row_text or 'Process Audit' in row_text:
                current_layer = 'Layer 2'
        if 'เลเยอร์ 1' in row_text or 'Layer 1' in row_text or 'Layer#1' in row_text:
            if 'ตรวจประเมิน' in row_text or 'Daily' in row_text or 'Shift' in row_text or 'Operator' in row_text:
                current_layer = 'Layer 1'
            
        for col_idx, val in sorted(cells.items()):
            # check if question text
            clean_val = val.strip()
            # typically starts with number like '1)', '1.', or is in question column
            is_q = False
            for num in range(1, 40):
                if clean_val.startswith(f"{num})") or clean_val.startswith(f"{num}."):
                    is_q = True
                    break
            if is_q:
                # find category (usually in col 1 or 2)
                cat = cells.get(1, '')
                method = cells.get(2, '')
                questions.append({
                    'layer': current_layer,
                    'row': r,
                    'col': col_idx,
                    'category': cat,
                    'method': method,
                    'question': clean_val
                })
                break
                
    summary[sheet_name] = {
        'total_rows': len(rows),
        'question_count': len(questions),
        'questions': questions
    }

with open('departments_summary.json', 'w', encoding='utf-8') as f:
    json.dump(summary, f, ensure_ascii=False, indent=2)

with open('summary_report.txt', 'w', encoding='utf-8') as out:
    for name, info in summary.items():
        out.write(f"=== Sheet: {name} (Questions: {info['question_count']}) ===\n")
        for q in info['questions']:
            out.write(f"  [{q['layer']}] {q['question'][:80]} | Cat: {q['category']} | Method: {q['method']}\n")
        out.write("\n")

print("Parsed successfully!")
