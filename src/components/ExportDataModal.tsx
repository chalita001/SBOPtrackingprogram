import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { useAuth } from '../context/AuthContext';
import { api, normalizeImageUrl } from '../services/api';
import {
  X,
  FileSpreadsheet,
  Image as ImageIcon,
  Download,
  Check,
  AlertTriangle,
  Building2,
  Calendar,
  Filter,
  Layers,
  CheckSquare,
  Square,
  Printer,
  Loader2,
  Sparkles,
  FolderArchive,
  RefreshCw,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'excel' | 'images';
}

export const ExportDataModal: React.FC<ExportDataModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'excel',
}) => {
  const { user, language } = useAuth();
  const [activeTab, setActiveTab] = useState<'excel' | 'images'>(defaultTab);

  // Filters
  const currentYear = new Date().getFullYear().toString();
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedLayer, setSelectedLayer] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  // Excel options
  const [includeInspections, setIncludeInspections] = useState<boolean>(true);
  const [includeDefects, setIncludeDefects] = useState<boolean>(true);
  const [includeSummary, setIncludeSummary] = useState<boolean>(true);
  const [includeUsers, setIncludeUsers] = useState<boolean>(false);
  const [fileFormat, setFileFormat] = useState<'xlsx' | 'csv'>('xlsx');

  // Image Gallery & Selection
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<{
    inspections: any[];
    defects: any[];
    users: any[];
    summary: any;
  } | null>(null);

  const [selectedImageIds, setSelectedImageIds] = useState<Set<number>>(new Set());
  const [zipProgress, setZipProgress] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      loadExportData();
    }
  }, [isOpen, defaultTab, selectedDept, selectedYear, selectedMonth, selectedLayer]);

  const loadExportData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedDept !== 'all') params.department = selectedDept;
      if (selectedYear !== 'all') params.year = selectedYear;
      if (selectedMonth !== 'all') params.month = selectedMonth;
      if (selectedLayer !== 'all') params.layer = selectedLayer;

      const res = await api.getExportData(params);
      setData(res);

      // By default select all images with valid URLs
      const photoItems = (res.defects || []).filter((d: any) => d.image_url);
      setSelectedImageIds(new Set(photoItems.map((d: any) => d.id)));
    } catch (err) {
      console.warn('Failed to load export data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const photoDefects = (data?.defects || []).filter((d: any) => {
    if (!d.image_url) return false;
    if (selectedSeverity !== 'all' && d.severity !== selectedSeverity) return false;
    return true;
  });

  const toggleImageSelection = (id: number) => {
    setSelectedImageIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllImages = () => {
    setSelectedImageIds(new Set(photoDefects.map((d: any) => d.id)));
  };

  const deselectAllImages = () => {
    setSelectedImageIds(new Set());
  };

  // 1. Export Excel / CSV Function
  const handleExportExcel = () => {
    if (!data) return;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    if (fileFormat === 'csv') {
      let csvContent = '\uFEFF'; // UTF-8 BOM for Thai support in Microsoft Excel

      // Summary
      if (includeSummary && data.summary) {
        csvContent += '=== สรุปภาพรวมความปลอดภัย (Safety Summary KPI) ===\r\n';
        csvContent += `รอบตรวจทั้งหมด,${data.summary.total_inspections || 0},ครั้ง\r\n`;
        csvContent += `ผ่านเกณฑ์รวม (OK),${data.summary.grand_total_ok || 0},รายการ\r\n`;
        csvContent += `สิ่งผิดปกติรวม (NO),${data.summary.grand_total_no || 0},รายการ\r\n`;
        csvContent += `คะแนนเฉลี่ย,${data.summary.average_score || 100}%\r\n\r\n`;
      }

      // Inspections
      if (includeInspections && data.inspections.length > 0) {
        csvContent += '=== ประวัติการตรวจเช็ค SBOP (Inspection Audits) ===\r\n';
        csvContent += 'ID,รหัสตรวจ,แผนก,ระดับ Layer,วันที่ตรวจ,กะ,เครื่องจักร/ผลิตภัณฑ์,ผู้ตรวจ,คะแนน(%),ผ่าน(OK),ผิดปกติ(NO),ไม่เกี่ยวข้อง(NA),ข้อคิดเห็น\r\n';
        data.inspections.forEach((ins) => {
          const row = [
            ins.id,
            `"${ins.inspection_code || '001'}"`,
            `"${ins.department_code || ''}"`,
            `"${ins.layer || ''}"`,
            `"${ins.audit_date || ''}"`,
            `"${ins.shift || ''}"`,
            `"${(ins.mc_and_products || '').replace(/"/g, '""')}"`,
            `"${ins.auditor_name || ''}"`,
            ins.score_percent ?? 100,
            ins.total_ok || 0,
            ins.total_no || 0,
            ins.total_na || 0,
            `"${(ins.comments || '').replace(/"/g, '""')}"`,
          ];
          csvContent += row.join(',') + '\r\n';
        });
        csvContent += '\r\n';
      }

      // Defects
      if (includeDefects && data.defects.length > 0) {
        csvContent += '=== รายการสิ่งผิดปกติและข้อบกพร่อง (Defects & Findings) ===\r\n';
        csvContent += 'ID,รหัสตรวจ,แผนก,Layer,วันที่ตรวจ,หมวดหมู่,คำถาม,อาการผิดปกติที่พบ,ระดับความรุนแรง,สถานะ,แนวทางแก้ไข,ผู้รับผิดชอบ,กำหนดเสร็จ,ลิงก์รูปก่อนแก้(Before),ลิงก์รูปหลังแก้(After)\r\n';
        data.defects.forEach((def) => {
          const statusText = def.defect_status === 'resolved' ? 'แก้แล้ว' : def.defect_status === 'reviewing' ? 'รอตรวจสอบ' : 'ยังไม่แก้';
          const row = [
            def.id,
            `"${def.inspection_code || '001'}"`,
            `"${def.department_code || ''}"`,
            `"${def.layer || ''}"`,
            `"${def.audit_date || ''}"`,
            `"${def.category || ''}"`,
            `"${(def.question || '').replace(/"/g, '""')}"`,
            `"${(def.finding_topic || '').replace(/"/g, '""')}"`,
            `"${def.severity || 'Minor'}"`,
            `"${statusText}"`,
            `"${(def.action_plan || '').replace(/"/g, '""')}"`,
            `"${def.responsible_person || ''}"`,
            `"${def.due_date || ''}"`,
            `"${def.image_url || ''}"`,
            `"${def.fix_image_url || ''}"`,
          ];
          csvContent += row.join(',') + '\r\n';
        });
        csvContent += '\r\n';
      }

      // Users
      if (includeUsers && data.users.length > 0) {
        csvContent += '=== รายชื่อสมาชิกในระบบ (System Users) ===\r\n';
        csvContent += 'ID,Username,ชื่อ,นามสกุล,อีเมล,แผนก,ตำแหน่ง,สิทธิ์(Role),สถานะ,วันที่อนุมัติ\r\n';
        data.users.forEach((u) => {
          const row = [
            u.id,
            `"${u.username || ''}"`,
            `"${u.first_name || ''}"`,
            `"${u.last_name || ''}"`,
            `"${u.email || ''}"`,
            `"${u.department || ''}"`,
            `"${u.position || ''}"`,
            `"${u.role || ''}"`,
            `"${u.status || ''}"`,
            `"${u.approved_at || ''}"`,
          ];
          csvContent += row.join(',') + '\r\n';
        });
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `SBOP_Report_${selectedDept}_${timestamp}.csv`;
      link.click();
    } else {
      // Excel XML (SpreadsheetML) - Multi-sheet Workbook that opens natively in Microsoft Excel with full styling
      let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#F37021" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="DefectHeader">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#C2410C" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Bold"><Font ss:Bold="1"/></Style>
 </Styles>
`;

      // Worksheet 1: Inspections
      if (includeInspections) {
        xml += ` <Worksheet ss:Name="ประวัติการตรวจ (Audits)">
  <Table>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">รหัสตรวจ</Data></Cell>
    <Cell><Data ss:Type="String">แผนก</Data></Cell>
    <Cell><Data ss:Type="String">Layer</Data></Cell>
    <Cell><Data ss:Type="String">วันที่ตรวจ</Data></Cell>
    <Cell><Data ss:Type="String">กะ</Data></Cell>
    <Cell><Data ss:Type="String">เครื่องจักร/ผลิตภัณฑ์</Data></Cell>
    <Cell><Data ss:Type="String">ผู้ตรวจ</Data></Cell>
    <Cell><Data ss:Type="String">คะแนน (%)</Data></Cell>
    <Cell><Data ss:Type="String">OK</Data></Cell>
    <Cell><Data ss:Type="String">NO</Data></Cell>
    <Cell><Data ss:Type="String">NA</Data></Cell>
    <Cell><Data ss:Type="String">ข้อเสนอแนะ</Data></Cell>
   </Row>
`;
        (data.inspections || []).forEach((ins) => {
          xml += `   <Row>
    <Cell><Data ss:Type="String">#${ins.inspection_code || '001'}</Data></Cell>
    <Cell><Data ss:Type="String">${ins.department_code || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${ins.layer || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${ins.audit_date || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${ins.shift || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(ins.mc_and_products || '')}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(ins.auditor_name || '')}</Data></Cell>
    <Cell><Data ss:Type="Number">${ins.score_percent ?? 100}</Data></Cell>
    <Cell><Data ss:Type="Number">${ins.total_ok || 0}</Data></Cell>
    <Cell><Data ss:Type="Number">${ins.total_no || 0}</Data></Cell>
    <Cell><Data ss:Type="Number">${ins.total_na || 0}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(ins.comments || '')}</Data></Cell>
   </Row>
`;
        });
        xml += `  </Table>
 </Worksheet>
`;
      }

      // Worksheet 2: Defects
      if (includeDefects) {
        xml += ` <Worksheet ss:Name="สิ่งผิดปกติ (Defects)">
  <Table>
   <Row ss:StyleID="DefectHeader">
    <Cell><Data ss:Type="String">รหัสตรวจ</Data></Cell>
    <Cell><Data ss:Type="String">แผนก</Data></Cell>
    <Cell><Data ss:Type="String">Layer</Data></Cell>
    <Cell><Data ss:Type="String">วันที่</Data></Cell>
    <Cell><Data ss:Type="String">หมวดหมู่</Data></Cell>
    <Cell><Data ss:Type="String">คำถาม</Data></Cell>
    <Cell><Data ss:Type="String">อาการผิดปกติที่พบ</Data></Cell>
    <Cell><Data ss:Type="String">ความรุนแรง</Data></Cell>
    <Cell><Data ss:Type="String">สถานะ</Data></Cell>
    <Cell><Data ss:Type="String">แนวทางแก้ไข</Data></Cell>
    <Cell><Data ss:Type="String">ผู้รับผิดชอบ</Data></Cell>
    <Cell><Data ss:Type="String">กำหนดเสร็จ</Data></Cell>
    <Cell><Data ss:Type="String">รูปภาพ Before</Data></Cell>
    <Cell><Data ss:Type="String">รูปภาพ After</Data></Cell>
   </Row>
`;
        (data.defects || []).forEach((def) => {
          const statusText = def.defect_status === 'resolved' ? 'แก้แล้ว' : def.defect_status === 'reviewing' ? 'รอตรวจสอบ' : 'ยังไม่แก้';
          xml += `   <Row>
    <Cell><Data ss:Type="String">#${def.inspection_code || '001'}</Data></Cell>
    <Cell><Data ss:Type="String">${def.department_code || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${def.layer || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${def.audit_date || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(def.category || '')}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(def.question || '')}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(def.finding_topic || '')}</Data></Cell>
    <Cell><Data ss:Type="String">${def.severity || 'Minor'}</Data></Cell>
    <Cell><Data ss:Type="String">${statusText}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(def.action_plan || '')}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(def.responsible_person || '')}</Data></Cell>
    <Cell><Data ss:Type="String">${def.due_date || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(def.image_url || '')}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(def.fix_image_url || '')}</Data></Cell>
   </Row>
`;
        });
        xml += `  </Table>
 </Worksheet>
`;
      }

      // Worksheet 3: Users
      if (includeUsers) {
        xml += ` <Worksheet ss:Name="สมาชิก (Users)">
  <Table>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">Username</Data></Cell>
    <Cell><Data ss:Type="String">ชื่อ</Data></Cell>
    <Cell><Data ss:Type="String">นามสกุล</Data></Cell>
    <Cell><Data ss:Type="String">อีเมล</Data></Cell>
    <Cell><Data ss:Type="String">แผนก</Data></Cell>
    <Cell><Data ss:Type="String">ตำแหน่ง</Data></Cell>
    <Cell><Data ss:Type="String">สิทธิ์</Data></Cell>
    <Cell><Data ss:Type="String">สถานะ</Data></Cell>
   </Row>
`;
        (data.users || []).forEach((u) => {
          xml += `   <Row>
    <Cell><Data ss:Type="String">${u.username || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(u.first_name || '')}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(u.last_name || '')}</Data></Cell>
    <Cell><Data ss:Type="String">${u.email || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${u.department || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(u.position || '')}</Data></Cell>
    <Cell><Data ss:Type="String">${u.role || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${u.status || ''}</Data></Cell>
   </Row>
`;
        });
        xml += `  </Table>
 </Worksheet>
`;
      }

      xml += `</Workbook>`;

      const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `SBOP_Report_${selectedDept}_${timestamp}.xls`;
      link.click();
    }
  };

  // 2. Export Images ZIP Function
  const handleExportZip = async () => {
    if (selectedImageIds.size === 0) {
      alert(language === 'th' ? 'กรุณาเลือกรูปภาพอย่างน้อย 1 รายการเพื่อส่งออก' : 'Please select at least 1 image to export.');
      return;
    }

    const itemsToExport = photoDefects.filter((d: any) => selectedImageIds.has(d.id));
    setZipProgress(`เตรียมการดาวน์โหลด 0/${itemsToExport.length}...`);

    try {
      const zip = new JSZip();
      const folder = zip.folder(`SBOP_Photos_${selectedDept}`);

      let count = 0;
      for (const item of itemsToExport) {
        count++;
        setZipProgress(`กำลังดึงรูปภาพ ${count}/${itemsToExport.length}...`);

        try {
          const deptCode = item.department_code || item.departmentCode || 'DEPT';
          const insCode = item.inspection_code || item.inspectionCode || '001';
          const safeTopic = (item.finding_topic || item.question || 'Defect')
            .slice(0, 30)
            .replace(/[/\\?%*:|"<>]/g, '_')
            .replace(/\s+/g, '_');

          // 1. Before photo
          if (item.image_url) {
            const imgUrl = normalizeImageUrl(item.image_url);
            const response = await fetch(imgUrl);
            if (response.ok) {
              const blob = await response.blob();
              const suffix = item.fix_image_url ? '_BEFORE.jpg' : '.jpg';
              const fileName = `${deptCode}_#${insCode}_${safeTopic}_id${item.id}${suffix}`;
              folder?.file(fileName, blob);
            }
          }

          // 2. After photo (if exists)
          if (item.fix_image_url) {
            const fixImgUrl = normalizeImageUrl(item.fix_image_url);
            const fixRes = await fetch(fixImgUrl);
            if (fixRes.ok) {
              const fixBlob = await fixRes.blob();
              const fixFileName = `${deptCode}_#${insCode}_${safeTopic}_id${item.id}_AFTER.jpg`;
              folder?.file(fixFileName, fixBlob);
            }
          }
        } catch (fetchErr) {
          console.warn(`Failed to fetch photo for defect #${item.id}:`, fetchErr);
        }
      }

      setZipProgress('กำลังบีบอัดไฟล์ ZIP...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 10);
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(zipBlob);
      downloadLink.download = `SBOP_Defect_Photos_${selectedDept}_${timestamp}.zip`;
      downloadLink.click();

      setZipProgress(null);
    } catch (err: any) {
      console.error('ZIP generation failed:', err);
      alert((language === 'th' ? 'การสร้างไฟล์ ZIP ไม่สำเร็จ: ' : 'Failed to generate ZIP: ') + err.message);
      setZipProgress(null);
    }
  };

  // 3. Print / HTML Photo Catalog Report
  const handlePrintCatalog = () => {
    const itemsToExport = photoDefects.filter((d: any) => selectedImageIds.has(d.id));
    if (itemsToExport.length === 0) {
      alert(language === 'th' ? 'กรุณาเลือกรูปภาพอย่างน้อย 1 รายการ' : 'Please select at least 1 image.');
      return;
    }

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Pop-up was blocked. Please allow popups.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>SBOP Photo Evidence Catalog — TE Connectivity</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 24px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #F37021; padding-bottom: 12px; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: bold; color: #0f172a; }
          .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
          .card { border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px; page-break-inside: avoid; background: #fff; }
          .img-box { width: 100%; height: 220px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: bold; }
          .badge-major { background: #fee2e2; color: #991b1b; }
          .badge-minor { background: #fef3c7; color: #92400e; }
          .details { margin-top: 10px; font-size: 12px; line-height: 1.5; }
          .print-btn { background: #F37021; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; margin-bottom: 16px; }
          @media print { .print-btn { display: none; } }
        </style>
      </head>
      <body>
        <button class="print-btn" onclick="window.print()">🖨️ พิมพ์หน้านี้ / บันทึกเป็น PDF (Print / Save as PDF)</button>
        <div class="header">
          <div>
            <div class="title">TE Connectivity • SBOP Photo Evidence Catalog</div>
            <div class="subtitle">รายงานภาพถ่ายหลักฐานข้อบกพร่องและจุดตรวจความปลอดภัย (TE-EHS-053) | Exported: ${new Date().toLocaleString()}</div>
          </div>
          <div style="font-weight: bold; color: #F37021; font-size: 14px;">แผนก: ${selectedDept} | ${itemsToExport.length} รูปภาพ</div>
        </div>

        <div class="grid">
          ${itemsToExport.map((item: any) => `
            <div class="card">
              <img src="${normalizeImageUrl(item.image_url)}" class="img-box" />
              <div class="details">
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                  <strong>#${item.inspectionCode || '001'} - แผนก ${item.departmentCode} (${item.layer})</strong>
                  <span class="badge ${item.severity === 'Major' ? 'badge-major' : 'badge-minor'}">${item.severity || 'Minor'}</span>
                </div>
                <div><strong>ปัญหา:</strong> ${escapeXml(item.finding_topic || item.question)}</div>
                <div><strong>เครื่องจักร/ผลิตภัณฑ์:</strong> ${escapeXml(item.mc_and_products || '-')}</div>
                <div><strong>ผู้ตรวจ:</strong> ${escapeXml(item.auditor_name || '-')} | <strong>วันที่:</strong> ${item.auditDate || item.audit_date || '-'}</div>
                <div><strong>แนวทางแก้ไข:</strong> ${escapeXml(item.action_plan || '-')}</div>
                <div><strong>ผู้รับผิดชอบ:</strong> ${escapeXml(item.responsible_person || '-')} | <strong>กำหนดเสร็จ:</strong> ${item.due_date || '-'}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#1E2229] p-5 sm:p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#F37021] to-[#DE5F14] text-white flex items-center justify-center shadow-lg border border-white/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
                  {language === 'th' ? 'ระบบ Export ข้อมูลและรูปภาพ (Admin / Super Admin)' : 'Data & Photo Export Center (Admin / Super Admin)'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-400/30">
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === 'th'
                  ? 'ส่งออกข้อมูลการตรวจเช็คเป็นไฟล์ Excel (.xlsx / .csv) และรูปภาพหลักฐานความปลอดภัย'
                  : 'Export inspection audits to Excel (.xlsx / .csv) and download safety evidence photos'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 shrink-0">
          <button
            onClick={() => setActiveTab('excel')}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold transition border-b-2 flex items-center gap-2 ${
              activeTab === 'excel'
                ? 'border-[#F37021] text-[#F37021]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{language === 'th' ? '1. Export ข้อมูล Excel (.xlsx / .csv)' : '1. Export Excel Data (.xlsx / .csv)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('images')}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold transition border-b-2 flex items-center gap-2 ${
              activeTab === 'images'
                ? 'border-[#F37021] text-[#F37021]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>{language === 'th' ? '2. Export รูปภาพหลักฐาน (Photos / ZIP)' : '2. Export Photos & Evidence (ZIP)'}</span>
            {photoDefects.length > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-orange-100 text-[#F37021]">
                {photoDefects.length}
              </span>
            )}
          </button>
        </div>

        {/* Global Filter Bar for Export Scope */}
        <div className="px-6 py-3 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1 font-bold text-slate-700">
              <Filter className="w-3.5 h-3.5 text-[#F37021]" />
              <span>{language === 'th' ? 'ขอบเขตข้อมูล:' : 'Scope:'}</span>
            </div>

            {/* Department */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
            >
              <option value="all">{language === 'th' ? 'ทุกแผนก (All Depts)' : 'All Departments'}</option>
              <option value="MOLD">Molding / MM</option>
              <option value="FACILITY">Facility</option>
              <option value="ASSY">Assembly</option>
              <option value="WH">Warehouse</option>
              <option value="QC">QC</option>
              <option value="STAMPING">Stamping</option>
              <option value="TOOL">Tooling</option>
              <option value="SAFETY">Safety / EHS</option>
            </select>

            {/* Year */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
            >
              <option value="all">{language === 'th' ? 'ทุกปี' : 'All Years'}</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>

            {/* Month */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
            >
              <option value="all">{language === 'th' ? 'ทุกเดือน' : 'All Months'}</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m.toString()}>
                  {language === 'th' ? `เดือน ${m}` : `Month ${m}`}
                </option>
              ))}
            </select>

            {/* Layer */}
            <select
              value={selectedLayer}
              onChange={(e) => setSelectedLayer(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
            >
              <option value="all">{language === 'th' ? 'ทุก Layer' : 'All Layers'}</option>
              <option value="Layer 1">Layer 1 (Shift Leader)</option>
              <option value="Layer 2">Layer 2 (Supervisor)</option>
              <option value="Layer 3">Layer 3 (Manager)</option>
            </select>
          </div>

          <button
            onClick={loadExportData}
            disabled={loading}
            className="p-1 text-slate-500 hover:text-slate-800 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'excel' ? (
            <div className="space-y-6 animate-fadeIn">
              {/* Data Category Selection */}
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                  {language === 'th' ? '1. เลือกชุดข้อมูลที่ต้องการรวมในไฟล์ Excel' : '1. Select Data Sets to Include'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 hover:border-orange-300 bg-white cursor-pointer transition shadow-xs">
                    <input
                      type="checkbox"
                      checked={includeInspections}
                      onChange={(e) => setIncludeInspections(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-[#F37021] rounded border-slate-300 focus:ring-[#F37021]"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {language === 'th' ? 'ประวัติการตรวจเช็คทั้งหมด (Audit Inspections)' : 'Inspection Records'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {language === 'th'
                          ? `รวม ${data?.inspections?.length || 0} รอบตรวจ (รหัสตรวจ, แผนก, Layer, วันที่, คะแนน %, ผล OK/NO)`
                          : `Total ${data?.inspections?.length || 0} rounds`}
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 hover:border-orange-300 bg-white cursor-pointer transition shadow-xs">
                    <input
                      type="checkbox"
                      checked={includeDefects}
                      onChange={(e) => setIncludeDefects(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-[#F37021] rounded border-slate-300 focus:ring-[#F37021]"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {language === 'th' ? 'รายการสิ่งผิดปกติ (Defects & Findings)' : 'Defects & Findings Log'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {language === 'th'
                          ? `รวม ${data?.defects?.length || 0} ข้อผิดปกติ (คำถาม, ปัญหา, แนวทางแก้ไข, ผู้รับผิดชอบ)`
                          : `Total ${data?.defects?.length || 0} defect items`}
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 hover:border-orange-300 bg-white cursor-pointer transition shadow-xs">
                    <input
                      type="checkbox"
                      checked={includeSummary}
                      onChange={(e) => setIncludeSummary(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-[#F37021] rounded border-slate-300 focus:ring-[#F37021]"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {language === 'th' ? 'สถิติสรุปภาพรวม (KPI Summary)' : 'Performance KPI Summary'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {language === 'th' ? 'สรุปผลคะแนนเฉลี่ย, ยอดผ่าน, ยอดผิดปกติ' : 'Average score, total OK and NO'}
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 hover:border-orange-300 bg-white cursor-pointer transition shadow-xs">
                    <input
                      type="checkbox"
                      checked={includeUsers}
                      onChange={(e) => setIncludeUsers(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-[#F37021] rounded border-slate-300 focus:ring-[#F37021]"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {language === 'th' ? 'รายชื่อสมาชิกในระบบ (Users & Roles)' : 'User Directory & Roles'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {language === 'th'
                          ? `รวม ${data?.users?.length || 0} บัญชีพนักงาน (ชื่อ, ตำแหน่ง, แผนก, สิทธิ์)`
                          : `Total ${data?.users?.length || 0} accounts`}
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Format Selection */}
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                  {language === 'th' ? '2. เลือกรูปแบบไฟล์ (File Format)' : '2. Choose File Format'}
                </h3>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <button
                    type="button"
                    onClick={() => setFileFormat('xlsx')}
                    className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
                      fileFormat === 'xlsx'
                        ? 'border-[#F37021] bg-orange-50/70 text-[#F37021]'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <FileSpreadsheet className="w-5 h-5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Microsoft Excel (.xlsx)</div>
                      <div className="text-[10px] text-slate-500">Multi-sheet Workbook</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFileFormat('csv')}
                    className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
                      fileFormat === 'csv'
                        ? 'border-[#F37021] bg-orange-50/70 text-[#F37021]'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <FileSpreadsheet className="w-5 h-5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">CSV UTF-8 (.csv)</div>
                      <div className="text-[10px] text-slate-500">Universal CSV</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Action Banner */}
              <div className="p-4 rounded-2xl bg-orange-50/80 border border-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#F37021]" />
                    <span>
                      {language === 'th'
                        ? `พร้อมส่งออก ${data?.inspections?.length || 0} รอบตรวจ และ ${data?.defects?.length || 0} ข้อผิดปกติ`
                        : `Ready to export ${data?.inspections?.length || 0} audits and ${data?.defects?.length || 0} defects`}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {language === 'th'
                      ? 'ไฟล์จะถูกสร้างและดาวน์โหลดไปยังคอมพิวเตอร์ของคุณทันที'
                      : 'File will be formatted and downloaded directly to your computer.'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleExportExcel}
                  disabled={loading || (!includeInspections && !includeDefects && !includeSummary && !includeUsers)}
                  className="px-6 py-2.5 rounded-xl bg-[#F37021] hover:bg-[#DE5F14] text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{language === 'th' ? 'ดาวน์โหลดไฟล์ Excel' : 'Download Excel File'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fadeIn">
              {/* Photo Filter & Batch Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">
                    {language === 'th' ? 'ความรุนแรง:' : 'Severity:'}
                  </span>
                  <select
                    value={selectedSeverity}
                    onChange={(e) => setSelectedSeverity(e.target.value)}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="all">{language === 'th' ? 'ทั้งหมด (All)' : 'All'}</option>
                    <option value="Major">Major Only (รุนแรง)</option>
                    <option value="Minor">Minor Only (เล็กน้อย)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllImages}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                  >
                    {language === 'th' ? 'เลือกทั้งหมด' : 'Select All'}
                  </button>
                  <button
                    type="button"
                    onClick={deselectAllImages}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                  >
                    {language === 'th' ? 'ยกเลิกการเลือก' : 'Deselect'}
                  </button>
                  <span className="text-xs font-bold text-[#F37021] ml-2">
                    {language === 'th'
                      ? `เลือกแล้ว ${selectedImageIds.size} จาก ${photoDefects.length} รูป`
                      : `Selected ${selectedImageIds.size} of ${photoDefects.length}`}
                  </span>
                </div>
              </div>

              {/* Photo Grid Gallery */}
              {loading ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  <Loader2 className="w-8 h-8 text-[#F37021] animate-spin mx-auto mb-2" />
                  <span>กำลังค้นหารูปภาพ...</span>
                </div>
              ) : photoDefects.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                  <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p>{language === 'th' ? 'ไม่พบรูปภาพหลักฐานที่ตรงตามเงื่อนไขตัวกรอง' : 'No photos found matching filters.'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[460px] overflow-y-auto pr-1">
                  {photoDefects.map((item: any) => {
                    const isSelected = selectedImageIds.has(item.id);
                    const isMajor = item.severity === 'Major';

                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleImageSelection(item.id)}
                        className={`rounded-2xl border p-3 cursor-pointer transition select-none flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#F37021] bg-orange-50/40 shadow-sm ring-2 ring-[#F37021]/30'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="relative rounded-xl overflow-hidden mb-2.5 bg-slate-100 aspect-video">
                          <img
                            src={normalizeImageUrl(item.image_url)}
                            alt="Evidence"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isMajor ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                              }`}
                            >
                              {item.severity || 'Minor'}
                            </span>
                          </div>

                          <div className="absolute top-2 right-2">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center border shadow ${
                              isSelected ? 'bg-[#F37021] border-white text-white' : 'bg-white/90 border-slate-300 text-transparent'
                            }`}>
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                            <span>#{item.inspectionCode || '001'} - แผนก {item.departmentCode}</span>
                            <span className="text-[10px] font-medium text-slate-400">{item.audit_date || item.auditDate}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                            {item.finding_topic || item.question}
                          </p>
                          <div className="text-[10px] text-slate-400 pt-1 flex items-center justify-between">
                            <span>ผู้รับผิดชอบ: {item.responsible_person || '-'}</span>
                            <span className="text-amber-700 font-semibold">{item.mc_and_products || ''}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Action Bar for Photo Export */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-600">
                  {zipProgress ? (
                    <div className="flex items-center gap-2 text-[#F37021] font-bold animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{zipProgress}</span>
                    </div>
                  ) : (
                    <span>
                      {language === 'th'
                        ? `เลือกรูปภาพแล้ว ${selectedImageIds.size} รูป พร้อมรวมไฟล์ ZIP หรือจัดพิมพ์รายงาน`
                        : `${selectedImageIds.size} photos selected for export`}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrintCatalog}
                    disabled={selectedImageIds.size === 0 || loading}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>{language === 'th' ? 'พิมพ์รายงานแค็ตตาล็อก (PDF)' : 'Print Catalog (PDF)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportZip}
                    disabled={selectedImageIds.size === 0 || loading || !!zipProgress}
                    className="px-5 py-2 rounded-xl bg-[#F37021] hover:bg-[#DE5F14] text-white text-xs font-bold shadow-md transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <FolderArchive className="w-4 h-4" />
                    <span>{language === 'th' ? '📦 ดาวน์โหลดไฟล์ ZIP (.zip)' : '📦 Download ZIP'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
