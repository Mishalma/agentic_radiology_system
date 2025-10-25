import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mail, Sparkles, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendEmailNotification } from "@/lib/gemini";
import { generateMedicalReport } from "@/lib/pdfGenerator";
import { generateSimplePDF } from "@/lib/simplePdf";

interface DoctorDashboardProps {
  reportId: string;
  patientEmail: string;
}

const DoctorDashboard = ({ reportId, patientEmail }: DoctorDashboardProps) => {
  const { toast } = useToast();
  const [isApproving, setIsApproving] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const [approved, setApproved] = useState(false);
  const [notified, setNotified] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      // Update local storage
      const reportData = localStorage.getItem(`report_${reportId}`);
      if (reportData) {
        const report = JSON.parse(reportData);
        report.status = "approved";
        localStorage.setItem(`report_${reportId}`, JSON.stringify(report));
      }

      setApproved(true);
      toast({
        title: "Report approved!",
        description: "The radiology report has been approved by the doctor",
      });

      // Trigger confetti animation
      setTimeout(() => {
        const button = document.getElementById("approve-btn");
        if (button) {
          button.classList.add("animate-bounce");
        }
      }, 100);
    } catch (error: any) {
      toast({
        title: "Approval failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleNotifyPatient = async () => {
    console.log("🟢 [handleNotifyPatient] Triggered notification handler");

    setIsNotifying(true);
    console.log("⏳ [handleNotifyPatient] isNotifying set to true");

    try {
      console.log(
        "📦 [handleNotifyPatient] Fetching report data from localStorage for reportId:",
        reportId
      );
      const reportData = localStorage.getItem(`report_${reportId}`);

      if (!reportData) {
        console.error(
          "❌ [handleNotifyPatient] Report not found in localStorage"
        );
        throw new Error("Report not found");
      }

      console.log(
        "✅ [handleNotifyPatient] Report data retrieved successfully"
      );
      const report = JSON.parse(reportData);
      console.log("🧾 [handleNotifyPatient] Parsed report:", report);

      console.log(
        "📧 [handleNotifyPatient] Preparing to send email notification..."
      );
      console.log("   ↳ Patient Email:", patientEmail);
      console.log("   ↳ Patient Name:", report.patient_name);
      console.log("   ↳ Report Impression:", report.impression);
      console.log("   ↳ Report ID:", reportId);

      // Send email notification (mock implementation)
      const emailResponse = await sendEmailNotification(
        patientEmail,
        report.patient_name,
        report.impression,
        reportId
      );

      console.log(
        "📤 [handleNotifyPatient] Email notification sent successfully:",
        emailResponse
      );

      // Update status in localStorage
      console.log(
        "📝 [handleNotifyPatient] Updating report status to 'notified'..."
      );
      report.status = "notified";
      localStorage.setItem(`report_${reportId}`, JSON.stringify(report));
      console.log(
        "✅ [handleNotifyPatient] Report status updated and saved:",
        report
      );

      setNotified(true);
      console.log("🔔 [handleNotifyPatient] Notified state updated to true");

      toast({
        title: "Patient notified!",
        description: `Email notification sent to ${patientEmail}`,
      });
      console.log("🎉 [handleNotifyPatient] Success toast displayed");
    } catch (error: any) {
      console.error("🚨 [handleNotifyPatient] Notification error:", error);
      toast({
        title: "Notification failed",
        description: error.message || "Failed to send patient notification",
        variant: "destructive",
      });
    } finally {
      setIsNotifying(false);
      console.log(
        "🔚 [handleNotifyPatient] isNotifying reset to false. Function complete."
      );
    }
  };

  const handleDownloadDoctorReport = () => {
    try {
      const reportData = localStorage.getItem(`report_${reportId}`);
      if (!reportData) {
        toast({
          title: "Report not found",
          description: "Unable to locate report data",
          variant: "destructive",
        });
        return;
      }

      const report = JSON.parse(reportData);
      console.log('Doctor PDF Report Data:', report);
      
      // Ensure all required fields exist
      const completeReport = {
        ...report,
        findings: report.findings || [],
        impression: report.impression || 'No impression available',
        recommendations: report.recommendations || [],
        differential_diagnosis: report.differential_diagnosis || [],
        urgency_level: report.urgency_level || 'routine',
        ai_confidence: report.ai_confidence || 'Medium',
        created_at: report.created_at || new Date().toISOString()
      };
      
      // Use simple PDF generator for now
      const simpleReportData = {
        id: completeReport.id,
        patient_name: completeReport.patient_name,
        patient_email: completeReport.patient_email,
        findings: completeReport.findings,
        impression: completeReport.impression,
        recommendations: completeReport.recommendations,
        ai_confidence: completeReport.ai_confidence,
        created_at: completeReport.created_at
      };
      
      generateSimplePDF(simpleReportData);

      toast({
        title: "Report Downloaded!",
        description: "Professional medical report saved to downloads",
      });
    } catch (error) {
      console.error('Doctor PDF download error:', error);
      toast({
        title: "Download failed",
        description: "Unable to generate PDF report",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-secondary/30 to-accent/10 border-2">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary rounded-lg">
          <Sparkles className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Radiologist Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Review and approve the analysis
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          id="approve-btn"
          onClick={handleApprove}
          disabled={isApproving || approved}
          className="h-16 text-lg font-semibold bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70"
        >
          {approved ? (
            <>
              <CheckCircle className="mr-2 h-5 w-5" />
              Approved ✓
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-5 w-5" />
              {isApproving ? "Approving..." : "Approve Report"}
            </>
          )}
        </Button>

        <Button
          onClick={handleDownloadDoctorReport}
          variant="outline"
          className="h-16 text-lg font-semibold border-2"
        >
          <FileText className="mr-2 h-5 w-5" />
          Download Report
        </Button>

        <Button
          onClick={handleNotifyPatient}
          disabled={isNotifying || notified || !approved}
          variant="outline"
          className="h-16 text-lg font-semibold border-2"
        >
          {notified ? (
            <>
              <Mail className="mr-2 h-5 w-5" />
              Patient Notified ✓
            </>
          ) : (
            <>
              <Mail className="mr-2 h-5 w-5" />
              {isNotifying ? "Sending..." : "Notify Patient"}
            </>
          )}
        </Button>
      </div>

      {notified && (
        <div className="mt-4 p-4 bg-accent/10 rounded-lg border border-accent/20">
          <p className="text-sm text-center">
            📧 Email sent: "Your radiology report is ready. Please visit your
            doctor to discuss the results."
          </p>
        </div>
      )}
    </Card>
  );
};

export default DoctorDashboard;
