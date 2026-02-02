
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { FolderIcon, ShieldExclamationIcon, PlayIcon, ArrowPathIcon, LockClosedIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

// Define Types
interface LeakedVideo {
  id: string;
  url: string;
  prompt: string;
  timestamp: string;
  fileName: string;
}

const DINOSAURS = [
  "Tyrannosaurus Rex",
  "Triceratops",
  "Brachiosaurus",
  "Velociraptor",
  "Stegosaurus",
  "Spinosaurus",
  "Pterodactyl",
  "Ankylosaurus"
];

const BEHAVIORS = [
  "Grazing peacefully",
  "Hunting through dense ferns",
  "Drinking from a misty riverbed",
  "Walking slowly through thick fog",
  "Resting in a shaded hollow",
  "Nesting among giant ferns",
  "Engaged in a territorial display"
];

const LIGHTING = [
  "Filtered morning sunlight",
  "Dusk with deep shadows",
  "Overcast and humid midday",
  "Golden hour glow through canopy"
];

// Helper for base64 decoding (standard logic)
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export default function App() {
  const [apiKeySelected, setApiKeySelected] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState("");
  const [videos, setVideos] = useState<LeakedVideo[]>([]);
  
  const [selectedDino, setSelectedDino] = useState(DINOSAURS[0]);
  const [selectedBehavior, setSelectedBehavior] = useState(BEHAVIORS[0]);
  const [selectedLighting, setSelectedLighting] = useState(LIGHTING[0]);

  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setApiKeySelected(hasKey);
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    // @ts-ignore
    await window.aistudio.openSelectKey();
    setApiKeySelected(true);
  };

  const generateVideo = async () => {
    setIsGenerating(true);
    setGenerationStep("Accessing Archival Server...");
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const fullPrompt = `Raw, unedited found-footage of a ${selectedDino}. ${selectedBehavior}. Handheld consumer camera, unsteady grip, minor shake, occasional focus hunting, hidden behind foliage at human eye level. ${selectedLighting} filtered through dense prehistoric forest canopy, uneven exposure. Massive size, heavy footsteps, tail shifting naturally. Humid air, drifting fog, muddy terrain. Observational realism, accidental discovery feel. 4K, 24fps, realistic skin texture. No music.`;

      setGenerationStep("Initializing Neural Render (VEO-3.1)...");
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: fullPrompt,
        config: {
          numberOfVideos: 1,
          resolution: '1080p',
          aspectRatio: '16:9'
        }
      });

      setGenerationStep("Processing Classified Footage (Approx 1-2 mins)...");

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 8000));
        // @ts-ignore - The SDK handles operation status updates via getVideosOperation
        operation = await ai.operations.getVideosOperation({ operation: operation });
        
        // Dynamic loading messages to improve UX
        const messages = [
            "Decompressing raw camera sensor data...",
            "Synchronizing audio artifacts...",
            "Applying motion-blur physics...",
            "Reconstructing prehistoric atmosphere...",
            "Finalizing exposure fluctuations..."
        ];
        setGenerationStep(messages[Math.floor(Math.random() * messages.length)]);
      }

      setGenerationStep("Fetching secure download link...");
      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      
      if (!downloadLink) throw new Error("Video URI not found in response.");

      const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const newVideo: LeakedVideo = {
        id: Date.now().toString(),
        url: url,
        prompt: fullPrompt,
        timestamp: new Date().toLocaleString(),
        fileName: `LEAK_ARCHIVE_${Math.floor(Math.random() * 9000) + 1000}.mp4`
      };

      setVideos(prev => [newVideo, ...prev]);
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes("Requested entity was not found")) {
        setApiKeySelected(false);
      }
      alert("Error generating video. Please check your API key and try again.");
    } finally {
      setIsGenerating(false);
      setGenerationStep("");
    }
  };

  if (!apiKeySelected) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full space-y-8 bg-[#111] border border-red-900/30 p-10 rounded-lg shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-600"></div>
          <div className="scanline"></div>
          
          <div className="flex justify-center">
            <ShieldExclamationIcon className="h-20 w-20 text-red-500 animate-pulse" />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter mono">Access Restricted</h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              This terminal requires a verified <span className="text-zinc-200 font-bold underline">Paid API Key</span> to access the Prehistoric Wildlife Database. 
              The VEO generator uses high-compute nodes restricted to Tier 1 personnel.
            </p>
            <div className="bg-red-950/20 border border-red-900/50 p-4 rounded text-xs text-red-400 text-left flex gap-3">
              <InformationCircleIcon className="h-5 w-5 flex-shrink-0" />
              <p>
                Ensure your selected project has <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline font-bold">Billing Enabled</a>. 
                Free tier projects do not have access to Veo Video models.
              </p>
            </div>
          </div>

          <button 
            onClick={handleSelectKey}
            className="w-full bg-white text-black font-bold py-4 px-6 rounded hover:bg-zinc-200 transition-colors uppercase tracking-widest text-sm flex items-center justify-center gap-2 group"
          >
            Authenticate Credentials
            <LockClosedIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <div className="scanline"></div>
      
      {/* Navigation / Header */}
      <header className="border-b border-zinc-800 bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white flex items-center justify-center">
              <span className="text-black font-black text-xl">X</span>
            </div>
            <div>
              <h2 className="text-white font-black uppercase tracking-tighter text-lg leading-tight">Archive: 2.5-LEAK</h2>
              <p className="text-[10px] text-zinc-500 mono uppercase">Prehistoric Wildlife Surveillance</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] text-zinc-500 mono uppercase">System Status</span>
              <span className="text-[10px] text-green-500 mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                Connected / Secure
              </span>
            </div>
            <button 
              onClick={handleSelectKey}
              className="text-[10px] mono uppercase border border-zinc-700 px-3 py-1 hover:bg-zinc-800 transition-colors"
            >
              Change Project
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full">
        {/* Controls Column */}
        <aside className="w-full md:w-80 border-r border-zinc-800 p-6 space-y-8">
          <section className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <FolderIcon className="h-4 w-4" /> Observation Target
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 uppercase mono">Entity Species</label>
                <select 
                  value={selectedDino}
                  onChange={(e) => setSelectedDino(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-zinc-200 outline-none focus:border-white transition-colors"
                >
                  {DINOSAURS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 uppercase mono">Observed Behavior</label>
                <select 
                  value={selectedBehavior}
                  onChange={(e) => setSelectedBehavior(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-zinc-200 outline-none focus:border-white transition-colors"
                >
                  {BEHAVIORS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 uppercase mono">Lighting Conditions</label>
                <select 
                  value={selectedLighting}
                  onChange={(e) => setSelectedLighting(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-zinc-200 outline-none focus:border-white transition-colors"
                >
                  {LIGHTING.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-4 pt-4 border-t border-zinc-800">
            <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded">
              <h4 className="text-[10px] font-bold text-zinc-400 uppercase mono mb-2">Camera Specs (Fixed)</h4>
              <ul className="text-[9px] text-zinc-500 space-y-1 mono uppercase">
                <li>• Handheld Consumer Cam</li>
                <li>• 4K / 24FPS</li>
                <li>• Raw Audio Capture</li>
                <li>• High Motion Blur</li>
              </ul>
            </div>
            
            <button 
              onClick={generateVideo}
              disabled={isGenerating}
              className={`w-full py-4 px-6 rounded font-black uppercase tracking-widest text-sm transition-all duration-300 flex items-center justify-center gap-3 ${
                isGenerating 
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                : 'bg-white text-black hover:bg-zinc-200 shadow-lg shadow-white/5 active:scale-[0.98]'
              }`}
            >
              {isGenerating ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <PlayIcon className="h-5 w-5" />
                  Recover Footage
                </>
              )}
            </button>
          </section>
        </aside>

        {/* Content Area */}
        <section className="flex-1 bg-zinc-950 p-6 md:p-10 relative">
          {/* Loading Overlay */}
          {isGenerating && (
            <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
              <div className="max-w-sm w-full space-y-8">
                <div className="relative w-24 h-24 mx-auto">
                   <div className="absolute inset-0 border-4 border-zinc-800 rounded-full"></div>
                   <div className="absolute inset-0 border-4 border-t-white rounded-full animate-spin"></div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-bold text-white uppercase tracking-tighter">Analyzing Server Logs</h4>
                  <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-white animate-[progress_10s_ease-in-out_infinite]"></div>
                  </div>
                  <p className="text-xs text-zinc-400 mono animate-pulse">{generationStep}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-10">
            {videos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                <div className="w-16 h-16 border-2 border-dashed border-zinc-700 flex items-center justify-center rounded">
                  <PlayIcon className="h-8 w-8 text-zinc-700" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-zinc-400">No active surveillance logs.</h3>
                  <p className="text-sm text-zinc-600 max-w-xs">Use the control panel to start capturing leaked prehistoric wildlife data.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-12">
                {videos.map((video) => (
                  <div key={video.id} className="group relative">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1 relative aspect-video bg-black overflow-hidden rounded-lg shadow-2xl ring-1 ring-zinc-800">
                        {/* VHS UI Overlay on Video */}
                        <div className="absolute top-4 left-4 z-20 pointer-events-none">
                          <span className="text-white text-[10px] md:text-sm mono font-bold uppercase drop-shadow-md flex items-center gap-2">
                             <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                             REC
                          </span>
                        </div>
                        <div className="absolute top-4 right-4 z-20 pointer-events-none">
                          <span className="text-white text-[10px] md:text-sm mono font-bold drop-shadow-md">
                            {video.timestamp}
                          </span>
                        </div>
                        <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
                          <span className="text-white text-[10px] md:text-sm mono font-bold drop-shadow-md opacity-80">
                            PLAY ▶
                          </span>
                        </div>
                        <video 
                          src={video.url} 
                          controls 
                          className="w-full h-full object-cover vhs-flicker"
                          poster="https://picsum.photos/seed/dino/1280/720"
                        />
                      </div>
                      
                      <div className="md:w-64 flex flex-col justify-between">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-[10px] text-zinc-500 uppercase mono mb-1">Source File</h4>
                            <p className="text-sm font-bold text-zinc-200 tracking-tight">{video.fileName}</p>
                          </div>
                          <div>
                            <h4 className="text-[10px] text-zinc-500 uppercase mono mb-1">Prompt Metadata</h4>
                            <p className="text-[11px] text-zinc-400 italic leading-relaxed">
                              "{video.prompt.substring(0, 100)}..."
                            </p>
                          </div>
                        </div>
                        
                        <a 
                          href={video.url} 
                          download={video.fileName}
                          className="mt-6 flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-700 py-2 text-[10px] mono uppercase text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                        >
                          <FolderIcon className="h-4 w-4" />
                          Save Local Archive
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-900 bg-black py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] text-zinc-600 mono uppercase">
            // End of classified transmission // Unauthorized access will be prosecuted
          </p>
          <div className="flex items-center gap-4 text-[10px] text-zinc-600 mono uppercase">
            <span>Server: VEO-ALPHA-7</span>
            <span className="w-1 h-1 bg-zinc-800 rounded-full"></span>
            <span>Uptime: 99.99%</span>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes progress {
          0% { width: 0; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
