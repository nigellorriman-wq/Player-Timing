import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
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

  (doc as any).autoTable({
    startY: 40,
    head: [['Time', 'Hole', 'Grp', 'Player', 'Taken', 'Status', 'Location']],
    body: tableData,
    headStyles: { fillColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    styles: { fontSize: 9 }
  });

  doc.save(`golf-session-${Date.now()}.pdf`);
}
