import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, FileText, Download, Share } from "lucide-react";
import { generateMedicalReport, generateQuickSummary } from "@/lib/pdfGenerator";
import { generateSimplePDF } from "@/lib/simplePdf";
import { generateTestPDF } from "@/lib/testPdf";
import { useToast } from "@/hooks/use-toast";

interface Finding {
  pathology: string;
  confidence: number;
  description: string;
  severity?: 'normal' | 'mild' | 'moderate' | 'severe';
  anatomical_location?: string;
}

interface AnalysisResultsProps {
  result: {
    findings: Finding[];
    impression: string;
    recommendations: string[];
    differential_diagnosis?: string[];
    urgency_level?: 'routine' | 'urgent' | 'emergent';
  };
  patientName: string;
  reportId: string | null;
  patientEmail?: string;
  selectedImage?: string;
}

const AnalysisResults = ({ result, patientName, reportId, patientEmail, selectedImage }: AnalysisResultsProps) => {
  const { toast } = useToast();
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-accent text-accent-foreground";
    if (confidence >= 0.6) return "bg-yellow-500 text-white";
    return "bg-destructive text-destructive-foreground";
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'normal': return "bg-green-100 text-green-800";
      case 'mild': return "bg-yellow-100 text-yellow-800";
      case 'moderate': return "bg-orange-100 text-orange-800";
      case 'severe': return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'routine': return "bg-blue-100 text-blue-800";
      case 'urgent': return "bg-orange-100 text-orange-800";
      case 'emergent': return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return "High";
    if (confidence >= 0.6) return "Medium";
    return "Low";
  };

  const handleDownloadPDF = () => {
    if (!reportId) {
      toast({
        title: "Error",
        description: "No report ID available",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const reportData = {
        id: reportId,
        patient_name: patientName,
        patient_email: patientEmail || '',
        findings: result.findings || [],
        impression: result.impression || 'No impression available',
        recommendations: result.recommendations || [],
        differential_diagnosis: result.differential_diagnosis || [],
        urgency_level: result.urgency_level || 'routine',
        ai_confidence: getOverallConfidence(),
        created_at: new Date().toISOString()
      };
      
      console.log('PDF Report Data:', reportData);
      
      // Use simple PDF generator for now
      const simpleReportData = {
        id: reportData.id,
        patient_name: reportData.patient_name,
        patient_email: reportData.patient_email,
        findings: reportData.findings,
        impression: reportData.impression,
        recommendations: reportData.recommendations,
        ai_confidence: reportData.ai_confidence,
        created_at: reportData.created_at
      };
      
      generateSimplePDF(simpleReportData);
      
      toast({
        title: "PDF Downloaded!",
        description: "Medical report has been saved to your downloads",
      });
    } catch (error) {
      console.error('PDF download error:', error);
      toast({
        title: "PDF Generation Failed",
        description: "Unable to generate PDF report",
        variant: "destructive",
      });
    }
  };

  const handleShareSummary = async () => {
    if (!reportId) return;
    
    const reportData = {
      id: reportId,
      patient_name: patientName,
      patient_email: patientEmail || '',
      findings: result.findings,
      impression: result.impression,
      recommendations: result.recommendations,
      ai_confidence: getOverallConfidence(),
      created_at: new Date().toISOString()
    };
    
    const summary = generateQuickSummary(reportData);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Radiology Report Summary',
          text: summary
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(summary);
        toast({
          title: "Summary Copied!",
          description: "Report summary copied to clipboard",
        });
      }
    } else {
      navigator.clipboard.writeText(summary);
      toast({
        title: "Summary Copied!",
        description: "Report summary copied to clipboard",
      });
    }
  };

  const getOverallConfidence = () => {
    const avgConfidence = result.findings.reduce((sum, f) => sum + f.confidence, 0) / result.findings.length;
    return avgConfidence >= 0.8 ? "High" : avgConfidence >= 0.6 ? "Medium" : "Low";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">Analysis Complete</h2>
            <p className="text-muted-foreground">Patient: {patientName}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Report ID: {reportId?.substring(0, 8)}...
            </p>
          </div>
          <CheckCircle2 className="h-12 w-12 text-accent" />
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleDownloadPDF}
            className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            <Download className="mr-2 h-4 w-4" />
            Download PDF Report
          </Button>
          <Button
            onClick={handleShareSummary}
            variant="outline"
            className="flex-1"
          >
            <Share className="mr-2 h-4 w-4" />
            Share Summary
          </Button>
          <Button
            onClick={() => {
              try {
                generateTestPDF();
                toast({
                  title: "Test PDF Generated!",
                  description: "Check if test PDF downloads correctly",
                });
              } catch (error) {
                toast({
                  title: "Test PDF Failed",
                  description: "PDF generation is not working",
                  variant: "destructive",
                });
              }
            }}
            variant="secondary"
            size="sm"
          >
            Test PDF
          </Button>
        </div>
      </Card>

      {/* Findings */}
      <Card className="p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Findings
        </h3>
        <div className="space-y-4">
          {result.findings.map((finding, index) => (
            <div
              key={index}
              className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{finding.pathology}</h4>
                  {finding.anatomical_location && (
                    <p className="text-xs text-muted-foreground">Location: {finding.anatomical_location}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {finding.severity && (
                    <Badge className={getSeverityColor(finding.severity)}>
                      {finding.severity.toUpperCase()}
                    </Badge>
                  )}
                  <Badge className={getConfidenceColor(finding.confidence)}>
                    {getConfidenceBadge(finding.confidence)} ({Math.round(finding.confidence * 100)}%)
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {finding.description}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Impression */}
      <Card className="p-6 shadow-lg border-l-4 border-l-primary">
        <h3 className="text-lg font-semibold mb-3">Clinical Impression</h3>
        <p className="text-foreground leading-relaxed">{result.impression}</p>
      </Card>

      {/* Urgency Level */}
      {result.urgency_level && (
        <Card className="p-4 shadow-lg border-l-4 border-l-primary">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Clinical Urgency</h3>
            <Badge className={getUrgencyColor(result.urgency_level)}>
              {result.urgency_level.toUpperCase()}
            </Badge>
          </div>
        </Card>
      )}

      {/* Differential Diagnosis */}
      {result.differential_diagnosis && result.differential_diagnosis.length > 0 && (
        <Card className="p-6 shadow-lg bg-blue-50/50 border-blue-200">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Differential Diagnosis
          </h3>
          <ul className="space-y-2">
            {result.differential_diagnosis.map((diagnosis, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span className="text-sm leading-relaxed">{diagnosis}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Recommendations */}
      <Card className="p-6 shadow-lg bg-accent/5 border-accent/20">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-accent" />
          Clinical Recommendations
        </h3>
        <ul className="space-y-2">
          {result.recommendations.map((rec, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-accent font-bold">•</span>
              <span className="text-sm leading-relaxed">{rec}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

export default AnalysisResults;