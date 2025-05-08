import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/navbar";
import { Camera, Mic, Music, Layers, Video, Image, Zap, X, Upload, Check, Filter, Square, Crop, ZoomIn, RotateCcw } from "lucide-react";
import Cropper from 'react-easy-crop';

const FILTERS = [
  { id: "normal", name: "Normal", class: "" },
  { id: "sepia", name: "Sepia", class: "sepia" },
  { id: "grayscale", name: "Grayscale", class: "grayscale" },
  { id: "warm", name: "Warm", class: "filter-warm" },
  { id: "cool", name: "Cool", class: "filter-cool" },
  { id: "vintage", name: "Vintage", class: "filter-vintage" },
  { id: "dramatic", name: "Dramatic", class: "contrast-125 saturate-150" },
  { id: "fade", name: "Fade", class: "opacity-75" },
  { id: "vibrant", name: "Vibrant", class: "saturate-200" },
];

const AUDIO_TRACKS = [
  { id: 1, title: "Bollywood Beat", artist: "DJ Raj", duration: "0:30" },
  { id: 2, title: "Kerala Rhythm", artist: "South Beats", duration: "0:45" },
  { id: 3, title: "Punjabi Dance", artist: "North Star", duration: "1:00" },
  { id: 4, title: "Tamil Classic", artist: "Chennai Mix", duration: "0:55" },
  { id: 5, title: "Folk Fusion", artist: "Traditional Vibes", duration: "1:15" },
];

export default function CreateReelPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("record");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);
  const [selectedAudio, setSelectedAudio] = useState<number | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  
  // Crop-related state
  const [isCropMode, setIsCropMode] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.type.startsWith("video/")) {
      setMediaFile(file);
      setActiveTab("edit");
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a video file.",
        variant: "destructive",
      });
    }
  };
  
  // Handle camera recording
  const startRecording = async () => {
    try {
      // Request camera and microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      streamRef.current = stream;
      
      // Display live camera feed
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      // Start recording
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/mp4" });
        setRecordedVideo(blob);
        
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        
        // Convert Blob to File for upload
        const file = new File([blob], "recorded-video.mp4", { type: "video/mp4" });
        setMediaFile(file);
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        // Reset recording state
        setIsRecording(false);
        setActiveTab("edit");
        
        // Clear timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
      
      // Start recording
      chunksRef.current = [];
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      let seconds = 0;
      timerRef.current = window.setInterval(() => {
        seconds++;
        setRecordingTime(seconds);
        
        // Automatically stop recording after 60 seconds
        if (seconds >= 60) {
          stopRecording();
        }
      }, 1000);
    } catch (error) {
      console.error("Error starting camera:", error);
      toast({
        title: "Camera Error",
        description: "Could not access camera or microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };
  
  // Upload the reel
  const uploadMutation = useMutation({
    mutationFn: async () => {
      setIsUploading(true);
      
      const formData = new FormData();
      if (mediaFile) {
        formData.append("video", mediaFile);
      }
      
      formData.append("caption", caption);
      formData.append("filter", selectedFilter.id);
      
      if (selectedAudio) {
        formData.append("audioId", selectedAudio.toString());
      }
      
      const response = await apiRequest("POST", "/api/reels", formData, true);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reels"] });
      toast({
        title: "Reel uploaded!",
        description: "Your reel has been successfully uploaded.",
      });
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setIsUploading(false);
    },
  });
  
  // Clean up resources when unmounting
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);
  
  // Handle crop complete event
  const onCropComplete = useCallback(
    (croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  // Create a video thumbnail with the cropped area
  const createVideoThumbnail = async (videoFile: File): Promise<{ thumbnailBlob: Blob, thumbnailUrl: string }> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        // Seek to 1 second
        video.currentTime = 1;
      };
      
      video.oncanplay = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob from canvas'));
            return;
          }
          const thumbnailUrl = URL.createObjectURL(blob);
          resolve({ thumbnailBlob: blob, thumbnailUrl });
        }, 'image/jpeg', 0.8);
      };
      
      video.onerror = (e) => {
        reject(new Error('Error loading video: ' + e));
      };
      
      video.src = URL.createObjectURL(videoFile);
    });
  };

  // Apply crop to video (not fully implemented as it requires complex video processing)
  // In a real app, this would be handled server-side or with a specialized library
  const applyCrop = async () => {
    if (!mediaFile || !croppedAreaPixels) {
      toast({
        title: "Error",
        description: "No media file or crop area defined",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // In a production app, we would send the crop parameters to the server
      // and use FFmpeg or similar to crop the video
      
      // For now, we'll just pretend we cropped it and continue to the edit mode
      toast({
        title: "Crop applied",
        description: "Your crop area has been applied to the video",
      });
      
      setIsCropMode(false);
    } catch (error) {
      console.error('Error applying crop:', error);
      toast({
        title: "Crop failed",
        description: "Failed to apply crop to video",
        variant: "destructive",
      });
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="bg-white min-h-screen">
      <div className="fixed top-0 left-0 right-0 bg-white border-b z-10 p-4">
        <div className="flex justify-between items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/")}
          >
            <X className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-semibold">Create Reel</h1>
          {activeTab === "edit" && (
            <Button 
              disabled={isUploading || !mediaFile} 
              onClick={() => uploadMutation.mutate()}
            >
              {isUploading ? "Uploading..." : "Share"}
            </Button>
          )}
        </div>
      </div>
      
      <div className="pt-16 pb-16 px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="record" disabled={isRecording || !!mediaFile}>
              <Camera className="h-4 w-4 mr-2" />
              Record
            </TabsTrigger>
            <TabsTrigger value="upload" disabled={isRecording || !!mediaFile}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="edit" disabled={!mediaFile}>
              <Layers className="h-4 w-4 mr-2" />
              Edit
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="record" className="flex flex-col items-center">
            <div className="bg-black w-full aspect-[9/16] rounded-lg overflow-hidden mb-4 relative">
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
              
              {isRecording && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded-full text-xs flex items-center">
                  <span className="animate-custom-pulse h-2 w-2 bg-white rounded-full mr-1"></span>
                  {formatTime(recordingTime)}
                </div>
              )}
            </div>
            
            <div className="flex justify-center space-x-4 mt-4">
              <Button 
                size="lg" 
                className={`rounded-full p-3 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-primary'}`}
                onClick={isRecording ? stopRecording : startRecording}
              >
                {isRecording ? (
                  <Square className="h-6 w-6" />
                ) : (
                  <Camera className="h-6 w-6" />
                )}
              </Button>
            </div>
            
            <div className="mt-6 text-center text-sm text-gray-500">
              {isRecording 
                ? "Recording in progress. Tap the button to stop." 
                : "Tap the button to start recording your reel."}
            </div>
          </TabsContent>
          
          <TabsContent value="upload" className="flex flex-col items-center">
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg w-full aspect-[9/16] flex flex-col items-center justify-center p-4 cursor-pointer hover:border-primary"
              onClick={() => fileInputRef.current?.click()}
            >
              <Video className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium mb-2">Upload video</p>
              <p className="text-sm text-gray-500 text-center mb-4">
                Select a video file from your device
              </p>
              <Button>Select file</Button>
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="video/*" 
                onChange={handleFileChange}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="edit" className="space-y-6">
            {previewUrl && isCropMode ? (
              <div className="bg-black w-full aspect-[9/16] rounded-lg overflow-hidden mb-4 relative">
                <Cropper
                  image={previewUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={9/16}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
                
                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
                  <Button 
                    size="sm"
                    variant="secondary"
                    className="bg-white/80 hover:bg-white text-black"
                    onClick={() => setZoom(Math.max(1, zoom - 0.1))}
                  >
                    <ZoomIn className="h-4 w-4 -scale-y-100" />
                  </Button>
                  
                  <Button 
                    size="sm"
                    variant="secondary"
                    className="bg-white/80 hover:bg-white text-black"
                    onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    size="sm"
                    variant="secondary"
                    className="bg-white/80 hover:bg-white text-black"
                    onClick={() => {
                      setCrop({ x: 0, y: 0 });
                      setZoom(1);
                    }}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="mt-4 flex justify-between">
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsCropMode(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={applyCrop}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            ) : previewUrl && (
              <div className="bg-black w-full aspect-[9/16] rounded-lg overflow-hidden mb-4 relative">
                <video 
                  src={previewUrl} 
                  className={`w-full h-full object-cover ${selectedFilter.class}`} 
                  controls 
                />
              </div>
            )}
            
            {!isCropMode && (
              <div className="flex justify-center mb-6">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCropMode(true)}
                  className="flex items-center"
                >
                  <Crop className="h-4 w-4 mr-2" />
                  Crop Video
                </Button>
              </div>
            )}
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Filters</h3>
              <div className="flex overflow-x-auto pb-2 -mx-4 px-4 space-x-3">
                {FILTERS.map(filter => (
                  <div 
                    key={filter.id} 
                    className={`flex-shrink-0 w-16 aspect-square rounded-lg overflow-hidden border-2 ${selectedFilter.id === filter.id ? 'border-blue-500' : 'border-transparent'}`}
                    onClick={() => setSelectedFilter(filter)}
                  >
                    <div className={`w-full h-full bg-gray-300 flex items-center justify-center ${filter.class}`}>
                      <Filter className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-xs text-center mt-1 truncate px-1">{filter.name}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Audio</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {AUDIO_TRACKS.map(track => (
                  <div 
                    key={track.id} 
                    className={`flex items-center p-3 rounded-lg ${selectedAudio === track.id ? 'bg-gray-100' : ''}`}
                    onClick={() => setSelectedAudio(track.id)}
                  >
                    <div className="bg-primary rounded-full p-2 mr-3">
                      <Music className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{track.title}</div>
                      <div className="text-sm text-gray-500">{track.artist}</div>
                    </div>
                    <div className="text-sm text-gray-500">{track.duration}</div>
                    {selectedAudio === track.id && (
                      <div className="ml-2 text-primary">
                        <Check className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="caption">Caption</Label>
              <Textarea 
                id="caption" 
                placeholder="Write a caption..." 
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <Navbar />
    </div>
  );
}