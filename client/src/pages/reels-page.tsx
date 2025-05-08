import React, { useState, useRef, useEffect } from "react";
import ReelsViewer from "@/components/reels-viewer";
import { Button } from "@/components/ui/button";
import { X, Camera, Video, Plus, Square, Filter as FilterIcon, Music, Mic, ArrowLeft, Check, Send } from "lucide-react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

export default function ReelsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State for viewing/creating modes
  const [mode, setMode] = useState<'view' | 'create'>('view');
  
  // Creation states
  const [createTab, setCreateTab] = useState<'record' | 'upload' | 'edit'>('record');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);
  const [selectedAudio, setSelectedAudio] = useState<number | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showAudioDialog, setShowAudioDialog] = useState(false);
  
  // Refs
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
      setCreateTab('edit');
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
        setCreateTab('edit');
        
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
      resetCreationState();
      setMode('view');
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

  // Reset all creation state
  const resetCreationState = () => {
    setCreateTab('record');
    setIsRecording(false);
    setRecordedVideo(null);
    setRecordingTime(0);
    setSelectedFilter(FILTERS[0]);
    setSelectedAudio(null);
    setMediaFile(null);
    setPreviewUrl(null);
    setCaption("");
    setIsUploading(false);
  };
  
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
  
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Conditional rendering based on mode
  if (mode === 'view') {
    return (
      <div className="h-screen w-full bg-black relative">
        <div className="absolute top-4 left-4 z-50 flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white"
            onClick={() => setLocation('/')}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
        
        {/* Create reel button */}
        <Button
          variant="default"
          size="icon"
          className="absolute top-4 right-4 z-50 bg-pink-500 hover:bg-pink-600 rounded-full"
          onClick={() => setMode('create')}
        >
          <Plus className="h-5 w-5" />
        </Button>
        
        <ReelsViewer />
      </div>
    );
  }

  // Creation mode
  return (
    <div className="h-screen w-full bg-black relative flex flex-col">
      <div className="fixed top-0 left-0 right-0 bg-black border-b border-gray-800 z-10 p-4">
        <div className="flex justify-between items-center">
          <Button 
            variant="ghost" 
            size="sm"
            className="text-white" 
            onClick={() => {
              resetCreationState();
              setMode('view');
            }}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-semibold text-white">Create Reel</h1>
          {createTab === 'edit' && (
            <Button 
              variant="default"
              className="bg-pink-500 hover:bg-pink-600"
              disabled={isUploading || !mediaFile} 
              onClick={() => uploadMutation.mutate()}
            >
              {isUploading ? "Uploading..." : "Share"}
            </Button>
          )}
        </div>
      </div>
      
      <div className="pt-16 pb-16 px-4 flex-1 bg-black">
        <Tabs value={createTab} onValueChange={(v) => setCreateTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-900">
            <TabsTrigger value="record" disabled={isRecording || !!mediaFile} className="text-white data-[state=active]:bg-gray-700">
              <Camera className="h-4 w-4 mr-2" />
              Record
            </TabsTrigger>
            <TabsTrigger value="upload" disabled={isRecording || !!mediaFile} className="text-white data-[state=active]:bg-gray-700">
              <Video className="h-4 w-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="edit" disabled={!mediaFile} className="text-white data-[state=active]:bg-gray-700">
              <FilterIcon className="h-4 w-4 mr-2" />
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
                className={`rounded-full p-3 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-pink-500 hover:bg-pink-600'}`}
                onClick={isRecording ? stopRecording : startRecording}
              >
                {isRecording ? (
                  <Square className="h-6 w-6" />
                ) : (
                  <Camera className="h-6 w-6" />
                )}
              </Button>
            </div>
            
            <div className="mt-6 text-center text-sm text-gray-400">
              {isRecording 
                ? "Recording in progress. Tap the button to stop." 
                : "Tap the button to start recording your reel."}
            </div>
          </TabsContent>
          
          <TabsContent value="upload" className="flex flex-col items-center">
            <div 
              className="border-2 border-dashed border-gray-700 rounded-lg w-full aspect-[9/16] flex flex-col items-center justify-center p-4 cursor-pointer hover:border-pink-500 bg-gray-900"
              onClick={() => fileInputRef.current?.click()}
            >
              <Video className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-white mb-2">Upload video</p>
              <p className="text-sm text-gray-400 text-center mb-4">
                Select a video file from your device
              </p>
              <Button className="bg-pink-500 hover:bg-pink-600">Select file</Button>
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
            {previewUrl && (
              <div className="bg-black w-full aspect-[9/16] rounded-lg overflow-hidden mb-4 relative">
                <video 
                  src={previewUrl} 
                  className={`w-full h-full object-cover ${selectedFilter.class}`} 
                  controls 
                />
              </div>
            )}
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-white">Filters</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-white border-gray-700 bg-transparent"
                  onClick={() => setShowAudioDialog(true)}
                >
                  <Music className="h-4 w-4 mr-2" />
                  Audio
                </Button>
              </div>
              <div className="flex overflow-x-auto pb-2 -mx-4 px-4 space-x-3">
                {FILTERS.map(filter => (
                  <div 
                    key={filter.id} 
                    className={`flex-shrink-0 w-16 aspect-square rounded-lg overflow-hidden border-2 ${selectedFilter.id === filter.id ? 'border-pink-500' : 'border-transparent'}`}
                    onClick={() => setSelectedFilter(filter)}
                  >
                    <div className={`w-full h-full bg-gray-700 flex items-center justify-center ${filter.class}`}>
                      <FilterIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-xs text-center mt-1 truncate px-1 text-white">{filter.name}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="caption" className="text-white">Caption</Label>
              <Textarea 
                id="caption" 
                placeholder="Write a caption..." 
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="resize-none bg-gray-900 border-gray-700 text-white"
                rows={3}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Audio selection dialog */}
      <Dialog open={showAudioDialog} onOpenChange={setShowAudioDialog}>
        <DialogContent className="bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Select Audio Track</DialogTitle>
            <DialogDescription className="text-gray-400">
              Choose a track for your reel
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {AUDIO_TRACKS.map(track => (
              <div 
                key={track.id} 
                className={`flex items-center p-3 rounded-lg cursor-pointer ${selectedAudio === track.id ? 'bg-gray-800' : 'hover:bg-gray-800'}`}
                onClick={() => {
                  setSelectedAudio(track.id);
                  setShowAudioDialog(false);
                }}
              >
                <div className="bg-pink-500 rounded-full p-2 mr-3">
                  <Music className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{track.title}</div>
                  <div className="text-sm text-gray-400">{track.artist}</div>
                </div>
                <div className="text-sm text-gray-400">{track.duration}</div>
                {selectedAudio === track.id && (
                  <div className="ml-2 text-pink-500">
                    <Check className="h-5 w-5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}