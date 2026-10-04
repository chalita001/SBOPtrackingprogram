export type Language = 'th' | 'en';

export const translations = {
  th: {
    // App & Header
    appTitle: 'ระบบตรวจเช็คความปลอดภัย SBOP',
    appSubtitle: 'โปรแกรมติดตามและตรวจสอบความปลอดภัยหน้างาน (Safety Behavior Observation Program)',
    d1Connected: 'D1: d1sbop',
    r2Connected: 'R2: r2sbop',
    switchLanguage: 'English',
    login: 'เข้าสู่ระบบ',
    register: 'สมัครสมาชิก',
    logout: 'ออกจากระบบ',
    welcome: 'ยินดีต้อนรับ',

    // Nav Tabs
    tabChecklist: 'ฟอร์มตรวจเช็ค SBOP',
    tabHistory: 'ประวัติการตรวจเช็ค',
    tabDefects: 'รายการข้อผิดปกติ & แผนแก้ไข',
    tabDashboard: 'แดชบอร์ด',
    tabAccountManager: 'จัดการสมาชิก (Admin)',
    tabEmailLogs: 'บันทึกการส่งอีเมลเตือน',
    myAccount: 'ข้อมูลบัญชีพนักงาน',

    // Common Actions & Filters
    actions: 'การจัดการ',
    refresh: 'รีเฟรชข้อมูล',
    close: 'ปิด',
    cancel: 'ยกเลิก',
    save: 'บันทึก',
    edit: 'แก้ไข',
    delete: 'ลบ',
    search: 'ค้นหา',
    all: 'ทั้งหมด',
    allStatus: 'สถานะทั้งหมด',
    allDepartments: 'แผนกทั้งหมด',
    allYears: 'ทุกปี',
    allMonths: 'ทุกเดือน',
    allSeverities: 'ระดับความรุนแรงทั้งหมด',
    allAreas: 'ทุกพื้นที่',
    confirm: 'ยืนยัน',
    you: 'คุณ (You)',
    itemsCountUnit: 'ข้อ',
    timesUnit: 'ครั้ง',
    itemsUnit: 'รายการ',
    accountsUnit: 'บัญชี',
    peopleUnit: 'ท่าน',
    loading: 'กำลังโหลดข้อมูล...',
    noDataFound: 'ไม่พบข้อมูลตามเงื่อนไขที่เลือก',

    // Form Headers
    department: 'แผนก',
    selectDepartment: 'เลือกแผนกที่ตรวจ',
    year: 'รอบปี',
    month: 'รอบเดือน',
    layer: 'ระดับการตรวจ (Layer)',
    layer1: 'Layer 1 — Leader (ตรวจรายกะ/รายวัน)',
    layer2: 'Layer 2 — Supervisor (ตรวจรายสัปดาห์ & ทบทวน Layer 1)',
    layer3: 'Layer 3 — Manager (ตรวจรายเดือน & ทบทวน Layer 1-2)',
    lockedDepartmentNotice: 'ล็อคตามแผนกของคุณ (ไม่สามารถตรวจข้ามแผนกได้)',
    currentPeriodNotice: 'รอบปัจจุบันขณะตรวจ (ไม่สามารถเลือกย้อนหลัง/ล่วงหน้า)',
    shift: 'กะการทำงาน',
    shiftA: 'กะ A (เช้า)',
    shiftB: 'กะ B (บ่าย)',
    shiftC: 'กะ C (ดึก)',
    shiftDay: 'กะกลางวัน (Day)',
    shiftNight: 'กะกลางคืน (Night)',
    machineAndProduct: 'เครื่องจักรและผลิตภัณฑ์ (M/C & Products)',
    machinePlaceholder: 'เช่น M/C 08 (Connector Type-C)',
    auditor: 'ผู้ตรวจ (Auditor)',
    auditDate: 'วันที่ตรวจ (Audit Date)',

    // Inspection Code
    inspectionCode: 'รหัสรายการ (Inspection Code)',
    inspectionCodePlaceholder: 'เช่น 001, 002',
    selectInspectionCode: 'เลือกรหัสรายการที่ต้องการตรวจ/สอบทาน',
    newInspectionCode: '+ สร้างรหัสรายการใหม่',
    codeBadge: 'รหัสรายการ',
    lockedToUserRole: 'ล็อคตามระดับสิทธิ์ของคุณ',

    // Checklist Evaluation
    category: 'หมวดหมู่ / ประเภท',
    method: 'วิธีการตรวจ',
    question: 'รายการตรวจ / คำถาม',
    evaluation: 'ผลการประเมิน',
    ok: 'OK (ผ่าน)',
    no: 'NO (ผิดปกติ/ไม่ผ่าน)',
    na: 'N/A (ไม่เกี่ยวข้อง)',
    defectDetails: 'รายละเอียดเมื่อตรวจพบสิ่งผิดปกติ (NO)',
    findingTopic: 'ปัญหาที่พบ (Finding Topic)',
    findingPlaceholder: 'ระบุสภาพที่ไม่ปลอดภัย หรือพฤติกรรมเสี่ยงที่พบ...',
    severity: 'ระดับความรุนแรง',
    severityMinor: 'Minor (แก้ไขได้ทันที ไม่ต้องลงบอร์ด)',
    severityMajor: 'Major (ต้องใช้เวลาแก้ไข / ลงบอร์ด SBOP)',
    actionPlan: 'แนวทางแก้ไข / มาตรการป้องกัน (Action Plan)',
    actionPlaceholder: 'ระบุวิธีแก้ไข หรือผู้ที่ต้องประสานงาน...',
    responsiblePerson: 'ผู้รับผิดชอบ',
    responsiblePlaceholder: 'เช่น นายวิชัย เจริญพร (ช่างซ่อมบำรุง)',
    dueDate: 'กำหนดวันเสร็จ (Due Date)',
    attachPhoto: 'แนบรูปภาพสิ่งผิดปกติ (Cloudflare R2)',
    takePhoto: 'ถ่ายภาพ / อัปโหลดไฟล์',
    photoUploaded: 'อัปโหลดรูปภาพสำเร็จ',
    removePhoto: 'ลบรูปภาพ',

    // Summary & Score
    summaryTitle: 'สรุปผลการตรวจประเมิน',
    totalQuestions: 'จำนวนรายการทั้งหมด',
    totalOk: 'ผ่าน (OK)',
    totalNo: 'ไม่ผ่าน (NO)',
    totalNa: 'ไม่เกี่ยวข้อง (N/A)',
    safetyScore: 'คะแนนความปลอดภัย (Safety Score)',
    comments: 'ข้อคิดเห็นหรือข้อเสนอแนะสำหรับการปรับปรุง (Comments / Suggestion)',
    commentsPlaceholder: 'ระบุข้อคิดเห็นเพื่อการปรับปรุงกระบวนการทำงาน...',
    previousFindings: 'ปัญหาที่พบจากรอบก่อน (Finding from previous audit)',
    previousPlaceholder: 'ระบุการติดตามผลการแก้ไขจากรอบตรวจครั้งก่อน...',
    saveInspection: 'บันทึกการตรวจเช็ค (Save Inspection)',
    saving: 'กำลังบันทึกข้อมูล...',
    sendEmailReminder: 'ส่งอีเมลแจ้งเตือน (Email Alert)',
    resetForm: 'ล้างแบบฟอร์ม',

    // Prior Layer Verification View (Layer 2 & 3)
    priorLayerTitle: 'รายการตรวจระดับ',
    supervisorVerificationTitle: 'การตรวจสอบคำตอบและผลการตรวจของ Layer 1 (Leader Verification)',
    supervisorVerificationDesc: 'Supervisor ตรวจสอบผลการตรวจเช็คหน้างานของ Leader รายการต่อรายการตามแบบฟอร์ม เพื่อยืนยันว่าปัญหาได้รับการแก้ไขและนำขึ้นบอร์ด SBOP แล้ว',
    managerVerificationTitle: 'การทบทวนผลของ Layer 1 (Leader) และ Layer 2 (Supervisor) Systems Verification',
    managerVerificationDesc: 'Manager ทบทวนคำตอบและการดำเนินงานด้านความปลอดภัยของทั้งสองระดับ เพื่อนำประเด็นเข้าที่ประชุม GO-Meeting หรือขยายผลสู่ Plant VSM',
    verifyingInspectionCode: 'ตรวจสอบผลตรวจรหัสรายการ:',
    reviewingInspectionCode: 'ทบทวนผลตรวจรหัสรายการ:',
    layer1AuditFound: 'พบผลตรวจ Layer 1 เรียบร้อย ✅',
    layer1AuditNotFound: 'ยังไม่มีผลตรวจ Layer 1 ในรหัสนี้ ⏳',
    layer2AuditFound: 'Layer 2: ตรวจแล้ว ✅',
    layer2AuditNotFound: 'Layer 2: ไม่มี ⏳',
    fetchingPriorLayerData: 'กำลังดึงผลตรวจย้อนหลัง...',
    noPriorLayerNotice: 'ยังไม่พบบันทึกการตรวจในรหัสนี้ สามารถตอบแบบประเมินได้ตามปกติ',
    allPassedNoDefects: 'ผลตรวจล่าสุดไม่พบข้อบกพร่อง (All Passed)',
    viewFullProofPhoto: 'ดูรูปภาพขนาดเต็ม (Cloudflare R2)',
    openInNewTab: 'เปิดในแท็บใหม่ (Cloudflare R2)',
    expandForm: 'ขยายดูแบบฟอร์มทั้งหมด',
    collapseForm: 'ย่อแบบฟอร์ม',
    viewAllAnswers: 'คลิกเพื่อดูคำตอบทั้งหมด',
    collapseChecklist: 'ย่อรายการตรวจ',
    auditorCommentsTitle: 'ข้อคิดเห็น / ข้อเสนอแนะจาก',

    // Inspection History
    historySubtitle: 'ประวัติการตรวจประเมินความปลอดภัย SBOP แยกตามแผนก รอบเดือน และรอบปี',
    adminViewBanner: '👑 โหมดผู้ดูแลระบบ (Admin View): แสดงประวัติการตรวจเช็คทั้งหมดของทุกแผนกและพนักงานทุกคน',
    userViewBanner: '👤 บันทึกการตรวจส่วนตัวของคุณ: แสดงเฉพาะข้อมูลที่คุณได้บันทึกไว้ในระบบ',
    searchHistoryPlaceholder: 'ค้นหาเครื่องจักร, ผลิตภัณฑ์ หรือผู้ตรวจ...',
    dateAndShiftCol: 'วันที่ตรวจ & กะ',
    deptAndLayerCol: 'แผนก & ระดับ (Layer)',
    mcAndProductsCol: 'เครื่องจักร / ผลิตภัณฑ์',
    auditorCol: 'ผู้ตรวจ (Auditor)',
    resultsCol: 'ผลการตรวจ (OK / NO)',
    scoreCol: 'Safety Score',
    actionsCol: 'การจัดการ',
    roundPeriod: 'รอบ',
    viewFullRecord: 'ดูรายละเอียดฉบับเต็ม',
    deleteRecord: 'ลบรายการ',
    confirmDeleteRecord: 'คุณแน่ใจหรือไม่ว่าต้องการลบประวัติการตรวจเช็คนี้?',
    inspectionDetailTitle: 'บันทึกการตรวจเช็ค:',
    loadingHistory: 'กำลังโหลดประวัติการตรวจเช็ค...',
    noHistoryFound: 'ไม่พบข้อมูลการตรวจเช็คตามตัวกรองที่เลือก',

    // Defect Accountability Board
    defectBoardTitle: 'รายการข้อผิดปกติ & แผนแก้ไข (Defects Tracker)',
    defectBoardSubtitle: 'SBOP Accountability Board & ติดตามผลการแก้ไขสิ่งผิดปกติที่ตรวจพบ',
    criteriaTitle: 'เกณฑ์การประเมินข้อบกพร่อง (Criteria of Outstanding Item):',
    minorDesc: 'ปัญหาที่ไม่ซับซ้อน สามารถแก้ไขได้ในทันที (ไม่จำเป็นต้องลงบันทึกในบอร์ด SBOP)',
    majorDesc: 'ปัญหาที่ใช้เวลาในการแก้ไขนาน หรือต้องการแผนกอื่นสนับสนุน ซึ่งต้องกำหนดวันเสร็จ (ลงบันทึกในบอร์ด SBOP)',
    filterLabel: 'ตัวกรอง:',
    majorOnly: 'เฉพาะ Major (ต้องลงบอร์ด)',
    minorOnly: 'เฉพาะ Minor (แก้ไขทันที)',
    foundDefectsCount: 'พบข้อบกพร่อง {0} รายการ',
    loadingDefects: 'กำลังดึงข้อมูลข้อบกพร่องและรูปภาพ...',
    noDefectsMatching: 'ไม่พบรายการข้อบกพร่องตามเงื่อนไขที่เลือก (Zero Defects)',
    sendAlertBtn: 'ส่งอีเมลเตือน',
    emailFollowupModalTitle: 'ส่งอีเมลแจ้งเตือนการแก้ไขปัญหาความปลอดภัย',
    emailFollowupSubject: '[SBOP Follow-up] แจ้งเตือนการแก้ไขปัญหาความปลอดภัย แผนก',

    // Admin Dashboard
    dashboardTitle: 'แดชบอร์ดบริหารความปลอดภัย SBOP',
    dashboardSubtitle: 'ภาพรวมการตรวจสอบความปลอดภัยของทุกแผนก การทบทวนผล 3 ระดับ (Layer 1-3) การติดตามประเด็นความเสี่ยง และสถานะสมาชิกในระบบ',
    dashboardExecutiveBadge: 'Admin Executive Dashboard',
    overallStatus: 'สถานะรวม',
    statusPass: 'ผ่านเกณฑ์ (PASS)',
    statusAttn: 'เฝ้าระวัง (ATTN)',
    filterYear: 'ปี:',
    filterMonth: 'รอบเดือน:',
    filterDept: 'แผนก:',
    updateData: 'อัปเดตข้อมูล',
    totalInspectionsKpi: 'การตรวจประเมินทั้งหมด',
    avgSafetyScoreKpi: 'คะแนนความปลอดภัยเฉลี่ย',
    defectsFoundKpi: 'ข้อบกพร่องที่พบ (NO)',
    systemUsersKpi: 'สมาชิกในระบบ',
    coverageInfo: 'ครอบคลุม {0} แผนก • ผู้ตรวจ {1} ท่าน',
    standardCriteria: 'เกณฑ์มาตรฐาน',
    belowCriteria: 'ต่ำกว่าเกณฑ์ 85%',
    criteriaNotice: 'เกณฑ์ผ่านของโรงงานคือ 85.0% ขึ้นไป',
    passedCountLabel: 'ผ่านการตรวจ (OK):',
    viewAllLink: 'ดูทั้งหมด →',
    manageLink: 'จัดการ →',
    allUsersApproved: 'ทุกบัญชีได้รับการอนุมัติแล้ว',
    pendingUsersBadge: 'รออนุมัติ {0} บัญชี ⏳',
    deptMatrixTitle: 'ผลการดำเนินงานความปลอดภัยแยกตามแผนก (Department Matrix)',
    deptMatrixSubtitle: 'สถิติการตรวจเช็ค คะแนนเฉลี่ย และข้อบกพร่องตาม 7 แผนกหลัก',
    deptCol: 'แผนก (Department)',
    inspectionsCountCol: 'จำนวนครั้งที่ตรวจ',
    avgScoreCol: 'คะแนนเฉลี่ย',
    okCol: 'ผ่าน (OK)',
    noCol: 'พบปัญหา (NO)',
    auditorCountCol: 'ผู้ตรวจ',
    notStartedYet: '- ยังไม่เริ่ม -',
    layersAuditTitle: 'การตรวจสอบ 3 ระดับ (Layers Audit)',
    layersAuditSubtitle: 'สถานะการตรวจตามสายการบังคับบัญชา',
    layer1Header: 'Layer 1: Leader',
    layer1Subheader: 'ตรวจรายกะ / รายวัน',
    layer2Header: 'Layer 2: Supervisor',
    layer2Subheader: 'ทบทวน & ตรวจสอบ L1',
    layer3Header: 'Layer 3: Manager',
    layer3Subheader: 'ภาพรวมระบบ & GO-Meeting',
    auditedCount: 'บันทึกแล้ว:',
    defectsCountLabel: 'ปัญหาที่พบ:',
    userDistributionTitle: 'ผู้ใช้งานในระบบแยกตามระดับ',
    manageMembersLink: 'จัดการสมาชิก →',
    recentDefectsTitle: 'ประเด็นความไม่ปลอดภัยล่าสุดที่ตรวจพบ (Recent Safety Defects)',
    recentDefectsSubtitle: 'รายการข้อบกพร่องที่บันทึกพร้อมหลักฐานภาพถ่ายบน Cloudflare R2',
    viewUpdateAllLink: 'ดูและอัปเดตสถานะแก้ไขทั้งหมด',
    viewProofPhotoBtn: 'ดูรูปหลักฐาน (Cloudflare R2)',
    noPhotoAttached: 'ไม่มีรูปถ่ายแนบ',
    zeroDefectsBanner: 'ไม่พบประเด็นข้อบกพร่องตามตัวกรองที่เลือก (Zero Defects Found)',
    accessDeniedTitle: 'การเข้าถึงถูกจำกัด (Access Denied)',
    accessDeniedDesc: 'หน้านี้สงวนไว้สำหรับผู้ดูแลระบบ (Admin) เท่านั้น บัญชีของคุณไม่มีสิทธิ์ในการดูข้อมูลแดชบอร์ดบริหารนี้',

    // User & Account Manager
    userInfoTitle: 'ข้อมูลพนักงาน (Account Info)',
    firstName: 'ชื่อ',
    lastName: 'นามสกุล',
    nameSurname: 'ชื่อ - นามสกุล',
    phone: 'เบอร์โทรศัพท์',
    emailAndPhone: 'อีเมล & เบอร์โทร',
    deptAndPosition: 'แผนก & ตำแหน่ง',
    email: 'อีเมลบริษัท',
    position: 'ตำแหน่ง',
    responsibleArea: 'พื้นที่รับผิดชอบ',
    systemRole: 'สิทธิ์ในระบบ',
    accountStatus: 'สถานะบัญชี',
    registeredDate: 'สมัครเมื่อ:',
    roleLayer1: 'Layer 1 (Leader — หัวหน้างานระดับต้น)',
    roleLayer2: 'Layer 2 (Supervisor — หัวหน้างานระดับกุม)',
    roleLayer3: 'Layer 3 (Manager — ผู้จัดการแผนก)',
    roleAdmin: 'ผู้ดูแลระบบ (Admin)',
    roleManager: 'Layer 3 (Manager — ผู้จัดการแผนก)',
    roleSupervisor: 'Layer 2 (Supervisor — หัวหน้างานระดับกุม)',
    roleLeader: 'Layer 1 (Leader — หัวหน้างานระดับต้น)',
    roleInspector: 'Layer 1 (Leader — หัวหน้างานระดับต้น)',
    roleStaff: 'พนักงานทั่วไป (Staff)',
    statusPending: 'รอการอนุมัติ (Pending Approval)',
    statusApproved: 'อนุมัติแล้ว (Approved)',
    statusRejected: 'ปฏิเสธ (Rejected)',
    editProfile: 'แก้ไขข้อมูลส่วนตัว',
    changePassword: 'เปลี่ยนรหัสผ่าน',
    currentPassword: 'รหัสผ่านปัจจุบัน',
    newPassword: 'รหัสผ่านใหม่',
    confirmPassword: 'ยืนยันรหัสผ่านใหม่',
    saveChanges: 'บันทึกการเปลี่ยนแปลง',

    // Admin Account Manager Table
    accountManagerTitle: 'ระบบจัดการสมาชิกและอนุมัติสิทธิ์ (Admin Member Manager)',
    accountManagerSubtitle: 'จัดการข้อมูลพนักงาน อนุมัติการสมัครสมาชิก ลบข้อมูล และกำหนดสิทธิ์การใช้งาน',
    totalMembers: 'สมาชิกทั้งหมด',
    pendingApproval: 'รอการอนุมัติ',
    approvedMembers: 'อนุมัติแล้ว',
    rejectedMembers: 'ปฏิเสธ (Rejected)',
    searchMember: 'ค้นหาชื่อ, อีเมล หรือตำแหน่ง...',
    filterDepartment: 'กรองตามแผนก',
    filterStatus: 'กรองตามสถานะ',
    approve: 'อนุมัติการสมัคร',
    reject: 'ไม่อนุมัติ',
    deleteUser: 'ลบสมาชิก',
    confirmDeleteUser: 'คุณแน่ใจหรือไม่ว่าต้องการลบสมาชิกรายนี้?',
    approveSuccess: 'อนุมัติสมาชิกสำเร็จและส่งอีเมลแจ้งเตือนเรียบร้อยแล้ว',
    editRoleAndDept: 'แก้ไขสิทธิ์และแผนก',
    selectRole: 'เลือกสิทธิ์ในระบบ',
    selectDept: 'เลือกแผนก',
    saveRoleSuccess: 'อัปเดตสิทธิ์ของพนักงานเรียบร้อยแล้ว',

    // Email System
    emailLogsTitle: 'ประวัติการส่งอีเมลแจ้งเตือนของระบบ (Email Notification Logs)',
    recipient: 'ผู้รับ (Email)',
    subject: 'หัวข้ออีเมล',
    sentTime: 'เวลาที่ส่ง',
    emailStatus: 'สถานะ',
    viewEmail: 'ดูเนื้อหาอีเมล',
    sendCustomAlert: 'ส่งอีเมลแจ้งเตือนด้วยตนเอง',
    recipientEmail: 'อีเมลผู้รับ',
    emailMessage: 'ข้อความแจ้งเตือน',
    sendNow: 'ส่งอีเมลทันที',

    // Notification Messages
    saveSuccess: 'บันทึกข้อมูลการตรวจเช็คเรียบร้อยแล้ว!',
    defectWarning: 'ตรวจพบสิ่งผิดปกติ ระบบได้จัดส่งอีเมลแจ้งเตือนไปยังผู้รับผิดชอบและแอดมินแล้ว',
    loginSuccess: 'เข้าสู่ระบบสำเร็จ',
    registerSuccess: 'ลงทะเบียนสำเร็จ! กรุณารอผู้ดูแลระบบอนุมัติบัญชีของคุณ',

    // Additional Universal Labels
    adminModeBadge: '👑 โหมดผู้ดูแลระบบ (Admin View):',
    userModeBadge: '👤 บันทึกการตรวจส่วนตัวของคุณ:',
    adminModeDesc: 'แสดงประวัติการตรวจเช็คทั้งหมดของทุกแผนกและพนักงานทุกคน',
    userModeDesc: 'แสดงเฉพาะข้อมูลที่คุณ ({0}) ได้บันทึกไว้ในระบบ',
    totalInspectionsCount: 'บันทึกทั้งหมด',
    inspectingItemsCount: 'รายการที่ตรวจประเมิน',
    roundMonthYear: 'รอบเดือน / ปี',
    layer1LeaderResults: '1. ผลการตรวจของ Layer 1 (Leader)',
    layer2SupervisorResults: '2. ผลการตรวจของ Layer 2 (Supervisor)',
    auditorBy: 'ผู้ตรวจ',
    commentsSectionTitle: 'ส่วนสรุปความคิดเห็นและติดตามผล (Comments & Action Tracking)',
    l1Guidance: 'Leader: บันทึกการตรวจความปลอดภัยหน้างานประจำวัน/กะ',
    l2Guidance: 'Supervisor: ทบทวนและติดตามผลของ Layer 1 พร้อมรายงานประจำสัปดาห์',
    l3Guidance: 'Manager: ตรวจประเมินระดับระบบและติดตามผลเพื่อนำเข้าที่ประชุม GO-Meeting',
    pendingApprovalNotice: 'บัญชีของคุณ ({0}) อยู่ระหว่างรอการอนุมัติสิทธิ์จากผู้ดูแลระบบ คุณสามารถทดลองดูข้อมูลทั่วไปได้',
    viewProfileBtn: 'ดูข้อมูลโปรไฟล์',
    systemLoading: 'กำลังโหลดระบบ SBOP Safety Tracking...',
    password: 'รหัสผ่าน',
    quickLoginTitle: 'บัญชีทดสอบระบบ (Quick Login):',
    noAccountYet: 'ยังไม่มีบัญชีผู้ใช้งาน?',
    alreadyHaveAccount: 'มีบัญชีผู้ใช้งานอยู่แล้ว?',
    directEmailAlert: 'ส่งข้อความแจ้งเตือนไปยังอีเมลของบัญชี (Direct Email Notification)',
    systemSentEmails: 'รายการอีเมลที่ระบบส่งออก ({0} ฉบับ)',
    noEmailLogs: 'ยังไม่มีประวัติการส่งอีเมล',
    loadingLogs: 'กำลังโหลดประวัติ...',
    regPasswordMin: 'รหัสผ่าน (อย่างน้อย 6 ตัวอักษร) *',
    regPendingNote: 'หมายเหตุ: บัญชีที่ลงทะเบียนใหม่จะอยู่ในสถานะ รอการอนุมัติ (Pending) จนกว่าผู้ดูแลระบบจะตรวจสอบและอนุมัติการใช้งาน โดยระบบจะส่งอีเมลแจ้งเตือนผลการอนุมัติไปยังอีเมลของคุณ',
    backToLogin: 'ไปที่หน้าเข้าสู่ระบบ (Sign In)',
    submitting: 'กำลังส่งข้อมูล...',
    signingIn: 'กำลังเข้าสู่ระบบ...',
    noQuestionsInLayer: 'ไม่พบคำถามการตรวจเช็คในระดับนี้',
    loadingDeptQuestions: 'กำลังโหลดหัวข้อการตรวจประเมินของแผนก {0} ({1})...',
    loginSubtitle: 'เข้าสู่ระบบติดตามความปลอดภัย SBOP',
    registerSubtitle: 'ลงทะเบียนสมาชิกใหม่สำหรับระบบตรวจเช็ค SBOP',
    allDepartmentsComply: 'ทุกแผนกปฏิบัติตามมาตรฐานความปลอดภัยครบถ้วน',
    recipientEmailLabel: 'อีเมลผู้รับ (Recipient Email) *',
    recipientNameLabel: 'ชื่อผู้รับ (Recipient Name)',
    messageContentLabel: 'ข้อความในอีเมล (Message Content) *',
    sendAlertEmailBtn: 'ส่งอีเมลติดตามงานแก้ไข (Send Email Alert)',
    openFullProofPhoto: 'เปิดดูรูปขนาดเต็มบน Cloudflare R2',
    noPhotoEvidence: 'ไม่มีรูปภาพแนบ',
  },
  en: {
    // App & Header
    appTitle: 'SBOP Safety Audit System',
    appSubtitle: 'Safety Behavior Observation Program & Cloudflare Tracking',
    d1Connected: 'D1: d1sbop',
    r2Connected: 'R2: r2sbop',
    switchLanguage: 'ไทย',
    login: 'Sign In',
    register: 'Register',
    logout: 'Sign Out',
    welcome: 'Welcome',

    // Nav Tabs
    tabChecklist: 'SBOP Checklist',
    tabHistory: 'Inspection History',
    tabDefects: 'Defects & Action Board',
    tabDashboard: 'Dashboard',
    tabAccountManager: 'Account Manager (Admin)',
    tabEmailLogs: 'Email Notification Logs',
    myAccount: 'Employee Account Info',

    // Common Actions & Filters
    actions: 'Actions',
    refresh: 'Refresh',
    close: 'Close',
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    search: 'Search',
    all: 'All',
    allStatus: 'All Status',
    allDepartments: 'All Departments',
    allYears: 'All Years',
    allMonths: 'All Months',
    allSeverities: 'All Severities',
    allAreas: 'All Areas',
    confirm: 'Confirm',
    you: 'You',
    itemsCountUnit: 'items',
    timesUnit: 'times',
    itemsUnit: 'items',
    accountsUnit: 'accounts',
    peopleUnit: 'auditors',
    loading: 'Loading data...',
    noDataFound: 'No data found matching the selected filters',

    // Form Headers
    department: 'Department',
    selectDepartment: 'Select Department',
    year: 'Cycle Year',
    month: 'Cycle Month',
    layer: 'Inspection Layer',
    layer1: 'Layer 1 — Leader (Daily / Shift Verification)',
    layer2: 'Layer 2 — Supervisor (Weekly Verification & Review Layer 1)',
    layer3: 'Layer 3 — Manager (Monthly Audit & Review Layer 1-2)',
    lockedDepartmentNotice: 'Locked to your department (Cross-department access restricted)',
    currentPeriodNotice: 'Current period only (Retroactive/future selection restricted)',
    shift: 'Working Shift',
    shiftA: 'Shift A (Morning)',
    shiftB: 'Shift B (Afternoon)',
    shiftC: 'Shift C (Night)',
    shiftDay: 'Day Shift',
    shiftNight: 'Night Shift',
    machineAndProduct: 'Machine & Products (M/C)',
    machinePlaceholder: 'e.g. M/C 08 (Connector Type-C)',
    auditor: 'Auditor',
    auditDate: 'Audit Date',

    // Inspection Code
    inspectionCode: 'Inspection Code',
    inspectionCodePlaceholder: 'e.g. 001, 002',
    selectInspectionCode: 'Select Inspection Code to Audit/Verify',
    newInspectionCode: '+ New Inspection Code',
    codeBadge: 'Code',
    lockedToUserRole: 'Locked to your user role',

    // Checklist Evaluation
    category: 'Category',
    method: 'Method',
    question: 'Checklist Item / Question',
    evaluation: 'Evaluation',
    ok: 'OK (Pass)',
    no: 'NO (Defect / Fail)',
    na: 'N/A (Not Applicable)',
    defectDetails: 'Defect Details & Action Plan (when NO)',
    findingTopic: 'Finding Topic / Observed Issue',
    findingPlaceholder: 'Describe unsafe behavior or condition observed...',
    severity: 'Severity Level',
    severityMinor: 'Minor (Immediate fix, no board needed)',
    severityMajor: 'Major (Requires time/support, record on SBOP board)',
    actionPlan: 'Corrective Action Plan',
    actionPlaceholder: 'Describe corrective actions taken or planned...',
    responsiblePerson: 'Responsible Person',
    responsiblePlaceholder: 'e.g. Wichai J. (Maintenance)',
    dueDate: 'Target Due Date',
    attachPhoto: 'Attach Defect Photo (Cloudflare R2)',
    takePhoto: 'Take Photo / Upload Image',
    photoUploaded: 'Image Uploaded to R2',
    removePhoto: 'Remove Photo',

    // Summary & Score
    summaryTitle: 'Inspection Summary & Score',
    totalQuestions: 'Total Questions',
    totalOk: 'Pass (OK)',
    totalNo: 'Defects (NO)',
    totalNa: 'N/A',
    safetyScore: 'Safety Compliance Score',
    comments: 'Comments / Suggestion for Process Improvement',
    commentsPlaceholder: 'Feedback or improvement suggestions...',
    previousFindings: 'Finding from previous audit',
    previousPlaceholder: 'Follow up on corrective actions from previous round...',
    saveInspection: 'Save Inspection Record',
    saving: 'Saving Record...',
    sendEmailReminder: 'Send Email Notification',
    resetForm: 'Reset Form',

    // Prior Layer Verification View (Layer 2 & 3)
    priorLayerTitle: 'Inspection Level',
    supervisorVerificationTitle: 'Layer 1 Inspection Audit & Verification (Leader)',
    supervisorVerificationDesc: 'Supervisor audits Leader field inspection responses item-by-item to ensure defects are addressed and raised on the SBOP board',
    managerVerificationTitle: 'System Review of Layer 1 (Leader) and Layer 2 (Supervisor) Audits',
    managerVerificationDesc: 'Manager reviews inspection answers and systemic safety performance to escalate issues to GO-Meeting or Plant VSM',
    verifyingInspectionCode: 'Verifying Inspection Code:',
    reviewingInspectionCode: 'Reviewing Inspection Code:',
    layer1AuditFound: 'Layer 1 record verified ✅',
    layer1AuditNotFound: 'No Layer 1 record for this code yet ⏳',
    layer2AuditFound: 'Layer 2: Audited ✅',
    layer2AuditNotFound: 'Layer 2: Pending ⏳',
    fetchingPriorLayerData: 'Fetching inspection records...',
    noPriorLayerNotice: 'No prior audit found for this code. You may proceed with evaluation as normal.',
    allPassedNoDefects: 'All items passed without defects (All Passed)',
    viewFullProofPhoto: 'View Full Size Photo (Cloudflare R2)',
    openInNewTab: 'Open in new tab (Cloudflare R2)',
    expandForm: 'Expand full form',
    collapseForm: 'Collapse form',
    viewAllAnswers: 'Click to view full checklist answers',
    collapseChecklist: 'Collapse checklist',
    auditorCommentsTitle: 'Comments / Suggestions from',

    // Inspection History
    historySubtitle: 'Historical SBOP safety compliance audits segregated by department, month, and year',
    adminViewBanner: '👑 Administrator Mode: Displaying full inspection history across all departments and auditors',
    userViewBanner: '👤 Personal Inspection Records: Showing only inspections performed and recorded by you',
    searchHistoryPlaceholder: 'Search machine, product or auditor...',
    dateAndShiftCol: 'Audit Date & Shift',
    deptAndLayerCol: 'Dept & Layer',
    mcAndProductsCol: 'Machine / Product',
    auditorCol: 'Auditor',
    resultsCol: 'Results (OK / NO)',
    scoreCol: 'Safety Score',
    actionsCol: 'Actions',
    roundPeriod: 'Round',
    viewFullRecord: 'View Full Details',
    deleteRecord: 'Delete Record',
    confirmDeleteRecord: 'Are you sure you want to delete this inspection record?',
    inspectionDetailTitle: 'Inspection Record:',
    loadingHistory: 'Loading inspection records...',
    noHistoryFound: 'No inspection records found matching the selected filters',

    // Defect Accountability Board
    defectBoardTitle: 'Defects & Action Board',
    defectBoardSubtitle: 'SBOP Accountability Board & Corrective Action Tracking',
    criteriaTitle: 'Criteria of Outstanding Item (TE-EHS-053):',
    minorDesc: 'Simple issues that can be fixed immediately (Board entry not required)',
    majorDesc: 'Issues requiring time or multi-department support with a fixed due date (Logged on SBOP board)',
    filterLabel: 'Filter:',
    majorOnly: 'Major Only (On Board)',
    minorOnly: 'Minor Only (Immediate)',
    foundDefectsCount: '{0} defect items found',
    loadingDefects: 'Loading defect items and images...',
    noDefectsMatching: 'No defects found matching the selected criteria (Zero Defects)',
    sendAlertBtn: 'Send Alert Email',
    emailFollowupModalTitle: 'Send Safety Issue Follow-up Email',
    emailFollowupSubject: '[SBOP Follow-up] Safety Issue Notification Dept',

    // Admin Dashboard
    dashboardTitle: 'SBOP Safety Executive Dashboard',
    dashboardSubtitle: 'Executive safety compliance overview, 3-layer verification tracking (Layer 1-3), defect resolution monitor, and user access metrics',
    dashboardExecutiveBadge: 'Admin Executive Dashboard',
    overallStatus: 'Overall Status',
    statusPass: 'Passing (PASS)',
    statusAttn: 'Attention (ATTN)',
    filterYear: 'Year:',
    filterMonth: 'Month:',
    filterDept: 'Dept:',
    updateData: 'Update Data',
    totalInspectionsKpi: 'Total Inspections',
    avgSafetyScoreKpi: 'Average Safety Score',
    defectsFoundKpi: 'Defects Found (NO)',
    systemUsersKpi: 'System Users',
    coverageInfo: 'Covering {0} departments • {1} auditors',
    standardCriteria: 'Standard Met',
    belowCriteria: 'Below 85% Target',
    criteriaNotice: 'Plant compliance threshold is 85.0% or higher',
    passedCountLabel: 'Passed (OK):',
    viewAllLink: 'View All →',
    manageLink: 'Manage →',
    allUsersApproved: 'All accounts approved',
    pendingUsersBadge: '{0} pending approval ⏳',
    deptMatrixTitle: 'Department Safety Performance Matrix',
    deptMatrixSubtitle: 'Audit volume, compliance safety score, and defect counts across 7 key departments',
    deptCol: 'Department',
    inspectionsCountCol: 'Audits Count',
    avgScoreCol: 'Avg Score',
    okCol: 'Pass (OK)',
    noCol: 'Defects (NO)',
    auditorCountCol: 'Auditors',
    notStartedYet: '- Not Started -',
    layersAuditTitle: '3-Layer Systems Verification',
    layersAuditSubtitle: 'Audit execution and review status across leadership levels',
    layer1Header: 'Layer 1: Leader',
    layer1Subheader: 'Daily / Shift Audit',
    layer2Header: 'Layer 2: Supervisor',
    layer2Subheader: 'Verify & Review Layer 1',
    layer3Header: 'Layer 3: Manager',
    layer3Subheader: 'Plant Oversight & GO-Meeting',
    auditedCount: 'Audited:',
    defectsCountLabel: 'Defects Found:',
    userDistributionTitle: 'User Distribution by Hierarchy',
    manageMembersLink: 'Manage Members →',
    recentDefectsTitle: 'Recent Safety Defects & Action Tracker',
    recentDefectsSubtitle: 'Defect findings logged with photo evidence stored in Cloudflare R2',
    viewUpdateAllLink: 'View & Update All Action Plans',
    viewProofPhotoBtn: 'View Proof Photo (R2)',
    noPhotoAttached: 'No photo attached',
    zeroDefectsBanner: 'Zero defects found matching the selected criteria',
    accessDeniedTitle: 'Access Denied',
    accessDeniedDesc: 'This page is restricted to administrators. Your account does not have permission to view the executive dashboard.',

    // User & Account Manager
    userInfoTitle: 'Employee Account Information',
    firstName: 'First Name',
    lastName: 'Last Name',
    nameSurname: 'Name - Surname',
    phone: 'Phone Number',
    emailAndPhone: 'Email & Phone',
    deptAndPosition: 'Dept & Position',
    email: 'Corporate Email',
    position: 'Job Position',
    responsibleArea: 'Responsible Area',
    systemRole: 'System Role',
    accountStatus: 'Account Status',
    registeredDate: 'Registered:',
    roleLayer1: 'Layer 1 (Leader)',
    roleLayer2: 'Layer 2 (Supervisor)',
    roleLayer3: 'Layer 3 (Manager)',
    roleAdmin: 'Administrator (Admin)',
    roleManager: 'Layer 3 (Manager)',
    roleSupervisor: 'Layer 2 (Supervisor)',
    roleLeader: 'Layer 1 (Leader)',
    roleInspector: 'Layer 1 (Leader)',
    roleStaff: 'Staff Member',
    statusPending: 'Pending Approval',
    statusApproved: 'Approved',
    statusRejected: 'Rejected',
    editProfile: 'Edit Profile',
    changePassword: 'Change Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm New Password',
    saveChanges: 'Save Changes',

    // Admin Account Manager Table
    accountManagerTitle: 'Member Account Management & Approval',
    accountManagerSubtitle: 'Manage employee profiles, review pending signups, remove accounts, and assign system permissions',
    totalMembers: 'Total Members',
    pendingApproval: 'Pending Approval',
    approvedMembers: 'Approved Members',
    rejectedMembers: 'Rejected (Rejected)',
    searchMember: 'Search by name, email or position...',
    filterDepartment: 'Filter by Department',
    filterStatus: 'Filter by Status',
    approve: 'Approve Member',
    reject: 'Reject',
    deleteUser: 'Delete Account',
    confirmDeleteUser: 'Are you sure you want to delete this user?',
    approveSuccess: 'Account approved successfully and notification email sent',
    editRoleAndDept: 'Edit Role and Department',
    selectRole: 'Select System Role',
    selectDept: 'Select Department',
    saveRoleSuccess: 'Employee permissions updated successfully',

    // Email System
    emailLogsTitle: 'System Email Notification Logs',
    recipient: 'Recipient Email',
    subject: 'Email Subject',
    sentTime: 'Sent Timestamp',
    emailStatus: 'Status',
    viewEmail: 'View Email Content',
    sendCustomAlert: 'Send Custom Email Alert',
    recipientEmail: 'Recipient Email Address',
    emailMessage: 'Notification Message Body',
    sendNow: 'Send Email Now',

    // Notification Messages
    saveSuccess: 'Inspection recorded successfully!',
    defectWarning: 'Defect recorded. Alert notification email sent to responsible team and admins.',
    loginSuccess: 'Signed in successfully',
    registerSuccess: 'Registration submitted! Please wait for administrator approval.',

    // Additional Universal Labels
    adminModeBadge: '👑 Administrator View:',
    userModeBadge: '👤 Personal Inspection Records:',
    adminModeDesc: 'Displaying full inspection history across all departments and auditors',
    userModeDesc: 'Showing only records submitted by you ({0})',
    totalInspectionsCount: 'Total Records',
    inspectingItemsCount: 'Checklist Items',
    roundMonthYear: 'Month / Year Cycle',
    layer1LeaderResults: '1. Layer 1 Inspection Results (Leader)',
    layer2SupervisorResults: '2. Layer 2 Inspection Results (Supervisor)',
    auditorBy: 'Auditor',
    commentsSectionTitle: 'Comments & Action Tracking',
    l1Guidance: 'Leader: Daily / shift on-site safety observation',
    l2Guidance: 'Supervisor: Review & follow up Layer 1 with weekly verification',
    l3Guidance: 'Manager: Systemic audit & action tracking for Plant GO-Meeting',
    pendingApprovalNotice: 'Your account ({0}) is pending administrator approval. You can browse general information in read-only mode.',
    viewProfileBtn: 'View Profile',
    systemLoading: 'Loading SBOP Safety Tracking System...',
    password: 'Password',
    quickLoginTitle: 'Demo Test Accounts (Quick Login):',
    noAccountYet: "Don't have an account yet?",
    alreadyHaveAccount: 'Already have an account?',
    directEmailAlert: 'Direct Email Notification',
    systemSentEmails: 'Sent Emails History ({0} emails)',
    noEmailLogs: 'No email notification history recorded yet',
    loadingLogs: 'Loading history...',
    regPasswordMin: 'Password (min 6 characters) *',
    regPendingNote: 'Note: Newly registered accounts will remain Pending until approved by an administrator. An approval notification will be dispatched to your registered email.',
    backToLogin: 'Go to Sign In',
    submitting: 'Submitting...',
    signingIn: 'Signing in...',
    noQuestionsInLayer: 'No checklist items found for this layer',
    loadingDeptQuestions: 'Loading checklist items for {0} ({1})...',
    loginSubtitle: 'Sign in to SBOP Safety Audit System',
    registerSubtitle: 'Create a new account for SBOP audit tracking',
    allDepartmentsComply: 'All departments comply with safety standards',
    recipientEmailLabel: 'Recipient Email *',
    recipientNameLabel: 'Recipient Name',
    messageContentLabel: 'Message Content *',
    sendAlertEmailBtn: 'Send Email Alert',
    openFullProofPhoto: 'View Full Size Photo (Cloudflare R2)',
    noPhotoEvidence: 'No photo attached',
  }
};

export const questionTranslationsEn: Record<string, string> = {
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

export const categoryTranslationsEn: Record<string, string> = {
  'SBOP (Systems Audit) Layer#3': 'SBOP (Systems Audit) Layer#3',
  'SBOP (Systems Audit) Layer#2': 'SBOP (Systems Audit) Layer#2',
  'I. ความเสี่ยงด้านความปลอดภัย - การดำเนินการ': 'I. Safety Risks - Operational Practices',
  'II. สภาพแวดล้อมการทำงาน -  การดำเนินการ': 'II. Work Environment - Operational Conditions',
  'III. PPE': 'III. Personal Protective Equipment (PPE)',
  'IIII.  High risk process': 'IV. High Risk Process',
};

export const subcategoryTranslationsEn: Record<string, string> = {
  'A.ท่าทางการทำงาน': 'A. Ergonomics & Posture',
  'B. การตระหนักของพนักงาน': 'B. Worker Safety Awareness',
  'C. การใช้เครื่องมือและสภาพของเครื่องมือ': 'C. Tool Condition & Usage',
};

export const methodTranslationsEn: Record<string, string> = {
  'Check': 'Check',
  '1.  สังเกตพนักงานเป็นเวลา 60 วินาที': 'Observe worker for 60 seconds',
  'สังเกตและตรวจสอบ': 'Observe & Audit',
};

export function localizeQuestion(q: string, lang: Language): string {
  if (!q) return '';
  if (lang === 'en') {
    return questionTranslationsEn[q.trim()] || q;
  }
  return q;
}

export function localizeCategory(c: string, lang: Language): string {
  if (!c) return 'General';
  if (lang === 'en') {
    return categoryTranslationsEn[c.trim()] || c;
  }
  return c;
}

export function localizeSubcategory(s: string, lang: Language): string {
  if (!s) return '';
  if (lang === 'en') {
    return subcategoryTranslationsEn[s.trim()] || s;
  }
  return s;
}

export function localizeMethod(m: string, lang: Language): string {
  if (!m) return '';
  if (lang === 'en') {
    return methodTranslationsEn[m.trim()] || m;
  }
  return m;
}

