# -*- coding: utf-8 -*-
"""
Script to update departments and checklist templates for Molding and Mold Maintenance (MM)
according to TE-EHS-053 Rev. K (15-Oct-26).
"""
import json
import sqlite3

# Define questions for Molding (MOLD)
molding_questions = [
    # Layer 3
    {
        "layer": "Layer 3",
        "category": "SBOP (Systems Audit) Layer#3",
        "subcategory": "",
        "method": "Check",
        "item_order": 1,
        "question": "การตรวจสอบในเรื่อง SBOP ของ Layer 2 ได้มีการดำเนินการแก้ไขอย่างถูกต้องและปัญหาที่พบได้รับการแก้ไขบนบอร์ด SBOP หรือไม่?",
        "question_en": "Has Layer 2 SBOP audit been correctly rectified and issues addressed on the SBOP board?",
        "row_in_excel": 12
    },
    {
        "layer": "Layer 3",
        "category": "SBOP (Systems Audit) Layer#3",
        "subcategory": "",
        "method": "Check",
        "item_order": 2,
        "question": "Supervisor,หัวหน้ากะและหัวหน้าฝ่ายบริหารในทุกระดับได้นำเรื่อง SBOP เข้าประชุมใน GO-Meeting และเป็นไปตามแผนที่วางไว้ หรือไม่ ?",
        "question_en": "Have Supervisors, shift leaders, and management at all levels included SBOP in GO-Meetings as planned?",
        "row_in_excel": 13
    },
    # Layer 2
    {
        "layer": "Layer 2",
        "category": "SBOP (Systems Audit) Layer#2",
        "subcategory": "",
        "method": "Check",
        "item_order": 1,
        "question": "การตรวจสอบในเรื่อง SBOP ของ Layer 1 ได้มีการดำเนินการแก้ไขอย่างถูกต้องและปัญหาที่พบได้รับการแก้ไขบนบอร์ด SBOP หรือไม่?",
        "question_en": "Has Layer 1 SBOP audit been correctly rectified and issues addressed on the SBOP board?",
        "row_in_excel": 17
    },
    {
        "layer": "Layer 2",
        "category": "SBOP (Systems Audit) Layer#2",
        "subcategory": "",
        "method": "Check",
        "item_order": 2,
        "question": "กิจกรรมด้านความปลอดภัยได้ถูกดำเนินการและตรวจสอบตามกำหนดเวลาหรือไม่ (BBS/CM/PM).",
        "question_en": "Have safety activities been conducted and inspected on schedule (BBS/CM/PM)?",
        "row_in_excel": 18
    },
    # Layer 1 - I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ
    # A. ท่าทางการทำงาน
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "A.ท่าทางการทำงาน",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 1,
        "question": "การเดินปฎิบัติงาน",
        "question_en": "Walking and moving during work operations",
        "row_in_excel": 23
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "A.ท่าทางการทำงาน",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 2,
        "question": "การเข้าออก-พื้นที่ปฏิบัติงาน",
        "question_en": "Entering and exiting work areas safely",
        "row_in_excel": 24
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "A.ท่าทางการทำงาน",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 3,
        "question": "ความสนใจกับงานที่กำลังปฏิบัติ",
        "question_en": "Focus and attentiveness to ongoing tasks",
        "row_in_excel": 25
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "A.ท่าทางการทำงาน",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 4,
        "question": "เทคนิคท่าทางการยกของเหมาะสม/ถูกต้อง",
        "question_en": "Proper manual lifting technique and ergonomics",
        "row_in_excel": 26
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "A.ท่าทางการทำงาน",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 5,
        "question": "การก้ม/การบิด/การดึง/ตำแหน่งของร่างกาย",
        "question_en": "Body posture: Bending, twisting, pulling, positioning",
        "row_in_excel": 27
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "A.ท่าทางการทำงาน",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 6,
        "question": "การยศาสตร์ (เช่น ท่าทาง)",
        "question_en": "Ergonomics and working posture",
        "row_in_excel": 28
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "A.ท่าทางการทำงาน",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 7,
        "question": "ไม่เร่งรีบปฏิบัติงานจนเกินไป",
        "question_en": "Not rushing or hurrying work operations excessively",
        "row_in_excel": 29
    },
    # B. การตระหนักของพนักงาน
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "B. การตระหนักของพนักงาน",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 1,
        "question": "มีความตระหนักถึงพื้นผิวร้อน",
        "question_en": "Awareness of hot surfaces and burn hazards",
        "row_in_excel": 31
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "B. การตระหนักของพนักงาน",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 2,
        "question": "มีความตระหนักถึงจุดเคลื่อนไหวและส่วนหมุน",
        "question_en": "Awareness of moving parts and rotating mechanisms",
        "row_in_excel": 32
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "B. การตระหนักของพนักงาน",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 3,
        "question": "มีความตระหนักถึงจุดหนีบ",
        "question_en": "Awareness of pinch points and nip hazards",
        "row_in_excel": 33
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "B. การตระหนักของพนักงาน",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 4,
        "question": "มีความตระหนักถึงวัตถุแหลมคมหรือบาด",
        "question_en": "Awareness of sharp objects and cut/laceration hazards",
        "row_in_excel": 34
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "B. การตระหนักของพนักงาน",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 5,
        "question": "มีความตระหนักถึงอันตรายไฟฟ้า",
        "question_en": "Awareness of electrical hazards and live equipment",
        "row_in_excel": 35
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "B. การตระหนักของพนักงาน",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 6,
        "question": "มีความตระหนักถึงระบบ Interlock/ปุ่มฉุกเฉิน",
        "question_en": "Awareness of safety interlocks and emergency stop buttons",
        "row_in_excel": 36
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "B. การตระหนักของพนักงาน",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 7,
        "question": "มีความตระหนักถึงการใช้อุปกรณ์ตามมาตรฐาน",
        "question_en": "Awareness of standard operating procedures for tools and equipment",
        "row_in_excel": 37
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "B. การตระหนักของพนักงาน",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 8,
        "question": "มีความตระหนักถึงขั้นตอนการขนย้ายโมลอย่างถูกต้องและปลอดภัย",
        "question_en": "Awareness of correct and safe mold transfer procedures",
        "row_in_excel": 38
    },
    # C. การใช้เครื่องมือและสภาพของเครื่องมือ (Molding มี 14 ข้อ)
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "C. การใช้เครื่องมือและสภาพของเครื่องมือ",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 1,
        "question": "ใช้เครื่องมือถูกประเภทกับงาน",
        "question_en": "Using the correct type of tool for the job",
        "row_in_excel": 40
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "C. การใช้เครื่องมือและสภาพของเครื่องมือ",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 2,
        "question": "เครื่องมืออยู่ในสภาพที่ยอมรับได้",
        "question_en": "Tools are in acceptable, serviceable condition",
        "row_in_excel": 41
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "C. การใช้เครื่องมือและสภาพของเครื่องมือ",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 3,
        "question": "ใช้สวิตซ์มือหรือเท้าถูกต้องตามมาตรฐาน",
        "question_en": "Operating hand or foot switches in accordance with safety standards",
        "row_in_excel": 42
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "C. การใช้เครื่องมือและสภาพของเครื่องมือ",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 4,
        "question": "การ์ดของเครื่องจักรหรืออุปกรณ์ต่างๆ ขณะทำงานอยู่ในตำแหน่งปลอดภัย",
        "question_en": "Machine guards and protective covers are positioned safely during operation",
        "row_in_excel": 43
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "C. การใช้เครื่องมือและสภาพของเครื่องมือ",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 5,
        "question": "ไม่มีการรั่วไหลของลม",
        "question_en": "No compressed air leakage",
        "row_in_excel": 44
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "C. การใช้เครื่องมือและสภาพของเครื่องมือ",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 6,
        "question": "สายไฟอยู่ในสภาพปลอดภัยไม่ชารุดหรือเสียหาย",
        "question_en": "Electrical cables are in safe condition without wear, chafing, or damage",
        "row_in_excel": 45
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "C. การใช้เครื่องมือและสภาพของเครื่องมือ",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 7,
        "question": "ใช้อุปกรณ์ล็อค และติดป้ายเตือน (LOTO)",
        "question_en": "Lockout/Tagout (LOTO) devices applied and signs posted properly",
        "row_in_excel": 46
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "C. การใช้เครื่องมือและสภาพของเครื่องมือ",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 8,
        "question": "ตรวจสอบความถูกต้องของท่อ TCU และ ข้อต่อก่อนทำงาน",
        "question_en": "Verify TCU hoses and fittings are properly connected before operation",
        "row_in_excel": 47
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "C. การใช้เครื่องมือและสภาพของเครื่องมือ",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 9,
        "question": "Airgun ตรงตามมาตรฐาน และสภาพพร้อมใช้งานไม่ชำรุด",
        "question_en": "Air blow gun complies with safety standards and is undamaged",
        "row_in_excel": 48
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "C. การใช้เครื่องมือและสภาพของเครื่องมือ",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 10,
        "question": "Electric Stacker หรือ Powered Hand Pallet มีการตรวจเช็ค สภาพพร้อมใช้งาน",
        "question_en": "Electric Stacker or Powered Hand Pallet inspected and in ready-to-use condition",
        "row_in_excel": 49
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "C. การใช้เครื่องมือและสภาพของเครื่องมือ",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 11,
        "question": "เครื่องเย็บมีสภาพสมบูรณ์ พร้อมใช้งาน",
        "question_en": "Stitching/stapling machine in complete, operable condition",
        "row_in_excel": 50
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "C. การใช้เครื่องมือและสภาพของเครื่องมือ",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 12,
        "question": "รถเข็น มีสภาพสมบูรณ์ และจัดเก็บในพื้นที่ที่กำหนด ไม่วางพิงกับเรื่องจักร หรืออุปกรณ์อื่นๆ",
        "question_en": "Carts and trolleys in good condition and parked in designated areas, not leaning on machinery",
        "row_in_excel": 51
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "C. การใช้เครื่องมือและสภาพของเครื่องมือ",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 13,
        "question": "Guard Cover Purge Mat'L ได้มาตรฐาน",
        "question_en": "Purge material guard cover meets standard",
        "row_in_excel": 52
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "C. การใช้เครื่องมือและสภาพของเครื่องมือ",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 14,
        "question": "สภาพของประแจขัน Mold",
        "question_en": "Condition of mold wrench is in acceptable standard",
        "row_in_excel": 53
    },
    # II. สภาพแวดล้อมการทำงาน - การดำเนินการ
    {
        "layer": "Layer 1",
        "category": "II. สภาพแวดล้อมการทำงาน -  การดำเนินการ",
        "subcategory": "เดินรอบๆ เพื่อทำการสังเกตพื้นที่ปฏิบัติงาน",
        "method": "สังเกตและตรวจสอบ",
        "item_order": 1,
        "question": "พื้นที่ปฏิบัติงานไม่มีของวางบนพื้น (5S+1)",
        "question_en": "Workplace floor clear of loose objects and clutter (5S+1)",
        "row_in_excel": 55
    },
    {
        "layer": "Layer 1",
        "category": "II. สภาพแวดล้อมการทำงาน -  การดำเนินการ",
        "subcategory": "เดินรอบๆ เพื่อทำการสังเกตพื้นที่ปฏิบัติงาน",
        "method": "สังเกตและตรวจสอบ",
        "item_order": 2,
        "question": "การกำจัดของเสียคัดแยกถูกประเภท (5S+1)",
        "question_en": "Waste segregated into correct categories for disposal (5S+1)",
        "row_in_excel": 56
    },
    {
        "layer": "Layer 1",
        "category": "II. สภาพแวดล้อมการทำงาน -  การดำเนินการ",
        "subcategory": "เดินรอบๆ เพื่อทำการสังเกตพื้นที่ปฏิบัติงาน",
        "method": "สังเกตและตรวจสอบ",
        "item_order": 3,
        "question": "ทางเดินเปิดโล่งไม่สิ่งของกีดขวาง (5S+1)",
        "question_en": "Walkways clear of obstacles and trip hazards (5S+1)",
        "row_in_excel": 57
    },
    {
        "layer": "Layer 1",
        "category": "II. สภาพแวดล้อมการทำงาน -  การดำเนินการ",
        "subcategory": "เดินรอบๆ เพื่อทำการสังเกตพื้นที่ปฏิบัติงาน",
        "method": "สังเกตและตรวจสอบ",
        "item_order": 4,
        "question": "ทางหนีไฟไม่มีสิ่งของวาง ขัดขวางการอพยพ",
        "question_en": "Emergency exits and evacuation routes free of obstructions",
        "row_in_excel": 58
    },
    {
        "layer": "Layer 1",
        "category": "II. สภาพแวดล้อมการทำงาน -  การดำเนินการ",
        "subcategory": "เดินรอบๆ เพื่อทำการสังเกตพื้นที่ปฏิบัติงาน",
        "method": "สังเกตและตรวจสอบ",
        "item_order": 5,
        "question": "อุปกรณ์ป้องกันอัคคีภัย ไม่มีสิ่งของกีดขวางสามารถเข้าถึงได้กรณีเกิดเหตุฉุกเฉิน",
        "question_en": "Fire safety equipment unobstructed and accessible in emergencies",
        "row_in_excel": 59
    },
    # III. PPE (Molding มี 4 ข้อ)
    {
        "layer": "Layer 1",
        "category": "III. PPE",
        "subcategory": "",
        "method": "สังเกตและตรวจสอบ",
        "item_order": 1,
        "question": "มาตรฐานที่กำหนด รองเท้า, แว่นตา,หมวกนิรภัย",
        "question_en": "Standard mandatory PPE: Safety shoes, safety glasses, and hard hat",
        "row_in_excel": 61
    },
    {
        "layer": "Layer 1",
        "category": "III. PPE",
        "subcategory": "",
        "method": "สังเกตและตรวจสอบ",
        "item_order": 2,
        "question": "สวมถุงมือกันสารเคมี, ถุงมือกันความร้อน,ถุงมือกันบาด",
        "question_en": "Wear chemical-resistant, heat-resistant, or cut-resistant gloves as required",
        "row_in_excel": 62
    },
    {
        "layer": "Layer 1",
        "category": "III. PPE",
        "subcategory": "",
        "method": "สังเกตและตรวจสอบ",
        "item_order": 3,
        "question": "สวมอุปกรณ์ป้องกันการหายใจ เช่นหน้ากากป้องกันฝุ่น  หรือไอสารเคมี",
        "question_en": "Wear respiratory protection such as dust mask or chemical vapor respirator",
        "row_in_excel": 63
    },
    {
        "layer": "Layer 1",
        "category": "III. PPE",
        "subcategory": "",
        "method": "สังเกตและตรวจสอบ",
        "item_order": 4,
        "question": "สวมอุปกรณ์ PPE สำหรับขั้นตอน การทำงานกับพลาสติกเหลวร้อน ทั้งหน้าแม่พิมพ์ และ บริเวณ Nozzle",
        "question_en": "Wear appropriate PPE when working with molten plastic at mold faces and nozzle areas",
        "row_in_excel": 64
    },
    # IIII. High risk process (Molding มี 5 ข้อ)
    {
        "layer": "Layer 1",
        "category": "IIII.  High risk process",
        "subcategory": "",
        "method": "สังเกตและตรวจสอบ",
        "item_order": 1,
        "question": "มีการใช้ แคลมป์ล๊อค plate ขณะซ่อมแม่พิมพ์หรือไม่",
        "question_en": "Are safety plate locking clamps utilized during mold repair/maintenance?",
        "row_in_excel": 66
    },
    {
        "layer": "Layer 1",
        "category": "IIII.  High risk process",
        "subcategory": "",
        "method": "สังเกตและตรวจสอบ",
        "item_order": 2,
        "question": "ตะขอเกี่ยวแม่พิมพ์มี cover และอยู่ในสภาพพร้อมใช้งานหรือไม่",
        "question_en": "Does the mold lifting hook have a safety latch/cover and is it in ready condition?",
        "row_in_excel": 67
    },
    {
        "layer": "Layer 1",
        "category": "IIII.  High risk process",
        "subcategory": "",
        "method": "สังเกตและตรวจสอบ",
        "item_order": 3,
        "question": "ไม่ใช้ Electric Stacker (Jumbo) ขนาด 1.2 ตัน ขนย้ายโมลเข้ามายังพื้นที่ในโซนเครื่องจักร",
        "question_en": "Do not use 1.2-ton Jumbo Electric Stacker to transport molds into machine zones",
        "row_in_excel": 68
    },
    {
        "layer": "Layer 1",
        "category": "IIII.  High risk process",
        "subcategory": "",
        "method": "สังเกตและตรวจสอบ",
        "item_order": 4,
        "question": "การ์ดของเครื่องจักรอยู่ในสภาพพร้อมใช้งาน ไม่แตกหรือชำรุด",
        "question_en": "Machine guarding in serviceable condition, free of cracks or damage",
        "row_in_excel": 69
    },
    {
        "layer": "Layer 1",
        "category": "IIII.  High risk process",
        "subcategory": "",
        "method": "สังเกตและตรวจสอบ",
        "item_order": 5,
        "question": "สวมถุงมือ และ Ear Muff ขณะใช้ cold jet",
        "question_en": "Wear protective gloves and ear muffs while operating cold jet",
        "row_in_excel": 70
    }
]

# Define questions for Mold Maintenance (MM)
mm_questions = [
    # Layer 3
    {
        "layer": "Layer 3",
        "category": "SBOP (Systems Audit) Layer#3",
        "subcategory": "",
        "method": "Check",
        "item_order": 1,
        "question": "การตรวจสอบในเรื่อง SBOP ของ Layer 2 ได้มีการดำเนินการแก้ไขอย่างถูกต้องและปัญหาที่พบได้รับการแก้ไขบนบอร์ด SBOP หรือไม่?",
        "question_en": "Has Layer 2 SBOP audit been correctly rectified and issues addressed on the SBOP board?",
        "row_in_excel": 12
    },
    {
        "layer": "Layer 3",
        "category": "SBOP (Systems Audit) Layer#3",
        "subcategory": "",
        "method": "Check",
        "item_order": 2,
        "question": "Supervisor,หัวหน้ากะและหัวหน้าฝ่ายบริหารในทุกระดับได้นำเรื่อง SBOP เข้าประชุมใน GO-Meeting และเป็นไปตามแผนที่วางไว้ หรือไม่ ?",
        "question_en": "Have Supervisors, shift leaders, and management at all levels included SBOP in GO-Meetings as planned?",
        "row_in_excel": 13
    },
    # Layer 2
    {
        "layer": "Layer 2",
        "category": "SBOP (Systems Audit) Layer#2",
        "subcategory": "",
        "method": "Check",
        "item_order": 1,
        "question": "การตรวจสอบในเรื่อง SBOP ของ Layer 1 ได้มีการดำเนินการแก้ไขอย่างถูกต้องและปัญหาที่พบได้รับการแก้ไขบนบอร์ด SBOP หรือไม่?",
        "question_en": "Has Layer 1 SBOP audit been correctly rectified and issues addressed on the SBOP board?",
        "row_in_excel": 17
    },
    {
        "layer": "Layer 2",
        "category": "SBOP (Systems Audit) Layer#2",
        "subcategory": "",
        "method": "Check",
        "item_order": 2,
        "question": "กิจกรรมด้านความปลอดภัยได้ถูกดำเนินการและตรวจสอบตามกำหนดเวลาหรือไม่ (BBS/CM/PM).",
        "question_en": "Have safety activities been conducted and inspected on schedule (BBS/CM/PM)?",
        "row_in_excel": 18
    },
    # Layer 1 - I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ
    # A. ท่าทางการทำงาน
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "A.ท่าทางการทำงาน",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 1,
        "question": "การเดินปฎิบัติงาน",
        "question_en": "Walking and moving during work operations",
        "row_in_excel": 23
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "A.ท่าทางการทำงาน",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 2,
        "question": "การเข้าออก-พื้นที่ปฏิบัติงาน",
        "question_en": "Entering and exiting work areas safely",
        "row_in_excel": 24
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "A.ท่าทางการทำงาน",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 3,
        "question": "ความสนใจกับงานที่กำลังปฏิบัติ",
        "question_en": "Focus and attentiveness to ongoing tasks",
        "row_in_excel": 25
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "A.ท่าทางการทำงาน",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 4,
        "question": "เทคนิคท่าทางการยกของเหมาะสม/ถูกต้อง",
        "question_en": "Proper manual lifting technique and ergonomics",
        "row_in_excel": 26
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "A.ท่าทางการทำงาน",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 5,
        "question": "การก้ม/การบิด/การดึง/ตำแหน่งของร่างกาย",
        "question_en": "Body posture: Bending, twisting, pulling, positioning",
        "row_in_excel": 27
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "A.ท่าทางการทำงาน",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 6,
        "question": "การยศาสตร์ (เช่น ท่าทาง)",
        "question_en": "Ergonomics and working posture",
        "row_in_excel": 28
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "A.ท่าทางการทำงาน",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 7,
        "question": "ไม่เร่งรีบปฏิบัติงานจนเกินไป",
        "question_en": "Not rushing or hurrying work operations excessively",
        "row_in_excel": 29
    },
    # B. การตระหนักของพนักงาน
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "B. การตระหนักของพนักงาน",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 1,
        "question": "มีความตระหนักถึงพื้นผิวร้อน",
        "question_en": "Awareness of hot surfaces and burn hazards",
        "row_in_excel": 31
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "B. การตระหนักของพนักงาน",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 2,
        "question": "มีความตระหนักถึงจุดเคลื่อนไหวและส่วนหมุน",
        "question_en": "Awareness of moving parts and rotating mechanisms",
        "row_in_excel": 32
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "B. การตระหนักของพนักงาน",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 3,
        "question": "มีความตระหนักถึงจุดหนีบ",
        "question_en": "Awareness of pinch points and nip hazards",
        "row_in_excel": 33
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "B. การตระหนักของพนักงาน",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 4,
        "question": "มีความตระหนักถึงวัตถุแหลมคมหรือบาด",
        "question_en": "Awareness of sharp objects and cut/laceration hazards",
        "row_in_excel": 34
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "B. การตระหนักของพนักงาน",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 5,
        "question": "มีความตระหนักถึงอันตรายไฟฟ้า",
        "question_en": "Awareness of electrical hazards and live equipment",
        "row_in_excel": 35
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "B. การตระหนักของพนักงาน",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 6,
        "question": "มีความตระหนักถึงระบบ Interlock/ปุ่มฉุกเฉิน",
        "question_en": "Awareness of safety interlocks and emergency stop buttons",
        "row_in_excel": 36
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "B. การตระหนักของพนักงาน",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 7,
        "question": "มีความตระหนักถึงการใช้อุปกรณ์ตามมาตรฐาน",
        "question_en": "Awareness of standard operating procedures for tools and equipment",
        "row_in_excel": 37
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "B. การตระหนักของพนักงาน",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 8,
        "question": "มีความตระหนักถึงขั้นตอนการขนย้ายโมลอย่างถูกต้องและปลอดภัย",
        "question_en": "Awareness of correct and safe mold transfer procedures",
        "row_in_excel": 38
    },
    # C. การใช้เครื่องมือและสภาพของเครื่องมือ (MM มี 11 ข้อ)
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "C. การใช้เครื่องมือและสภาพของเครื่องมือ",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 1,
        "question": "ใช้เครื่องมือถูกประเภทกับงาน",
        "question_en": "Using the correct type of tool for the job",
        "row_in_excel": 40
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "C. การใช้เครื่องมือและสภาพของเครื่องมือ",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 2,
        "question": "เครื่องมืออยู่ในสภาพที่ยอมรับได้",
        "question_en": "Tools are in acceptable, serviceable condition",
        "row_in_excel": 41
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "C. การใช้เครื่องมือและสภาพของเครื่องมือ",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 3,
        "question": "ใช้สวิตซ์มือหรือเท้าถูกต้องตามมาตรฐาน",
        "question_en": "Operating hand or foot switches in accordance with safety standards",
        "row_in_excel": 42
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "C. การใช้เครื่องมือและสภาพของเครื่องมือ",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 4,
        "question": "การ์ดของเครื่องจักรหรืออุปกรณ์ต่างๆ ขณะทำงานอยู่ในตำแหน่งปลอดภัย",
        "question_en": "Machine guards and protective covers are positioned safely during operation",
        "row_in_excel": 43
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "C. การใช้เครื่องมือและสภาพของเครื่องมือ",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 5,
        "question": "ไม่มีการรั่วไหลของลม",
        "question_en": "No compressed air leakage",
        "row_in_excel": 44
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "C. การใช้เครื่องมือและสภาพของเครื่องมือ",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 6,
        "question": "สายไฟอยู่ในสภาพปลอดภัยไม่ชารุดหรือเสียหาย",
        "question_en": "Electrical cables are in safe condition without wear, chafing, or damage",
        "row_in_excel": 45
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "C. การใช้เครื่องมือและสภาพของเครื่องมือ",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 7,
        "question": "ใช้อุปกรณ์ล็อค และติดป้ายเตือน (LOTO)",
        "question_en": "Lockout/Tagout (LOTO) devices applied and signs posted properly",
        "row_in_excel": 46
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "C. การใช้เครื่องมือและสภาพของเครื่องมือ",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 8,
        "question": "Airgun ตรงตามมาตรฐาน และสภาพพร้อมใช้งานไม่ชำรุด",
        "question_en": "Air blow gun complies with safety standards and is undamaged",
        "row_in_excel": 47
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "C. การใช้เครื่องมือและสภาพของเครื่องมือ",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 9,
        "question": "Electric Stacker หรือ Powered Hand Pallet มีการตรวจเช็ค สภาพพร้อมใช้งาน",
        "question_en": "Electric Stacker or Powered Hand Pallet inspected and in ready-to-use condition",
        "row_in_excel": 48
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "C. การใช้เครื่องมือและสภาพของเครื่องมือ",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 10,
        "question": "รถเข็น มีสภาพสมบูรณ์ และจัดเก็บในพื้นที่ที่กำหนด ไม่วางพิงกับเรื่องจักร หรืออุปกรณ์อื่นๆ",
        "question_en": "Carts and trolleys in good condition and parked in designated areas, not leaning on machinery",
        "row_in_excel": 49
    },
    {
        "layer": "Layer 1",
        "category": "I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ",
        "subcategory": "C. การใช้เครื่องมือและสภาพของเครื่องมือ",
        "method": "1.  สังเกตพนักงานเป็นเวลา 60 วินาที",
        "item_order": 11,
        "question": "สภาพของประแจขัน Mold",
        "question_en": "Condition of mold wrench is in acceptable standard",
        "row_in_excel": 50
    },
    # II. สภาพแวดล้อมการทำงาน - การดำเนินการ
    {
        "layer": "Layer 1",
        "category": "II. สภาพแวดล้อมการทำงาน -  การดำเนินการ",
        "subcategory": "เดินรอบๆ เพื่อทำการสังเกตพื้นที่ปฏิบัติงาน",
        "method": "สังเกตและตรวจสอบ",
        "item_order": 1,
        "question": "พื้นที่ปฏิบัติงานไม่มีของวางบนพื้น (5S+1)",
        "question_en": "Workplace floor clear of loose objects and clutter (5S+1)",
        "row_in_excel": 52
    },
    {
        "layer": "Layer 1",
        "category": "II. สภาพแวดล้อมการทำงาน -  การดำเนินการ",
        "subcategory": "เดินรอบๆ เพื่อทำการสังเกตพื้นที่ปฏิบัติงาน",
        "method": "สังเกตและตรวจสอบ",
        "item_order": 2,
        "question": "การกำจัดของเสียคัดแยกถูกประเภท (5S+1)",
        "question_en": "Waste segregated into correct categories for disposal (5S+1)",
        "row_in_excel": 53
    },
    {
        "layer": "Layer 1",
        "category": "II. สภาพแวดล้อมการทำงาน -  การดำเนินการ",
        "subcategory": "เดินรอบๆ เพื่อทำการสังเกตพื้นที่ปฏิบัติงาน",
        "method": "สังเกตและตรวจสอบ",
        "item_order": 3,
        "question": "ทางเดินเปิดโล่งไม่สิ่งของกีดขวาง (5S+1)",
        "question_en": "Walkways clear of obstacles and trip hazards (5S+1)",
        "row_in_excel": 54
    },
    {
        "layer": "Layer 1",
        "category": "II. สภาพแวดล้อมการทำงาน -  การดำเนินการ",
        "subcategory": "เดินรอบๆ เพื่อทำการสังเกตพื้นที่ปฏิบัติงาน",
        "method": "สังเกตและตรวจสอบ",
        "item_order": 4,
        "question": "ทางหนีไฟไม่มีสิ่งของวาง ขัดขวางการอพยพ",
        "question_en": "Emergency exits and evacuation routes free of obstructions",
        "row_in_excel": 55
    },
    {
        "layer": "Layer 1",
        "category": "II. สภาพแวดล้อมการทำงาน -  การดำเนินการ",
        "subcategory": "เดินรอบๆ เพื่อทำการสังเกตพื้นที่ปฏิบัติงาน",
        "method": "สังเกตและตรวจสอบ",
        "item_order": 5,
        "question": "อุปกรณ์ป้องกันอัคคีภัย ไม่มีสิ่งของกีดขวางสามารถเข้าถึงได้กรณีเกิดเหตุฉุกเฉิน",
        "question_en": "Fire safety equipment unobstructed and accessible in emergencies",
        "row_in_excel": 56
    },
    # III. PPE (MM มี 5 ข้อ - มี dry ice)
    {
        "layer": "Layer 1",
        "category": "III. PPE",
        "subcategory": "",
        "method": "สังเกตและตรวจสอบ",
        "item_order": 1,
        "question": "มาตรฐานที่กำหนด รองเท้า, แว่นตา,หมวกนิรภัย",
        "question_en": "Standard mandatory PPE: Safety shoes, safety glasses, and hard hat",
        "row_in_excel": 58
    },
    {
        "layer": "Layer 1",
        "category": "III. PPE",
        "subcategory": "",
        "method": "สังเกตและตรวจสอบ",
        "item_order": 2,
        "question": "สวมถุงมือกันสารเคมี, ถุงมือกันความร้อน,ถุงมือกันบาด",
        "question_en": "Wear chemical-resistant, heat-resistant, or cut-resistant gloves as required",
        "row_in_excel": 59
    },
    {
        "layer": "Layer 1",
        "category": "III. PPE",
        "subcategory": "",
        "method": "สังเกตและตรวจสอบ",
        "item_order": 3,
        "question": "สวมอุปกรณ์ป้องกันการหายใจ เช่นหน้ากากป้องกันฝุ่น  หรือไอสารเคมี",
        "question_en": "Wear respiratory protection such as dust mask or chemical vapor respirator",
        "row_in_excel": 60
    },
    {
        "layer": "Layer 1",
        "category": "III. PPE",
        "subcategory": "",
        "method": "สังเกตและตรวจสอบ",
        "item_order": 4,
        "question": "สวมอุปกรณ์ PPE สำหรับขั้นตอน การทำงานกับพลาสติกเหลวร้อน ทั้งหน้าแม่พิมพ์ และ บริเวณ Nozzle",
        "question_en": "Wear appropriate PPE when working with molten plastic at mold faces and nozzle areas",
        "row_in_excel": 61
    },
    {
        "layer": "Layer 1",
        "category": "III. PPE",
        "subcategory": "",
        "method": "สังเกตและตรวจสอบ",
        "item_order": 5,
        "question": "สวมถุงมือขณะทำงานกับ Dry Ice หรือสารเคมี",
        "question_en": "Wear gloves when working with dry ice or chemicals",
        "row_in_excel": 62
    },
    # IIII. High risk process (MM มี 7 ข้อ - มี ultrasonic และ argon)
    {
        "layer": "Layer 1",
        "category": "IIII.  High risk process",
        "subcategory": "",
        "method": "สังเกตและตรวจสอบ",
        "item_order": 1,
        "question": "มีการใช้ แคลมป์ล๊อค plate ขณะซ่อมแม่พิมพ์หรือไม่",
        "question_en": "Are safety plate locking clamps utilized during mold repair/maintenance?",
        "row_in_excel": 64
    },
    {
        "layer": "Layer 1",
        "category": "IIII.  High risk process",
        "subcategory": "",
        "method": "สังเกตและตรวจสอบ",
        "item_order": 2,
        "question": "ตะขอเกี่ยวแม่พิมพ์มี cover และอยู่ในสภาพพร้อมใช้งานหรือไม่",
        "question_en": "Does the mold lifting hook have a safety latch/cover and is it in ready condition?",
        "row_in_excel": 65
    },
    {
        "layer": "Layer 1",
        "category": "IIII.  High risk process",
        "subcategory": "",
        "method": "สังเกตและตรวจสอบ",
        "item_order": 3,
        "question": "เป่าชิ้นงานภายในตู้หลังจากล้างที่เครื่อง ultrasonic หรือไม่",
        "question_en": "Are parts blown dry inside the enclosure after ultrasonic cleaning?",
        "row_in_excel": 66
    },
    {
        "layer": "Layer 1",
        "category": "IIII.  High risk process",
        "subcategory": "",
        "method": "สังเกตและตรวจสอบ",
        "item_order": 4,
        "question": "เครื่องตรวจจับก๊าซอาร์กอนรั่ว ทำงานปกติหรือไม่",
        "question_en": "Is the argon gas leak detector functioning normally?",
        "row_in_excel": 67
    },
    {
        "layer": "Layer 1",
        "category": "IIII.  High risk process",
        "subcategory": "",
        "method": "สังเกตและตรวจสอบ",
        "item_order": 5,
        "question": "ไม่ใช้ Electric Stacker (Jumbo) ขนาด 1.2 ตัน ขนย้ายโมลเข้ามายังพื้นที่ในโซนเครื่องจักร",
        "question_en": "Do not use 1.2-ton Jumbo Electric Stacker to transport molds into machine zones",
        "row_in_excel": 68
    },
    {
        "layer": "Layer 1",
        "category": "IIII.  High risk process",
        "subcategory": "",
        "method": "สังเกตและตรวจสอบ",
        "item_order": 6,
        "question": "การ์ดของเครื่องจักรอยู่ในสภาพพร้อมใช้งาน ไม่แตกหรือชำรุด",
        "question_en": "Machine guarding in serviceable condition, free of cracks or damage",
        "row_in_excel": 69
    },
    {
        "layer": "Layer 1",
        "category": "IIII.  High risk process",
        "subcategory": "",
        "method": "สังเกตและตรวจสอบ",
        "item_order": 7,
        "question": "สวมถุงมือ และ Ear Muff ขณะใช้ cold jet",
        "question_en": "Wear protective gloves and ear muffs while operating cold jet",
        "row_in_excel": 70
    }
]

print(f"Molding questions: {len(molding_questions)}")
print(f"MM questions: {len(mm_questions)}")

# 1. Update master_sbop_questions.json
with open("master_sbop_questions.json", "r", encoding="utf-8") as f:
    master = json.load(f)

master["MOLD"] = {
    "name": "Molding",
    "name_th": "แผนกฉีดขึ้นรูป (Molding)",
    "doc_no": "TE-EHS-053 Rev. K/Eff. 15-Oct-26",
    "items": molding_questions
}

master["MM"] = {
    "name": "Mold Maintenance",
    "name_th": "แผนกซ่อมบำรุงแม่พิมพ์ (Mold Maintenance)",
    "doc_no": "TE-EHS-053 Rev. K/Eff. 15-Oct-26",
    "items": mm_questions
}

with open("master_sbop_questions.json", "w", encoding="utf-8") as f:
    json.dump(master, f, ensure_ascii=False, indent=2)
print("Updated master_sbop_questions.json successfully!")

# 2. Update SQLite database (sbop_local.db)
conn = sqlite3.connect("sbop_local.db")
cur = conn.cursor()

# Update MOLD department info
cur.execute("""
    UPDATE departments 
    SET name_th = 'แผนกฉีดขึ้นรูป (Molding)', 
        name_en = 'Molding Department', 
        description = 'Injection Molding Operations' 
    WHERE code = 'MOLD'
""")

# Insert MM department info
cur.execute("""
    INSERT OR REPLACE INTO departments (code, name_th, name_en, description) 
    VALUES ('MM', 'แผนกซ่อมบำรุงแม่พิมพ์ (Mold Maintenance)', 'Mold Maintenance Department', 'Mold Maintenance and Tool Servicing')
""")

# Delete old checklist_templates for MOLD & MM
cur.execute("DELETE FROM checklist_templates WHERE department_code IN ('MOLD', 'MM')")

# Insert new templates for MOLD
for item in molding_questions:
    cur.execute("""
        INSERT INTO checklist_templates (department_code, layer, category, subcategory, method, item_order, question_th, question_en, row_in_excel)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        'MOLD',
        item['layer'],
        item['category'],
        item['subcategory'],
        item['method'],
        item['item_order'],
        item['question'],
        item['question_en'],
        item['row_in_excel']
    ))

# Insert new templates for MM
for item in mm_questions:
    cur.execute("""
        INSERT INTO checklist_templates (department_code, layer, category, subcategory, method, item_order, question_th, question_en, row_in_excel)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        'MM',
        item['layer'],
        item['category'],
        item['subcategory'],
        item['method'],
        item['item_order'],
        item['question'],
        item['question_en'],
        item['row_in_excel']
    ))

conn.commit()
print("Updated SQLite database departments and checklist_templates successfully!")

# Verify counts
mold_cnt = cur.execute("SELECT count(*) FROM checklist_templates WHERE department_code = 'MOLD'").fetchone()[0]
mm_cnt = cur.execute("SELECT count(*) FROM checklist_templates WHERE department_code = 'MM'").fetchone()[0]
depts = cur.execute("SELECT code, name_th FROM departments").fetchall()
print(f"MOLD count in DB: {mold_cnt}, MM count in DB: {mm_cnt}")
print(f"Departments in DB: {depts}")
conn.close()
