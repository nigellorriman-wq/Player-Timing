import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PlayerShotRecord } from '../types';

export function exportToPDF(records: PlayerShotRecord[]) {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text('Golf Officiating Session Report', 14, 22);
  
  doc.setFontSize(11);
  doc.text(`Date: ${new Date().toLocaleString()}`, 14, 30);

  const tableData = records.map(r => [
    new Date(r.timestamp).toLocaleTimeString(),
    r.hole,
    r.group,
    r.playerName,
    `${r.timeTaken.toFixed(1)}s`,
    r.isSlow ? 'SLOW' : 'OK',
    r.latitude && r.longitude ? `${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}` : '-'
  ]);

  autoTable(doc, {
    startY: 40,
    head: [['Time', 'Hole', 'Grp', 'Player', 'Taken', 'Status', 'Location']],
    body: tableData,
    headStyles: { fillColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    styles: { fontSize: 9 },
    willDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        const record = records[data.row.index];
        if (record.latitude && record.longitude) {
          data.cell.styles.textColor = [0, 0, 255];
        }
      }
    },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        const record = records[data.row.index];
        if (record.latitude && record.longitude) {
          const url = `https://www.google.com/maps?q=${record.latitude},${record.longitude}`;
          doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url });
        }
      }
    }
  });

  doc.save(`golf-session-${Date.now()}.pdf`);
}
