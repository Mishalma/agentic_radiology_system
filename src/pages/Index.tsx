import { useState } from "react";
import { Upload, FileImage, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { analyzeXrayWithGemini, generateReportId } from "@/lib/gemini";
import UploadSection from "@/components/radiology/UploadSection";
import PatientForm from "@/components/radiology/PatientForm";
import AnalysisResults from "@/components/radiology/AnalysisResults";
import DoctorDashboard from "@/components/radiology/DoctorDashboard";

const Index = () => {
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [reportId, setReportId] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file",
          description: "Please upload an image file (JPG, PNG)",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage || !patientName || !patientEmail) {
      toast({
        title: "Missing information",
        description: "Please upload an image and fill in patient details",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      // Call enhanced Gemini medical analysis
      const analysisData = await analyzeXrayWithGemini(selectedImage);

      console.log("Analysis result:", analysisData);

      // Determine confidence level
      const avgConfidence = analysisData.findings.reduce(
        (sum: number, f: any) => sum + f.confidence, 
        0
      ) / analysisData.findings.length;
      
      const confidenceLevel = avgConfidence >= 0.8 ? "High" : 
                             avgConfidence >= 0.6 ? "Medium" : "Low";

      // Store report locally
      const reportId = generateReportId();
      const reportData = {
        id: reportId,
        patient_name: patientName,
        patient_email: patientEmail,
        findings: analysisData.findings,
        impression: analysisData.impression,
        recommendations: analysisData.recommendations,
        ai_confidence: confidenceLevel,
        status: 'analyzed',
        created_at: new Date().toISOString()
      };
      
      // Save to localStorage
      localStorage.setItem(`report_${reportId}`, JSON.stringify(reportData));
      setReportId(reportId);
      setAnalysisResult(analysisData);

      toast({
        title: "Analysis complete!",
        description: "X-ray analysis has been generated successfully",
      });

    } catch (error: any) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze the X-ray image",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setPatientName("");
    setPatientEmail("");
    setAnalysisResult(null);
    setReportId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-lg">
              <Activity className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                RadAI Orchestrator
              </h1>
              <p className="text-sm text-muted-foreground">AI-Powered Radiology Analysis System</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Upload & Patient Info */}
          <div className="space-y-6">
            <Card className="p-6 shadow-lg border-2">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Upload X-Ray Image
              </h2>
              <UploadSection
                selectedImage={selectedImage}
                onImageUpload={handleImageUpload}
                disabled={isAnalyzing || !!analysisResult}
              />
            </Card>

            <Card className="p-6 shadow-lg border-2">
              <h2 className="text-xl font-semibold mb-4">Patient Information</h2>
              <PatientForm
                patientName={patientName}
                patientEmail={patientEmail}
                onNameChange={setPatientName}
                onEmailChange={setPatientEmail}
                disabled={isAnalyzing || !!analysisResult}
              />
            </Card>

            <div className="flex gap-3">
              <Button
                onClick={handleAnalyze}
                disabled={!selectedImage || !patientName || !patientEmail || isAnalyzing || !!analysisResult}
                className="flex-1 h-12 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
              >
                {isAnalyzing ? (
                  <>
                    <Activity className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Activity className="mr-2 h-5 w-5" />
                    Analyze X-Ray
                  </>
                )}
              </Button>
              
              {analysisResult && (
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="h-12"
                >
                  New Analysis
                </Button>
              )}
            </div>
          </div>

          {/* Right Column - Results */}
          <div>
            {analysisResult ? (
              <AnalysisResults
                result={analysisResult}
                patientName={patientName}
                reportId={reportId}
                patientEmail={patientEmail}
                selectedImage={selectedImage}
              />
            ) : (
              <Card className="p-12 flex flex-col items-center justify-center text-center h-full border-dashed border-2">
                <FileImage className="h-24 w-24 text-muted-foreground/40 mb-4" />
                <h3 className="text-xl font-semibold text-muted-foreground mb-2">
                  Awaiting Analysis
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Upload an X-ray image and enter patient information to begin AI-powered analysis
                </p>
              </Card>
            )}
          </div>
        </div>

        {/* Doctor Dashboard */}
        {analysisResult && reportId && (
          <div className="mt-8">
            <DoctorDashboard
              reportId={reportId}
              patientEmail={patientEmail}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-6 bg-card/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p className="font-semibold mb-1">⚠️ Hackathon Prototype Demo</p>
          <p>AI-powered decision support only. Not for sole diagnosis. Always consult qualified medical professionals.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;