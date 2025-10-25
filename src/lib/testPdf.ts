import jsPDF from 'jspdf';

// Simple test PDF generator to debug issues
export const generateTestPDF = (): void => {
  try {
    console.log('Creating test PDF...');
    
    const doc = new jsPDF();
    
    // Add simple text
    doc.setFontSize(20);
    doc.text('Test PDF Generation', 20, 30);
    
    doc.setFontSize(12);
    doc.text('This is a test to verify PDF generation works.', 20, 50);
    doc.text('If you can see this, jsPDF is working correctly.', 20, 70);
    
    // Add current date
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 90);
    
    console.log('Saving test PDF...');
    doc.save('test-pdf.pdf');
    console.log('Test PDF saved successfully!');
    
  } catch (error) {
    console.error('Test PDF generation failed:', error);
    throw error;
  }
};