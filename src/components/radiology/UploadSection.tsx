import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadSectionProps {
  selectedImage: string | null;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

const UploadSection = ({ selectedImage, onImageUpload, disabled }: UploadSectionProps) => {
  return (
    <div className="space-y-4">
      {!selectedImage ? (
        <label className={`
          flex flex-col items-center justify-center w-full h-64 
          border-2 border-dashed rounded-lg cursor-pointer 
          bg-secondary/30 hover:bg-secondary/50 transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}>
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-12 h-12 mb-3 text-muted-foreground" />
            <p className="mb-2 text-sm text-muted-foreground">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">X-ray images (JPG, PNG)</p>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={onImageUpload}
            disabled={disabled}
          />
        </label>
      ) : (
        <div className="relative">
          <img
            src={selectedImage}
            alt="Uploaded X-ray"
            className="w-full h-64 object-contain rounded-lg bg-black"
          />
          {!disabled && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => {
                const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default UploadSection;