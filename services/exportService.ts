import { Event, EventType, GroupLabel } from '../types';
import { Standing } from './scoringService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const getEventHeaderLabel = (event: Event): { date: string; type: string } => {
  const date = new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(event.date));
  
  const typeMap: Record<EventType, string> = {
    [EventType.EZF]: 'EZF',
    [EventType.BZF]: 'BZF',
    [EventType.MZF]: 'MZF',
    [EventType.Handicap]: 'HC',
  };
  
  return { date, type: typeMap[event.eventType] };
};

// PDF Export
export const exportStandingsToPDF = (
  standings: Record<GroupLabel, Standing[]>,
  finishedEvents: Event[],
  season: number | null
) => {
  const doc = new jsPDF('l', 'mm', 'a4');
  
  const groups = [
    { label: GroupLabel.Ambitious, title: 'Männer Ambitioniert (C/D)' },
    { label: GroupLabel.Hobby, title: 'Männer Hobby (A/B)' },
    { label: GroupLabel.Women, title: 'Frauen' }
  ];

  doc.setFontSize(18);
  doc.setTextColor(220, 38, 38);
  doc.text(`Skinfit Cup ${season} - Gesamtwertung`, 148, 15, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Stand: ${new Date().toLocaleDateString('de-DE')}`, 148, 22, { align: 'center' });

  let yPosition = 30;

  groups.forEach((group, groupIndex) => {
    const groupStandings = standings[group.label] || [];
    
    if (groupStandings.length === 0) return;

    if (groupIndex > 0) {
      yPosition += 15;
    }

    if (yPosition > 170) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(group.title, 14, yPosition);
    yPosition += 5;

    const headers = ['Rang', 'Name', 'Klasse'];
    finishedEvents.forEach(event => {
      const { date, type } = getEventHeaderLabel(event);
      headers.push(`${date}\n${type}`);
    });
    headers.push('Gesamt');

    const tableData = groupStandings.map((standing, index) => {
      const row = [
        (index + 1).toString(),
        standing.participantName,
        standing.participantClass
      ];
      
      finishedEvents.forEach(event => {
        const result = standing.results.find(r => r.eventId === event.id);
        const points = result ? result.points.toString() : '-';
        const isDropped = result?.isDropped;
        row.push(isDropped ? `(${points})` : points);
      });
      
      row.push(standing.finalPoints.toString());
      return row;
    });

    autoTable(doc, {
      startY: yPosition,
      head: [headers],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [220, 38, 38],
        textColor: [255, 255, 255],
        fontSize: 8,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 8,
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 50, halign: 'left' },
        2: { cellWidth: 18, halign: 'center' }
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        yPosition = data.cursor?.y || yPosition;
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  });

  doc.save(`Skinfit_Cup_${season}_Gesamtwertung.pdf`);
};

// PDF Export using print
export const exportStandingsToPrint = () => {
  window.print();
};
