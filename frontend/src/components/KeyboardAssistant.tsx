import React, { useState, useEffect } from 'react';
import { Volume2, Check, Send, MessageSquareQuote, Sparkles } from 'lucide-react';
import { speechService } from '../services/speechService';
import { apiService } from '../services/apiService';

interface KeyboardAssistantProps {
  focusedIndex: number;
  triggerSelect: boolean;
  onSelectHandled: () => void;
  activeItemCount: (count: number) => void;
}

const COMMON_WORDS_DICTIONARY = [
  'HELLO', 'HELP', 'HOW', 'HERE', 'HUNGRY', 'HURT',
  'THANK', 'THANKS', 'THE', 'THAT', 'THIS', 'THIRSTY', 'TIRED',
  'PLEASE', 'PAIN', 'PILLOW', 'POSITION', 'PHONE',
  'YES', 'NO', 'NEED', 'NURSE', 'NOT', 'NOW',
  'I', 'LOVE', 'YOU', 'LIKE', 'LATER', 'LITTLE',
  'WATER', 'WASHROOM', 'WANT', 'WHAT', 'WHEN', 'WHERE',
  'DOCTOR', 'MEDICINE', 'COLD', 'HOT', 'GOOD', 'BAD', 'FAMILY'
];

const DEFAULT_PREDICTIONS = ['YES', 'NO', 'PLEASE', 'THANK YOU'];

const QUICK_PHRASES = [
  'I love you',
  'Thank you for caring',
  'Please adjust my pillow',
  'I am tired, want to sleep',
  'Can we open the window?',
  'What time is it?'
];

// Layout: 4 Prediction slots + 26 alphabet letters + 4 utility keys
const KEYBOARD_KEYS = [
  'A', 'B', 'C', 'D', 'E', 'F',
  'G', 'H', 'I', 'J', 'K', 'L',
  'M', 'N', 'O', 'P', 'Q', 'R',
  'S', 'T', 'U', 'V', 'W', 'X',
  'Y', 'Z', 'SPACE', 'DELETE', 'CLEAR', 'SPEAK'
];

export const KeyboardAssistant: React.FC<KeyboardAssistantProps> = ({
  focusedIndex,
  triggerSelect,
  onSelectHandled,
  activeItemCount
}) => {
  const [text, setText] = useState<string>('');
  const [activePredictions, setActivePredictions] = useState<string[]>(DEFAULT_PREDICTIONS);
  const [lastActionToast, setLastActionToast] = useState<string | null>(null);

  // Total selectable items: 4 prediction slots + 30 keyboard keys = 34 items
  const allSelectables = [
    ...activePredictions.map((p, idx) => `PRED:${idx}:${p}`),
    ...KEYBOARD_KEYS
  ];

  useEffect(() => {
    activeItemCount(allSelectables.length);
  }, [allSelectables.length, activeItemCount]);

  // Update predictions dynamically based on current word prefix
  useEffect(() => {
    const words = text.trim().split(' ');
    const currentWord = words[words.length - 1]?.toUpperCase() || '';

    if (currentWord.length >= 1) {
      const matched = COMMON_WORDS_DICTIONARY.filter(w => w.startsWith(currentWord)).slice(0, 4);
      if (matched.length > 0) {
        // Pad to 4 with defaults if fewer than 4 matched
        const padded = [...matched];
        while (padded.length < 4) {
          const fallback = DEFAULT_PREDICTIONS[padded.length];
          if (!padded.includes(fallback)) padded.push(fallback);
          else padded.push('DONE');
        }
        setActivePredictions(padded);
      } else {
        setActivePredictions(DEFAULT_PREDICTIONS);
      }
    } else {
      setActivePredictions(DEFAULT_PREDICTIONS);
    }
  }, [text]);

  // Handle selection (Triple-blink trigger)
  useEffect(() => {
    if (!triggerSelect) return;

    const selectedItem = allSelectables[focusedIndex];
    if (selectedItem) {
      if (selectedItem.startsWith('PRED:')) {
        const parts = selectedItem.split(':');
        const word = parts.slice(2).join(':');
        insertPrediction(word);
      } else {
        handleKeyAction(selectedItem);
      }
    }

    onSelectHandled();
  }, [triggerSelect]);

  const insertPrediction = (word: string) => {
    speechService.playSelectionTone();
    const words = text.trim().split(' ');
    // If user was typing a prefix, replace last word with prediction
    if (words.length > 0 && words[words.length - 1].length > 0 && text.endsWith(words[words.length - 1])) {
      words.pop();
    }
    const newText = words.length > 0 && words[0] !== '' ? words.join(' ') + ' ' + word + ' ' : word + ' ';
    setText(newText);
  };

  const handleKeyAction = (key: string) => {
    speechService.playSelectionTone();

    if (key === 'SPACE') {
      setText(prev => prev + ' ');
    } else if (key === 'DELETE') {
      setText(prev => prev.slice(0, -1));
    } else if (key === 'CLEAR') {
      setText('');
      speechService.playTone(300, 0.1, 'sawtooth');
    } else if (key === 'SPEAK') {
      if (text.trim()) {
        speakAndSend();
      } else {
        speechService.speak('Message buffer is empty.');
      }
    } else {
      setText(prev => prev + key);
    }
  };

  const speakAndSend = async () => {
    const phrase = text.trim();
    if (!phrase) return;

    speechService.speak(phrase);
    setLastActionToast(`Spoken: "${phrase}"`);

    await apiService.createRequest({
      category: 'keyboard',
      label: 'Eye-Spelled Message',
      speechText: phrase,
      urgency: 'normal',
      triggerMethod: 'triple_blink'
    });

    setTimeout(() => setLastActionToast(null), 4500);
  };

  const insertPhrase = (phrase: string) => {
    speechService.playSelectionTone();
    setText(phrase);
    speechService.speak(phrase);
    setLastActionToast(`Spoken: "${phrase}"`);
    setTimeout(() => setLastActionToast(null), 4000);
  };

  return (
    <div className="w-full flex flex-col h-full gap-3">
      {/* Typed Output Display Screen */}
      <div className="p-4 md:p-5 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-md flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-2 text-slate-300">
            <Volume2 size={16} className="text-blue-400" />
            <span className="font-bold text-main">Sentence Output Buffer</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-slate-400">{text.length} chars</span>
            {text && (
              <button
                onClick={() => setText('')}
                className="text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Text Screen with animated blinking caret */}
        <div className="min-h-[64px] flex items-center px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xl md:text-2xl font-mono text-main tracking-wide break-words shadow-inner">
          {text ? (
            <span>
              {text}
              <span className="text-blue-500 font-bold ml-0.5 animate-pulse">|</span>
            </span>
          ) : (
            <span className="text-slate-500 font-sans text-base md:text-lg font-normal flex items-center">
              Select letters or predictions below with gaze + Triple-Blink...
              <span className="text-blue-500 font-bold ml-1 animate-pulse">|</span>
            </span>
          )}
        </div>

        {/* Word Prediction Strip — Part of Eye-Gaze Scanning Sequence! */}
        <div className="flex flex-col gap-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
            <span className="flex items-center gap-1">
              <Sparkles size={12} className="text-amber-400" />
              Word Predictions [Selectable items 1–4]:
            </span>
            {text.trim() && (
              <button
                onClick={speakAndSend}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm ml-auto"
              >
                <Send size={12} /> Speak Buffer
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {activePredictions.map((pred, i) => {
              const isFocused = focusedIndex === i;
              return (
                <button
                  key={i}
                  onClick={() => insertPrediction(pred)}
                  className={`
                    px-3 py-2 rounded-xl text-xs md:text-sm font-bold font-mono transition-all cursor-pointer border flex items-center justify-center gap-1.5
                    ${isFocused 
                      ? 'eye-focus-active !scale-105' 
                      : 'bg-blue-950/40 border-blue-500/30 text-blue-300 hover:bg-blue-900/60'}
                  `}
                >
                  <span className="text-[10px] text-blue-400/80 font-normal">[{i + 1}]</span>
                  <span>{pred}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {lastActionToast && (
        <div className="py-2 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold flex items-center justify-between text-xs shadow-sm">
          <div className="flex items-center gap-2">
            <Check size={15} className="text-emerald-400" />
            <span>{lastActionToast}</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400/80">Spoken Aloud</span>
        </div>
      )}

      {/* Virtual Eye Keyboard Grid */}
      <div className="grid grid-cols-6 gap-2 sm:gap-2.5 flex-1 items-stretch">
        {KEYBOARD_KEYS.map((key, keyIdx) => {
          // Index offset: predictions take indices 0..3, keys start at index 4
          const itemIndex = keyIdx + 4;
          const isFocused = focusedIndex === itemIndex;
          const isSpeak = key === 'SPEAK';
          const isDel = key === 'DELETE';
          const isClear = key === 'CLEAR';
          const isSpace = key === 'SPACE';

          let keyColorClass = 'bg-slate-900 border-slate-700/80 text-main';
          if (isSpeak) keyColorClass = 'bg-emerald-600 text-white border-emerald-500';
          else if (isDel) keyColorClass = 'bg-amber-600 text-white border-amber-500';
          else if (isClear) keyColorClass = 'bg-rose-500 text-white border-rose-400';
          else if (isSpace) keyColorClass = 'bg-blue-600 text-white border-blue-500';

          return (
            <div
              key={key}
              onClick={() => handleKeyAction(key)}
              className={`
                aac-key p-3 md:p-4 rounded-xl flex items-center justify-center text-center cursor-pointer select-none
                border text-base md:text-xl font-bold font-mono transition-all
                ${keyColorClass}
                ${isFocused ? 'eye-focus-active !scale-105' : ''}
              `}
            >
              {key === 'SPACE' ? '␣ SPACE' : key === 'DELETE' ? '⌫ DEL' : key === 'CLEAR' ? '🗑 CLEAR' : key === 'SPEAK' ? '🗣 SPEAK' : key}
            </div>
          );
        })}
      </div>

      {/* Quick Phrase Shortcuts Tray */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
        <div className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
          <MessageSquareQuote size={14} className="text-blue-400" />
          <span>Quick Phrases (One-tap speech):</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_PHRASES.map((phrase, idx) => (
            <button
              key={idx}
              onClick={() => insertPhrase(phrase)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            >
              "{phrase}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
