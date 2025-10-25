import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PatientFormProps {
  patientName: string;
  patientEmail: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  disabled?: boolean;
}

const PatientForm = ({
  patientName,
  patientEmail,
  onNameChange,
  onEmailChange,
  disabled
}: PatientFormProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="patientName">Patient Name</Label>
        <Input
          id="patientName"
          placeholder="John Doe"
          value={patientName}
          onChange={(e) => onNameChange(e.target.value)}
          disabled={disabled}
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="patientEmail">Patient Email</Label>
        <Input
          id="patientEmail"
          type="email"
          placeholder="john.doe@example.com"
          value={patientEmail}
          onChange={(e) => onEmailChange(e.target.value)}
          disabled={disabled}
          className="mt-1.5"
        />
      </div>
    </div>
  );
};

export default PatientForm;