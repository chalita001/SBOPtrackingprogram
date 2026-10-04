const questionMap = {
  "การตรวจสอบในเรื่อง SBOP ของ Layer 2 ได้มีการดำเนินการแก้ไขอย่างถูกต้องและปัญหาที่พบได้รับการแก้ไขบนบอร์ด SBOP หรือไม่?":
    "Has Layer 2 SBOP verification been executed properly, and have identified defects been corrected on the SBOP board?",
  "Supervisor,หัวหน้ากะและหัวหน้าฝ่ายบริหารในทุกระดับได้นำเรื่อง SBOP เข้าประชุมใน GO-Meeting และเป็นไปตามแผนที่วางไว้ หรือไม่ ?":
    "Have Supervisors, Shift Leaders, and Management brought SBOP items into GO-Meetings according to schedule?",
  "การตรวจสอบในเรื่อง SBOP ของ Layer 1 ได้มีการดำเนินการแก้ไขอย่างถูกต้องและปัญหาที่พบได้รับการแก้ไขบนบอร์ด SBOP หรือไม่?":
    "Has Layer 1 SBOP verification been conducted correctly, and have identified issues been resolved on the SBOP board?",
  "กิจกรรมด้านความปลอดภัยได้ถูกดำเนินการและตรวจสอบตามกำหนดเวลาหรือไม่ (BBS/CM/PM).":
    "Have safety activities been performed and audited on schedule (BBS/CM/PM)?",
  "สังเกตพนักงานเป็นเวลา 60 วินาที":
    "Observe employee for 60 seconds",
  "การเดินปฎิบัติงาน":
    "Walking and moving while working",
  "การเดินปฏิบัติงาน":
    "Walking and moving while working",
  "การเข้าออก-พื้นที่ปฏิบัติงาน":
    "Entering and exiting work areas",
  "ความสนใจกับงานที่กำลังปฏิบัติ":
    "Focus and attention on the ongoing task",
  "เทคนิคท่าทางการยกของเหมาะสม/ถูกต้อง":
    "Proper manual lifting techniques and ergonomic posture",
  "การก้ม/การบิด/การดึง/ตำแหน่งของร่างกาย":
    "Bending, twisting, pulling, and body positioning",
  "การยศาสตร์ (เช่น ท่าทาง)":
    "Ergonomics (e.g., posture and repetitive strain)",
  "ไม่เร่งรีบปฏิบัติงานจนเกินไป":
    "Working at a safe pace without excessive rushing",
  "มีความตระหนักถึงพื้นผิวร้อน":
    "Awareness of hot surfaces and thermal hazards",
  "มีความตระหนักถึงจุดเคลื่อนไหวและส่วนหมุน":
    "Awareness of moving parts and rotating equipment",
  "มีความตระหนักถึงจุดหนีบ":
    "Awareness of pinch points and nip hazards",
  "มีความตระหนักถึงวัตถุแหลมคมหรือบาด":
    "Awareness of sharp edges and cut hazards",
  "มีความตระหนักถึงอันตรายไฟฟ้า":
    "Awareness of electrical hazards",
  "มีความตระหนักถึงระบบ Interlock/ปุ่มฉุกเฉิน":
    "Awareness of safety interlocks and emergency stop buttons",
  "มีความตระหนักถึงการใช้อุปกรณ์ตามมาตรฐาน":
    "Awareness of standard operating procedures for tools and equipment",
  "มีความตระหนักถึงขั้นตอนการขนย้ายโมลอย่างถูกต้องและปลอดภัย":
    "Awareness of correct and safe mold transfer procedures",
  "ใช้เครื่องมือถูกประเภทกับงาน":
    "Using the correct type of tool for the job",
  "เครื่องมืออยู่ในสภาพที่ยอมรับได้":
    "Tools are in acceptable, serviceable condition",
  "ใช้สวิตซ์มือหรือเท้าถูกต้องตามมาตรฐาน":
    "Operating hand or foot switches in accordance with safety standards",
  "การ์ดของเครื่องจักรหรืออุปกรณ์ต่างๆ ขณะทำงานอยู่ในตำแหน่งปลอดภัย":
    "Machine guards and protective covers are positioned safely during operation",
  "ไม่มีการรั่วไหลของลม":
    "No compressed air leakage",
  "สายไฟอยู่ในสภาพปลอดภัยไม่ชารุดหรือเสียหาย":
    "Electrical cables are in safe condition without wear, chafing, or damage",
  "ใช้อุปกรณ์ล็อค และติดป้ายเตือน (LOTO)":
    "Lockout/Tagout (LOTO) devices applied and signs posted properly",
  "ตรวจสอบความถูกต้องของท่อ TCU และ ข้อต่อก่อนทำงาน":
    "Verify TCU hoses and fittings are properly connected before operation",
  "Airgun ตรงตามมาตรฐาน และสภาพพร้อมใช้งานไม่ชำรุด":
    "Air blow gun complies with safety standards and is undamaged",
  "รถ  Electric Stacker หรือ Powered Hand Pallet มีการตรวจเช็ค สภาพพร้อมใช้งาน":
    "Electric Stacker or Powered Hand Pallet inspected and in ready-to-use condition",
  "เครื่องเย็บมีสภาพสมบูรณ์ พร้อมใช้งาน":
    "Stitching/stapling machine in complete, operable condition",
  "รถเข็น มีสภาพสมบูรณ์ และจัดเก็บในพื้นที่ที่กำหนด ไม่วางพิงกับเรื่องจักร หรืออุปกรณ์อื่นๆ":
    "Carts and trolleys in good condition and parked in designated areas, not leaning on machinery",
  "พื้นที่ปฏิบัติงานไม่มีของวางบนพื้น (5S+1)":
    "Workplace floor clear of loose objects and clutter (5S+1)",
  "การกำจัดของเสียคัดแยกถูกประเภท (5S+1)":
    "Waste segregated into correct categories for disposal (5S+1)",
  "ทางเดินเปิดโล่งไม่สิ่งของกีดขวาง (5S+1)":
    "Walkways clear of obstacles and trip hazards (5S+1)",
  "ทางหนีไฟไม่มีสิ่งของวาง ขัดขวางการอพยพ":
    "Emergency exits and evacuation routes free of obstructions",
  "อุปกรณ์ป้องกันอัคคีภัย ไม่มีสิ่งของวางสามารถเข้าถึงได้กรณีเกิดเหตุฉุกเฉิน":
    "Fire safety equipment unobstructed and accessible in emergencies",
  "มาตรฐานที่กำหนด รองเท้า, แว่นตา,หมวกนิรภัย":
    "Standard mandatory PPE: Safety shoes, safety glasses, and hard hat",
  "สวมถุงมือกันสารเคมี, ถุงมือกันความร้อน,ถุงมือกันบาด":
    "Wear chemical-resistant, heat-resistant, or cut-resistant gloves as required",
  "สวมอุปกรณ์ป้องกันการหายใจ เช่นหน้ากากป้องกันฝุ่น  หรือไอสารเคมี":
    "Wear respiratory protection such as dust mask or chemical vapor respirator",
  "สวมอุปกรณ์ PPE สำหรับขั้นตอน การทำงานกับพลาสติกเหลวร้อน ทั้งหน้าแม่พิมพ์ และ บริเวณ Nozzle":
    "Wear appropriate PPE when working with molten plastic at mold faces and nozzle areas",
  "มีการใช้ แคลมป์ล๊อค plate ขณะซ่อมแม่พิมพ์หรือไม่":
    "Are safety plate locking clamps utilized during mold repair/maintenance?",
  "ตะขอเกี่ยวแม่พิมพ์มี cover และอยู่ในสภาพพร้อมใช้งานหรือไม่":
    "Does the mold lifting hook have a safety latch/cover and is it in ready condition?",
  "เป่าชิ้นงานภายในตู้หลังจากล้างที่เครื่อง ultrasonic หรือไม่":
    "Are parts blown dry inside the enclosure after ultrasonic cleaning?",
  "เครื่องตรวจจับก๊าซอาร์กอนรั่ว ทำงานปกติหรือไม่":
    "Is the argon gas leak detector functioning normally?",
  "ไม่ใช้ Electric Stacker (Jumbo) ขนาด 1.2 ตัน ขนย้ายโมลเข้ามายังพื้นที่ในโซนเครื่องจักร":
    "Do not use 1.2-ton Jumbo Electric Stacker to transport molds into machine zones",
  "การ์ดของเครื่องจักรอยู่ในสภาพพร้อมใช้งาน ไม่แตกหรือชำรุด":
    "Machine guarding in serviceable condition, free of cracks or damage",
  "สวมถุงมือ และ Ear Muff ขณะใช้ cold jet":
    "Wear protective gloves and ear muffs while operating cold jet",
  "มีความตระหนักถึงการคัดแยกขยะที่ถูกต้อง":
    "Awareness of proper waste segregation guidelines",
  "ปิดการ์ดเครื่องจักรทุกครั้งที่มีการ Repair หรือ PM":
    "Ensure machine safety doors/guards are closed upon completion of Repair or PM",
  "บันไดสภาพพร้อมใช้งาน และมีการตรวจเช็คก่อนใช้งาน":
    "Ladders inspected before use and in safe operable condition",
  "อุปกรณ์ป้องกันอัคคีภัย ไม่มีสิ่งของกีดขวางสามารถเข้าถึงได้กรณีเกิดเหตุฉุกเฉิน":
    "Fire fighting equipment clear and accessible in emergencies",
  "ผู้รับเหมาผ่านการอบรม พร้อมสำหรับทำงานบนที่สูง (กรณีมีผู้รับเหมาปฏิบัติงาน)":
    "Contractors trained and certified for working at heights (when applicable)",
  "ใช้อุปกรณ์กันตกสำหรับงานที่สูง และสภาพพร้อมใช้งาน":
    "Fall protection equipment inspected and properly worn when working at heights",
  "อุปกรณ์ป้องกันอัคคีภัยภายในพื้นที่ ไม่มีสิ่งของกีดขวาง":
    "Fire safety equipment in the area unobstructed",
  "มาตรฐานที่กำหนด รองเท้า, แว่นตา":
    "Standard mandatory PPE: Safety shoes and safety glasses",
  "มีความตระหนักถึงอันตรายจากสิ่งของตกจากที่สูง":
    "Awareness of overhead hazards and falling objects",
  "มีความตระหนักถึงความปลอดภัยในการขับขี่ Fork lift":
    "Awareness of forklift driving safety regulations",
  "พาเลทสภาพพร้อมใช้งาน ไม่แตกชำรุด":
    "Pallets in sound condition without cracks, splits, or structural damage",
  "Fork lift สภาพพร้อมใช้งาน มีการตรวจเช็คก่อนใช้งาน ถอดกุญแจทุกครั้งหลังจากการใช้งาน":
    "Forklift inspected prior to use and ignition key removed after operation",
  "สวมหมวกแข็งเมื่อปฏิบัติงานอยู่ในพื้นที่ในRack":
    "Wear hard hat when working inside racking zones",
  "สวมถุงมือผ้าทุกครั้งที่มีการตัดสายรัดสแตนเลส":
    "Wear cloth gloves whenever cutting stainless steel strapping bands",
  "ไม่นำรถ Fork Lift เสากระโดงงาสูง Serial number MHB4279H เข้าไปยังพื้นที่ห้องควบคุม":
    "Do not drive high-mast Forklift (S/N MHB4279H) into control room areas",
  "Set limit max การยกงาของรถโฟรค์ลิฟ กำหนดมาตรฐานการตักงานจากที่สูง":
    "Set maximum lift height limit for forklift mast according to high-rack retrieval standards",
  "ครื่องวัดแรงดึงมีการใช้การ์ดก่อนการทดสอบ":
    "Tensile tester guard in place and engaged prior to test execution",
  "มีการใช้การ์ดหรืออุปกรณ์ป้องกันในการตัด":
    "Guards or safety fixtures utilized during cutting operations",
  "มีความตระหนักถึงการใช้ Hand lift,Lifter":
    "Awareness of proper hand pallet truck and lifter operation",
  "เครื่องมือสำหรับตัด,กรรไกร สภาพพร้อมใช้งาน":
    "Cutting tools and shears in ready and safe condition",
  "Hand lift,Lifter ไม่ชำรุดพร้อมใช้งานอยู่เสมอ":
    "Hand pallet truck and lifter intact, undamaged, and always ready for use",
  "Electric Stacker สภาพพร้อมใช้งาน ถอดกุญแจทุกครั้งหลังจากการใช้งาน":
    "Electric Stacker in good condition and key removed after use",
  "สวมถุงมือยางเมื่อทำการล้างชิ้นส่วน,Material":
    "Wear rubber gloves when cleaning parts and raw materials",
  "สวมถุงมือผ้าเมื่อทำการ Set up Die,Material":
    "Wear cloth gloves during die setup and material handling",
  "สวม Ear Plug หรือ Ear Muff ทุกครั้งเมื่อเครื่องจักรทำงานเสียงดัง":
    "Wear ear plugs or ear muffs whenever operating in high-noise areas",
  "ปิดการ์ดเครื่องจักรทุกครั้งที่ใช้เครื่องจักร":
    "Always keep machine guards closed during machine operation",
  "สวมใส่อุปกรณ์ป้องกันเสียงดัง":
    "Wear hearing protection equipment",
  "ระบบ interlock ทำงานได้ปกติ และหินเจียรหยุดก่อนเปิดการ์ดหรือไม่":
    "Does the safety interlock function properly and grinding wheel stop before opening guard?"
};

const fs = require('fs');

let sql = '';
for (const [th, en] of Object.entries(questionMap)) {
  const escapedTh = th.replace(/'/g, "''");
  const escapedEn = en.replace(/'/g, "''");
  sql += `UPDATE checklist_templates SET question_en = '${escapedEn}' WHERE question_th = '${escapedTh}';\n`;
}

fs.writeFileSync('update_question_en.sql', sql);
console.log('Generated update_question_en.sql with statements count:', Object.keys(questionMap).length);
