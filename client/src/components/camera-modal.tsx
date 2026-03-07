import { useState, useRef } from "react";
import { X, Zap, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export function CameraModal({ isOpen, onClose, onCapture }: CameraModalProps) {
  const [flashOn, setFlashOn] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onCapture(file);
    }
  };

  const handleCameraCapture = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50">
      <div className="flex flex-col h-full">
        {/* Camera Header */}
        <div className="flex items-center justify-between p-4 text-white">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="text-white hover:bg-white/10"
            data-testid="button-close-camera"
          >
            <X className="w-6 h-6" />
          </Button>
          <h2 className="text-lg font-semibold">Scan Receipt</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setFlashOn(!flashOn)}
            className={`text-white hover:bg-white/10 ${flashOn ? 'bg-white/20' : ''}`}
            data-testid="button-toggle-flash"
          >
            <Zap className="w-6 h-6" />
          </Button>
        </div>

        {/* Camera Viewfinder */}
        <div className="flex-1 relative overflow-hidden">
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <Card className="w-80 h-96 border-2 border-dashed border-white bg-transparent">
              <CardContent className="flex items-center justify-center h-full text-center text-white">
                <div>
                  <Camera className="w-12 h-12 mb-4 mx-auto opacity-50" />
                  <p className="text-sm opacity-75">Position receipt within frame</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Capture Guides */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-96">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white"></div>
            </div>
          </div>
        </div>

        {/* Camera Controls */}
        <div className="p-6 bg-black/50">
          <div className="flex items-center justify-center space-x-8">
            <Button
              onClick={handleCameraCapture}
              className="w-16 h-16 bg-white text-gray-800 rounded-full hover:bg-gray-100"
              data-testid="button-capture-receipt"
            >
              <Camera className="w-6 h-6" />
            </Button>
          </div>
          <p className="text-white text-center text-sm mt-4 opacity-75">
            Ensure receipt is flat and well-lit for best results
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
            data-testid="input-file-receipt"
          />
        </div>
      </div>
    </div>
  );
}
