import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PlayerShotRecord, TimerType, TournamentInfo } from '../types';

export function exportToPDF(records: PlayerShotRecord[], tournament?: TournamentInfo) {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text(tournament?.name || 'Golf Officiating Session Report', 14, 20);
  
  doc.setFontSize(11);
  if (tournament?.round) {
    doc.text(`Round: ${tournament.round}`, 14, 28);
  }
  doc.text(`Date: ${new Date().toLocaleString()}`, 14, 34);

  const tableData = records.map(r => {
    const isSearch = r.type === TimerType.LOST_BALL;
    const timeFormatted = isSearch 
      ? `${Math.floor(r.timeTaken / 60)}:${(r.timeTaken % 60).toString().padStart(2, '0')}`
      : `${r.timeTaken.toFixed(1)}s`;
    
    return [
      new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSearch ? 'SEARCH' : 'SHOT',
      r.hole,
      r.group,
      r.playerName,
      timeFormatted,
      isSearch ? '3:00' : `${r.limit}s`,
      isSearch ? '-' : (r.isSlow ? 'SLOW' : 'OK'),
      r.latitude && r.longitude ? `${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}` : '-'
    ];
  });

  autoTable(doc, {
    startY: 40,
    head: [['Time', 'Type', 'Hole', 'Grp', 'Player', 'Taken', 'Limit', 'Status', 'Location']],
    body: tableData,
    headStyles: { fillColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    styles: { fontSize: 8 },
    columnStyles: {
      8: { fontSize: 7 }
    },
    willDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 7) {
        const record = records[data.row.index];
        if (record.isSlow) {
          data.cell.styles.textColor = [255, 0, 0];
        }
      }
    },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 8) {
        const record = records[data.row.index];
        if (record.latitude && record.longitude) {
          const url = `https://www.google.com/maps?q=${record.latitude},${record.longitude}`;
          doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url });
        }
      }
    }
  });

  const fileName = tournament ? `${tournament.name}-Rd${tournament.round}-${Date.now()}.pdf` : `golf-session-${Date.now()}.pdf`;
  doc.save(fileName);
}
