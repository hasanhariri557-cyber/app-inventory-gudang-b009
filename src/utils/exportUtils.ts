import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Export JSON Array to Excel File
export function exportToExcel(data: any[], filename: string, sheetName: string = 'Data') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

// Export Multiple Tables into Multi-sheet Excel Workbook
export function exportAllWmsToExcel(tables: { name: string; data: any[] }[]) {
  const workbook = XLSX.utils.book_new();
  tables.forEach(table => {
    const ws = XLSX.utils.json_to_sheet(table.data.length > 0 ? table.data : [{ Message: 'Tidak ada data' }]);
    XLSX.utils.book_append_sheet(workbook, ws, table.name);
  });
  XLSX.writeFile(workbook, `WMS_Gudang_Full_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// Parse uploaded Excel / CSV File into JSON
export function parseExcelFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

// Export PDF Document (Surat Jalan / Report)
export function exportToPDF(
  title: string,
  columns: string[],
  rows: (string | number)[][],
  filename: string,
  subtitle?: string
) {
  const doc = new jsPDF();
  
  // Header Branding
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text(title, 14, 20);

  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, 14, 28);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`, 14, 34);
  } else {
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`WMS Gudang Terintegrasi - Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`, 14, 28);
  }

  // Table
  autoTable(doc, {
    startY: subtitle ? 40 : 32,
    head: [columns],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 9, cellPadding: 3 }
  });

  doc.save(`${filename}.pdf`);
}

// Helper to draw a modern, professional placeholder logo if no custom logo is uploaded
function drawDefaultLogo(doc: jsPDF, x: number, y: number) {
  // Draw a modern, professional placeholder box
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.setLineWidth(0.5);
  doc.roundedRect(x, y, 30, 15, 2, 2, 'FD');

  // Draw a small indigo icon
  doc.setFillColor(79, 70, 229); // Indigo-600
  doc.rect(x + 3, y + 4, 4, 7, 'F');
  doc.setFillColor(16, 185, 129); // Emerald-500
  doc.rect(x + 8, y + 6, 4, 5, 'F');

  // Add text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text('PERUSAHAAN', x + 14, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text('LOGISTIK LOGO', x + 14, y + 11);
}

// Generate Surat Jalan / Outbound Delivery Note PDF
export function generateSuratJalanPDF(
  outbound: {
    nomorDOSJ: string;
    customer: string;
    tanggal: string;
    ekspedisi: string;
    palletOutCount: number;
    noKendaraan?: string;
    details: any[];
  },
  logoUrl?: string | null
) {
  const doc = new jsPDF();

  // Draw logo if exists, otherwise draw default fallback
  if (logoUrl) {
    try {
      let format = 'PNG';
      if (logoUrl.includes('image/jpeg') || logoUrl.includes('image/jpg')) {
        format = 'JPEG';
      } else if (logoUrl.includes('image/webp')) {
        format = 'WEBP';
      }
      doc.addImage(logoUrl, format, 166, 10, 30, 15);
    } catch (err) {
      console.error("Error adding company logo to PDF:", err);
      drawDefaultLogo(doc, 166, 10);
    }
  } else {
    drawDefaultLogo(doc, 166, 10);
  }

  // Header Title
  const titleText = 'SURAT JALAN / DELIVERY ORDER';
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138); // Dark Blue
  doc.text(titleText, 14, 20);

  // Garis biru di bawah title disesuaikan ukurannya dengan panjang teks
  const textWidth = doc.getTextWidth(titleText);
  doc.setDrawColor(30, 58, 138); // Dark Blue
  doc.setLineWidth(1.5);
  doc.line(14, 23, 14 + textWidth, 23);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  // Info Metadata
  doc.text(`Nomor DO/SJ: ${outbound.nomorDOSJ}`, 14, 34);
  doc.text(`Customer: ${outbound.customer}`, 14, 40);
  doc.text(`Tanggal: ${outbound.tanggal}`, 14, 46);

  doc.text(`Ekspedisi: ${outbound.ekspedisi}`, 120, 34);
  doc.text(`No. Kendaraan: ${outbound.noKendaraan || '-'}`, 120, 40);
  doc.text(`Total Pallet Out: ${outbound.palletOutCount} Pallet`, 120, 46);
  doc.text(`Status: OUTBOUND COMPLETED`, 120, 52);

  // Table Details
  const tableData = outbound.details.map((d, index) => [
    index + 1,
    d.materialId,
    d.namaBarang,
    d.qty,
    d.satuan,
    d.picChecker,
    d.keterangan || '-'
  ]);

  autoTable(doc, {
    startY: 60,
    head: [['No', 'Material ID', 'Nama Barang', 'Qty', 'Satuan', 'PIC Checker', 'Keterangan']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [30, 58, 138] }
  });

  // Signature lines
  const finalY = (doc as any).lastAutoTable?.finalY || 120;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  // 4 Kolom Tanda Tangan: Hormat Kami, Checker Outbound, Pengemudi, Penerima
  doc.text('Hormat Kami,', 14, finalY + 20);
  doc.text('( Gudang Pengirim )', 14, finalY + 45);

  doc.text('Checker Outbound,', 62, finalY + 20);
  const mainChecker = outbound.details.find(d => d.picChecker)?.picChecker;
  doc.text(`( ${mainChecker || '...........................'} )`, 62, finalY + 45);

  doc.text('Pengemudi / Ekspedisi,', 112, finalY + 20);
  doc.text('(...........................)', 112, finalY + 45);

  doc.text('Penerima / Customer,', 160, finalY + 20);
  doc.text('(...........................)', 160, finalY + 45);

  doc.save(`SuratJalan_${outbound.nomorDOSJ}.pdf`);
}
