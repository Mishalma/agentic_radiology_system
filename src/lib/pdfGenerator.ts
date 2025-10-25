import jsPDF from 'jspdf';
import { Finding } from './gemini';

interface ReportData {
  id: string;
  patient_name: string;
  patient_email: string;
  findings: Finding[];
  impression: string;
  recommendations: string[];
  ai_confidence: string;
  created_at: string;
  differential_diagnosis?: string[];
  urgency_level?: string;
}

export const generateMedicalReport = (reportData: ReportData, imageBase64?: string): void => {
  try {
    console.log('Generating PDF with data:', reportData);
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let yPosition = 20;
    
    // Validate required data
    if (!reportData || !reportData.patient_name) {
      throw new Error('Invalid report data provided');
    }

  // Header
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('RADIOLOGY REPORT', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('RadAI Orchestrator - AI-Powered Medical Analysis', pageWidth / 2, yPosition, { align: 'center' });
  
  // Line separator
  yPosition += 10;
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;

  // Patient Information Section
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PATIENT INFORMATION', margin, yPosition);
  yPosition += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Patient Name: ${reportData.patient_name}`, margin, yPosition);
  yPosition += 7;
  doc.text(`Patient Email: ${reportData.patient_email}`, margin, yPosition);
  yPosition += 7;
  doc.text(`Report ID: ${reportData.id}`, margin, yPosition);
  yPosition += 7;
  doc.text(`Date of Analysis: ${new Date(reportData.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, margin, yPosition);
  yPosition += 15;

  // AI Confidence & Urgency Section
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ANALYSIS SUMMARY', margin, yPosition);
  yPosition += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const confidenceColor = reportData.ai_confidence === 'High' ? [0, 128, 0] : 
                         reportData.ai_confidence === 'Medium' ? [255, 165, 0] : [255, 0, 0];
  doc.setTextColor(confidenceColor[0], confidenceColor[1], confidenceColor[2]);
  doc.text(`AI Confidence Level: ${reportData.ai_confidence}`, margin, yPosition);
  yPosition += 7;
  
  if (reportData.urgency_level) {
    const urgencyColor = reportData.urgency_level === 'routine' ? [0, 128, 0] :
                        reportData.urgency_level === 'urgent' ? [255, 165, 0] : [255, 0, 0];
    doc.setTextColor(urgencyColor[0], urgencyColor[1], urgencyColor[2]);
    doc.text(`Clinical Urgency: ${reportData.urgency_level.toUpperCase()}`, margin, yPosition);
  }
  doc.setTextColor(0, 0, 0); // Reset to black
  yPosition += 15;

  // Clinical Findings Section
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('CLINICAL FINDINGS', margin, yPosition);
  yPosition += 10;

  reportData.findings.forEach((finding, index) => {
    if (yPosition > 250) { // Check if we need a new page
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. ${finding.pathology}`, margin, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Confidence: ${Math.round(finding.confidence * 100)}%`, margin + 10, yPosition);
    yPosition += 5;
    
    if ((finding as any).anatomical_location) {
      doc.text(`Location: ${(finding as any).anatomical_location}`, margin + 10, yPosition);
      yPosition += 5;
    }
    
    if ((finding as any).severity) {
      doc.text(`Severity: ${(finding as any).severity.toUpperCase()}`, margin + 10, yPosition);
      yPosition += 5;
    }
    
    yPosition += 2;

    // Wrap description text
    const descriptionLines = doc.splitTextToSize(finding.description, pageWidth - margin * 2 - 10);
    doc.text(descriptionLines, margin + 10, yPosition);
    yPosition += descriptionLines.length * 5 + 5;
  });

  yPosition += 10;

  // Clinical Impression Section
  if (yPosition > 220) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('CLINICAL IMPRESSION', margin, yPosition);
  yPosition += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const impressionLines = doc.splitTextToSize(reportData.impression, pageWidth - margin * 2);
  doc.text(impressionLines, margin, yPosition);
  yPosition += impressionLines.length * 6 + 15;

  // Differential Diagnosis Section
  if (reportData.differential_diagnosis && reportData.differential_diagnosis.length > 0) {
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('DIFFERENTIAL DIAGNOSIS', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    reportData.differential_diagnosis.forEach((diagnosis, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      const diagnosisLines = doc.splitTextToSize(`${index + 1}. ${diagnosis}`, pageWidth - margin * 2);
      doc.text(diagnosisLines, margin, yPosition);
      yPosition += diagnosisLines.length * 6 + 3;
    });

    yPosition += 15;
  }

  // Recommendations Section
  if (yPosition > 200) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('RECOMMENDATIONS', margin, yPosition);
  yPosition += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  reportData.recommendations.forEach((rec, index) => {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    const recLines = doc.splitTextToSize(`${index + 1}. ${rec}`, pageWidth - margin * 2);
    doc.text(recLines, margin, yPosition);
    yPosition += recLines.length * 6 + 3;
  });

  yPosition += 15;

  // Medical Disclaimer
  if (yPosition > 200) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 0, 0);
  doc.text('⚠️ IMPORTANT MEDICAL DISCLAIMER', margin, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  const disclaimerText = `This report contains AI-assisted analysis for decision support purposes only. It is not intended for sole diagnosis or treatment decisions. The findings and recommendations provided should be reviewed and validated by qualified medical professionals. Always consult with licensed healthcare providers for proper medical advice, diagnosis, and treatment. This system is a prototype developed for demonstration purposes.`;
  const disclaimerLines = doc.splitTextToSize(disclaimerText, pageWidth - margin * 2);
  doc.text(disclaimerLines, margin, yPosition);
  yPosition += disclaimerLines.length * 4 + 10;

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Generated by RadAI Orchestrator - Hackathon Prototype', pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
  doc.text(`Report generated on: ${new Date().toLocaleString()}`, pageWidth / 2, doc.internal.pageSize.height - 5, { align: 'center' });

  // Add X-ray image if provided
  if (imageBase64) {
    doc.addPage();
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('X-RAY IMAGE', pageWidth / 2, 20, { align: 'center' });
    
    try {
      // Add image (scaled to fit page)
      const imgWidth = 150;
      const imgHeight = 150;
      const imgX = (pageWidth - imgWidth) / 2;
      doc.addImage(imageBase64, 'JPEG', imgX, 40, imgWidth, imgHeight);
    } catch (error) {
      console.error('Error adding image to PDF:', error);
      doc.setFontSize(12);
      doc.text('X-ray image could not be embedded', pageWidth / 2, 100, { align: 'center' });
    }
  }

    // Save the PDF
    const fileName = `Radiology_Report_${reportData.patient_name.replace(/\s+/g, '_')}_${reportData.id.substring(0, 8)}.pdf`;
    console.log('Saving PDF:', fileName);
    doc.save(fileName);
    
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const generateQuickSummary = (reportData: ReportData): string => {
  const date = new Date(reportData.created_at).toLocaleDateString();
  const mainFindings = reportData.findings.slice(0, 3).map(f => f.pathology).join(', ');
  
  return `RADIOLOGY REPORT SUMMARY
Patient: ${reportData.patient_name}
Date: ${date}
Main Findings: ${mainFindings}
Impression: ${reportData.impression.substring(0, 200)}...
AI Confidence: ${reportData.ai_confidence}
Report ID: ${reportData.id}`;
};