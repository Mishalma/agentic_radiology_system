import jsPDF from 'jspdf';

interface SimpleReportData {
  id: string;
  patient_name: string;
  patient_email: string;
  findings: Array<{
    pathology: string;
    confidence: number;
    description: string;
  }>;
  impression: string;
  recommendations: string[];
  ai_confidence: string;
  created_at: string;
}

export const generateSimplePDF = (reportData: SimpleReportData): void => {
  try {
    console.log('Generating simple PDF with data:', reportData);
    
    const doc = new jsPDF();
    let y = 20;
    
    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('RADIOLOGY REPORT', 105, y, { align: 'center' });
    y += 20;
    
    // Patient Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Patient: ${reportData.patient_name}`, 20, y);
    y += 10;
    doc.text(`Email: ${reportData.patient_email}`, 20, y);
    y += 10;
    doc.text(`Report ID: ${reportData.id}`, 20, y);
    y += 10;
    doc.text(`Date: ${new Date(reportData.created_at).toLocaleDateString()}`, 20, y);
    y += 20;
    
    // Findings
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('FINDINGS:', 20, y);
    y += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    if (reportData.findings && reportData.findings.length > 0) {
      reportData.findings.forEach((finding, index) => {
        if (y > 250) {
          doc.addPage();
          y = 20;
        }
        
        doc.text(`${index + 1}. ${finding.pathology}`, 20, y);
        y += 6;
        doc.text(`   Confidence: ${Math.round(finding.confidence * 100)}%`, 20, y);
        y += 6;
        
        // Split long descriptions
        const lines = doc.splitTextToSize(finding.description, 170);
        doc.text(lines, 20, y);
        y += lines.length * 6 + 5;
      });
    } else {
      doc.text('No findings available', 20, y);
      y += 10;
    }
    
    y += 10;
    
    // Impression
    if (y > 220) {
      doc.addPage();
      y = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('IMPRESSION:', 20, y);
    y += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const impressionLines = doc.splitTextToSize(reportData.impression, 170);
    doc.text(impressionLines, 20, y);
    y += impressionLines.length * 6 + 15;
    
    // Recommendations
    if (y > 220) {
      doc.addPage();
      y = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RECOMMENDATIONS:', 20, y);
    y += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    if (reportData.recommendations && reportData.recommendations.length > 0) {
      reportData.recommendations.forEach((rec, index) => {
        if (y > 250) {
          doc.addPage();
          y = 20;
        }
        const recLines = doc.splitTextToSize(`${index + 1}. ${rec}`, 170);
        doc.text(recLines, 20, y);
        y += recLines.length * 6 + 3;
      });
    } else {
      doc.text('No recommendations available', 20, y);
    }
    
    // Save
    const fileName = `Report_${reportData.patient_name.replace(/\\s+/g, '_')}_${Date.now()}.pdf`;
    console.log('Saving PDF:', fileName);
    doc.save(fileName);
    
  } catch (error) {
    console.error('Simple PDF generation error:', error);
    throw error;
  }
};