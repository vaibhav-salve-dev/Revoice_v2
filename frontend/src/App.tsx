import React, { useState, useEffect, useCallback } from 'react';
import { 
  MessageSquare, 
  Keyboard, 
  Gamepad2, 
  Settings, 
  Activity, 
  Eye, 
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  AlertOctagon,
  Radio
} from 'lucide-react';
import { eyeInputManager } from './services/eyeInputManager';
import type { EyeGestureEvent } from './services/eyeInputManager';
import { speechService } from './services/speechService';
import { socketService } from './services/socketService';
import { apiService } from './services/apiService';
import { DailyCommunication } from './components/DailyCommunication';
import { KeyboardAssistant } from './components/KeyboardAssistant';
import { GamesSection } from './components/GamesSection';
import { HealthMonitoringModal } from './components/HealthMonitoringModal';
import { SettingsModal } from './components/SettingsModal';

const SECTIONS = [
  { id: 'daily', label: 'Quick Needs & Phrases', shortcut: 'Tab 1', icon: <MessageSquare size={18} /> },
  { id: 'keyboard', label: 'Spelling & Prediction', shortcut: 'Tab 2', icon: <Keyboard size={18} /> },
  { id: 'games', label: 'Ocular Therapy & Reflexes', shortcut: 'Tab 3', icon: <Gamepad2 size={18} /> }
];

export const App: React.FC = () => {
  // Theme state: Bedside Dark (default) vs Clinical Light
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    return localStorage.getItem('revoice_theme') === 'light';
  });

  const toggleTheme = () => {
    setIsLightMode(prev => {
      const next = !prev;
      localStorage.setItem('revoice_theme', next ? 'light' : 'dark');
      return next;
    });
  };

  // Sound Mute Toggle state
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  const toggleAudioMute = () => {
    setIsAudioMuted(prev => {
      const next = !prev;
      speechService.setConfig({ tonesEnabled: !next });
      return next;
    });
  };

  // Navigation state
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(0);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [activeItemCount, setActiveItemCount] = useState<number>(8);
  const [isSubMenu, setIsSubMenu] = useState<boolean>(false);
  const [triggerSelect, setTriggerSelect] = useState<boolean>(false);

  // Gesture feedback & stats
  const [lastGesture, setLastGesture] = useState<string | null>(null);
  const [gestureFlash, setGestureFlash] = useState<string | null>(null);
  const [saccadeStats, setSaccadeStats] = useState({ left: 0, right: 0, blinks: 0 });

  // Live Speech Synthesis Feedback
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [currentSpokenText, setCurrentSpokenText] = useState<string>('System initialized and ready for eye input.');

  // Caregiver Modals
  const [isHealthOpen, setIsHealthOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [unreadRequests, setUnreadRequests] = useState<number>(0);

  // Keep item count in sync
  const handleActiveItemCount = useCallback((count: number) => {
    setActiveItemCount(count);
  }, []);

  // Central Eye Gesture Handler
  const handleEyeGesture = useCallback((event: EyeGestureEvent) => {
    // If a modal is open, ignore navigation gestures
    if (isHealthOpen || isSettingsOpen) return;

    const { gesture } = event;
    setLastGesture(gesture);
    setGestureFlash(gesture);
    setTimeout(() => setGestureFlash(null), 500);

    // Relay to socket for live caregiver view
    socketService.emitEyeGesture(gesture, event.source);

    if (gesture === 'LOOK_LEFT') {
      speechService.playNavigationTone('left');
      setSaccadeStats(prev => ({ ...prev, left: prev.left + 1 }));
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : activeItemCount - 1));
    } else if (gesture === 'LOOK_RIGHT') {
      speechService.playNavigationTone('right');
      setSaccadeStats(prev => ({ ...prev, right: prev.right + 1 }));
      setFocusedIndex(prev => (prev < activeItemCount - 1 ? prev + 1 : 0));
    } else if (gesture === 'DOUBLE_BLINK') {
      speechService.playSectionTone();
      setSaccadeStats(prev => ({ ...prev, blinks: prev.blinks + 2 }));
      setIsSubMenu(false);
      setFocusedIndex(0);
      setCurrentSectionIndex(prev => {
        const next = (prev + 1) % SECTIONS.length;
        speechService.speak(`Switched to ${SECTIONS[next].label}`);
        return next;
      });
    } else if (gesture === 'TRIPLE_BLINK') {
      speechService.playSelectionTone();
      setSaccadeStats(prev => ({ ...prev, blinks: prev.blinks + 3 }));
      setTriggerSelect(true);
    }
  }, [activeItemCount, isHealthOpen, isSettingsOpen]);

  // Subscribe to eye input manager
  useEffect(() => {
    const unsubscribe = eyeInputManager.subscribe(handleEyeGesture);
    return () => unsubscribe();
  }, [handleEyeGesture]);

  // Subscribe to speech events
  useEffect(() => {
    const unsubSpeech = speechService.onSpeech((text, speaking) => {
      setIsSpeaking(speaking);
      if (text) setCurrentSpokenText(text);
    });
    return () => unsubSpeech();
  }, []);

  // Subscribe to unread requests count for caregiver badge
  useEffect(() => {
    const unsub = socketService.onNewRequest(() => {
      setUnreadRequests(prev => prev + 1);
      speechService.playTone(800, 0.1);
    });
    return () => unsub();
  }, []);

  // Top Bar Emergency Call
  const triggerHeaderEmergency = async () => {
    speechService.playEmergencyAlarm();
    speechService.speak('EMERGENCY! Attending nurse requested at Bed 04!');
    await apiService.createRequest({
      category: 'sos',
      label: 'HEADER SOS CALL',
      speechText: 'EMERGENCY! Attending nurse requested at Bed 04!',
      urgency: 'emergency',
      triggerMethod: 'caregiver_header'
    });
  };

  return (
    <div className={`min-h-screen flex flex-col relative overflow-x-hidden ${isLightMode ? 'light-mode' : ''}`}>
      
      {/* =========================================================================
          TOP BEDSIDE BAR: BRANDING + PATIENT IDENTIFIERS + QUICK ACTIONS
          ========================================================================= */}
      <header className="relative z-20 px-4 md:px-6 py-2.5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex items-center justify-between gap-3">
        
        {/* Left: Authentic Medical Branding & Patient Context */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <Radio size={19} className="animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-main">REVOICE</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-500 border border-blue-500/30">
                AAC Station
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              ICU Bed 04 • Patient: Alex R. (Locked-In Syndrome Care)
            </p>
          </div>
        </div>

        {/* Center: Live Sensor Link Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
          <span className="status-dot-active"></span>
          <span>Sensor Link:</span>
          <span className="font-mono text-main font-semibold">ESP32-C6 (60 Hz)</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">Single Blinks Filtered</span>
        </div>

        {/* Right: Emergency SOS, Vitals, Settings, Audio Toggle, and Theme Mode Switcher */}
        <div className="flex items-center gap-2">
          
          {/* Audio Feedback Mute/Unmute */}
          <button
            onClick={toggleAudioMute}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={isAudioMuted ? 'Unmute Audio Tones' : 'Mute Audio Tones'}
          >
            {isAudioMuted ? <VolumeX size={15} className="text-rose-400" /> : <Volume2 size={15} className="text-emerald-400" />}
          </button>

          

          {/* Vitals & Request Log Button */}
          <button
            onClick={() => {
              setIsHealthOpen(true);
              setUnreadRequests(0);
            }}
            className="relative px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Activity size={15} className="text-emerald-400" />
            <span className="hidden md:inline">Vitals & Log</span>
            
            {unreadRequests > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadRequests}
              </span>
            )}
          </button>

          {/* Settings Modal Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Calibration & Hardware Settings"
          >
            <Settings size={15} />
          </button>

          {/* Daylight / Bedside Night Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={isLightMode ? 'Switch to Bedside Night Mode' : 'Switch to Clinical Day Mode'}
          >
            {isLightMode ? <Moon size={15} /> : <Sun size={15} />}
          </button>
        </div>
      </header>

      {/* =========================================================================
          SECTION TABS (Double-Blink to Cycle)
          ========================================================================= */}
      <nav className="relative z-10 px-4 md:px-6 py-2.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-center gap-2 md:gap-4">
        {SECTIONS.map((sec, idx) => {
          const isActive = currentSectionIndex === idx;
          return (
            <button
              key={sec.id}
              onClick={() => {
                setCurrentSectionIndex(idx);
                setFocusedIndex(0);
                setIsSubMenu(false);
                speechService.playSectionTone();
                speechService.speak(`Switched to ${sec.label}`);
              }}
              className={`section-nav-tab ${isActive ? 'active' : ''}`}
            >
              <span className={isActive ? 'text-blue-500' : 'text-slate-400'}>{sec.icon}</span>
              <span className="text-main">{sec.label}</span>
              {isActive && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-500 border border-blue-500/30 hidden sm:inline">
                  Active
                </span>
              )}
            </button>
          );
        })}

        <span className="text-[11px] font-mono text-slate-500 ml-2 hidden lg:inline">
          [Double-Blink to cycle tabs]
        </span>
      </nav>

      {/* =========================================================================
          MAIN AAC CONTENT WORKSPACE
          ========================================================================= */}
      <main className="flex-1 relative z-10 p-3 md:p-5 flex flex-col max-w-7xl w-full mx-auto">
        {currentSectionIndex === 0 && (
          <DailyCommunication
            focusedIndex={focusedIndex}
            isSubMenu={isSubMenu}
            onEnterSubMenu={() => {
              setIsSubMenu(true);
              setFocusedIndex(0);
            }}
            onExitSubMenu={() => {
              setIsSubMenu(false);
              setFocusedIndex(0);
            }}
            triggerSelect={triggerSelect}
            onSelectHandled={() => setTriggerSelect(false)}
            activeItemCount={handleActiveItemCount}
          />
        )}

        {currentSectionIndex === 1 && (
          <KeyboardAssistant
            focusedIndex={focusedIndex}
            triggerSelect={triggerSelect}
            onSelectHandled={() => setTriggerSelect(false)}
            activeItemCount={handleActiveItemCount}
          />
        )}

        {currentSectionIndex === 2 && (
          <GamesSection
            focusedIndex={focusedIndex}
            triggerSelect={triggerSelect}
            onSelectHandled={() => setTriggerSelect(false)}
            activeItemCount={handleActiveItemCount}
            lastGesture={lastGesture}
          />
        )}
      </main>

      {/* =========================================================================
          BOTTOM ASSISTIVE STATUS & CAREGIVER SIMULATION TOOLBAR
          ========================================================================= */}
      <footer className="relative z-20 px-4 md:px-6 py-2.5 bg-slate-900 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        
        {/* Left: Ocular Telemetry Status Pill */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Eye size={15} className="text-blue-500" />
            <span className="font-semibold text-slate-300">Eye Tracking:</span>
          </div>

          <div className={`
            px-2.5 py-1 rounded-md font-mono text-xs font-semibold transition-all border
            ${gestureFlash === 'LOOK_LEFT' ? 'bg-blue-600 text-white border-blue-400' :
              gestureFlash === 'LOOK_RIGHT' ? 'bg-purple-600 text-white border-purple-400' :
              gestureFlash === 'DOUBLE_BLINK' ? 'bg-amber-600 text-white border-amber-400' :
              gestureFlash === 'TRIPLE_BLINK' ? 'bg-emerald-600 text-white border-emerald-400' :
              'bg-slate-800 text-slate-300 border-slate-700'}
          `}>
            {lastGesture === 'LOOK_LEFT' ? 'Saccade: Looking Left [←]' :
             lastGesture === 'LOOK_RIGHT' ? 'Saccade: Looking Right [→]' :
             lastGesture === 'DOUBLE_BLINK' ? 'Gesture: Double Blink (Cycle Tab)' :
             lastGesture === 'TRIPLE_BLINK' ? 'Gesture: Triple Blink (Selection)' :
             'Resting / Ready for Gaze'}
          </div>
        </div>

        {/* Center: Live Spoken Feedback / Audio Waveform */}
        <div className="flex items-center gap-2 max-w-md truncate">
          <div className="flex items-center gap-1">
            <div className={`flex items-center gap-0.5 h-4 ${isSpeaking ? '' : 'opacity-30'}`}>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
            </div>
            <Volume2 size={14} className={isSpeaking ? 'text-emerald-400' : 'text-slate-500'} />
          </div>

          <span className="text-slate-400 text-xs truncate">
            {isSpeaking ? (
              <span className="text-emerald-400 font-medium">Speaking: "{currentSpokenText}"</span>
            ) : (
              <span className="text-slate-400">Last spoken: "{currentSpokenText}"</span>
            )}
          </span>
        </div>

        {/* Right: Caregiver Testing & Simulation Keys */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-semibold mr-1 hidden lg:inline">
            Caregiver Keys:
          </span>

          <button
            onClick={() => eyeInputManager.emitGesture('LOOK_LEFT', 'simulator')}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-semibold border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
            title="Press Left Arrow or 'A'"
          >
            <ChevronLeft size={13} /> [←] Left
          </button>

          <button
            onClick={() => eyeInputManager.emitGesture('LOOK_RIGHT', 'simulator')}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-semibold border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
            title="Press Right Arrow or 'D'"
          >
            [→] Right <ChevronRight size={13} />
          </button>

          <button
            onClick={() => eyeInputManager.emitGesture('DOUBLE_BLINK', 'simulator')}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-mono font-semibold border border-slate-700 cursor-pointer transition-colors"
            title="Press '2' (Double Blink switches sections)"
          >
            [2] Tab
          </button>

          <button
            onClick={() => eyeInputManager.emitGesture('TRIPLE_BLINK', 'simulator')}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-mono font-semibold border border-slate-700 cursor-pointer transition-colors"
            title="Press '3' or Enter (Triple Blink selects)"
          >
            [3] Select
          </button>
        </div>
      </footer>

      {/* =========================================================================
          MODALS
          ========================================================================= */}
      <HealthMonitoringModal
        isOpen={isHealthOpen}
        onClose={() => setIsHealthOpen(false)}
        saccadeStats={saccadeStats}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default App;
