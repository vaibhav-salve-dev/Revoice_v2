import React, { useState, useEffect } from 'react';
import { 
  Utensils, 
  Droplets, 
  Bath, 
  Shirt, 
  Bed, 
  AlertCircle, 
  HeartHandshake, 
  BellRing, 
  CheckCircle2,
  ArrowLeft,
  Volume2,
  ChevronRight
} from 'lucide-react';
import { speechService } from '../services/speechService';
import { apiService } from '../services/apiService';
import type { PatientRequestData } from '../services/apiService';

export interface CategoryItem {
  id: string;
  label: string;
  speech: string;
  icon: React.ReactNode;
  categoryTag: string;
  colorVar: string;
  subItems?: { id: string; label: string; speech: string; icon: string }[];
}

interface DailyCommunicationProps {
  focusedIndex: number;
  isSubMenu: boolean;
  onEnterSubMenu: () => void;
  onExitSubMenu: () => void;
  triggerSelect: boolean;
  onSelectHandled: () => void;
  activeItemCount: (count: number) => void;
}

export const CATEGORIES: CategoryItem[] = [
  {
    id: 'food',
    label: 'Meals & Food',
    speech: 'I would like something to eat.',
    icon: <Utensils size={30} />,
    categoryTag: 'Nutrition',
    colorVar: 'var(--aac-amber)',
    subItems: [
      { id: 'f_meal', label: 'Main Meal / Rice', speech: 'I want to eat my regular meal.', icon: '🍚' },
      { id: 'f_soup', label: 'Warm Soup', speech: 'Please give me some warm soup.', icon: '🥣' },
      { id: 'f_soft', label: 'Soft Food / Porridge', speech: 'I would like soft food or porridge.', icon: '🍲' },
      { id: 'f_fruit', label: 'Fresh Fruits', speech: 'I want to eat some fresh fruits.', icon: '🍎' },
      { id: 'f_snack', label: 'Light Snack / Biscuit', speech: 'Can I have a light snack or biscuit?', icon: '🍪' }
    ]
  },
  {
    id: 'water',
    label: 'Water & Drinks',
    speech: 'I am thirsty, please give me water.',
    icon: <Droplets size={30} />,
    categoryTag: 'Hydration',
    colorVar: 'var(--aac-sky)',
    subItems: [
      { id: 'w_sip', label: 'Sip of Water (Straw)', speech: 'Please give me a sip of water with a straw.', icon: '💧' },
      { id: 'w_warm', label: 'Warm Water', speech: 'I need warm water please.', icon: '☕' },
      { id: 'w_cold', label: 'Cold Fresh Water', speech: 'Please give me cool fresh water.', icon: '🧊' },
      { id: 'w_juice', label: 'Fresh Fruit Juice', speech: 'I would like some fresh fruit juice.', icon: '🧃' },
      { id: 'w_mouth', label: 'Moisten Lips', speech: 'My mouth and lips are dry, please moisten them.', icon: '👄' }
    ]
  },
  {
    id: 'toilet',
    label: 'Washroom & Hygiene',
    speech: 'I need to use the washroom or bedpan urgently.',
    icon: <Bath size={30} />,
    categoryTag: 'Sanitation',
    colorVar: 'var(--aac-purple)',
    subItems: [
      { id: 't_urgent', label: 'Urgent Washroom Call', speech: 'I need the washroom right now, urgently.', icon: '🚨' },
      { id: 't_bedpan', label: 'Bedpan Needed', speech: 'Please bring the bedpan.', icon: '🛏️' },
      { id: 't_wash', label: 'Wash Hands & Face', speech: 'Please help me wash my hands and face.', icon: '🧼' },
      { id: 't_clean', label: 'Sponge Bath / Cleaning', speech: 'I need to be cleaned or sponge bathed.', icon: '🧽' }
    ]
  },
  {
    id: 'clothing',
    label: 'Temperature & Bedding',
    speech: 'I need to adjust my clothing or room temperature.',
    icon: <Shirt size={30} />,
    categoryTag: 'Environment',
    colorVar: 'var(--aac-blue)',
    subItems: [
      { id: 'c_cold', label: 'Feeling Cold (Blanket)', speech: 'I am feeling cold. Please put a blanket on me.', icon: '🥶' },
      { id: 'c_hot', label: 'Feeling Warm (Fan/AC)', speech: 'I am feeling warm. Please turn on the fan or AC.', icon: '🥵' },
      { id: 'c_change', label: 'Change Bedclothes', speech: 'My clothes are uncomfortable, please change them.', icon: '👕' },
      { id: 'c_adjust', label: 'Straighten Sheets', speech: 'Please straighten my shirt and bedsheet.', icon: '🛏️' }
    ]
  },
  {
    id: 'comfort',
    label: 'Posture & Repositioning',
    speech: 'I need to change my posture or bed position.',
    icon: <Bed size={30} />,
    categoryTag: 'Mobility Support',
    colorVar: 'var(--aac-emerald)',
    subItems: [
      { id: 'p_turn_l', label: 'Turn Body to Left', speech: 'Please gently turn my body to the left side.', icon: '⬅️' },
      { id: 'p_turn_r', label: 'Turn Body to Right', speech: 'Please gently turn my body to the right side.', icon: '➡️' },
      { id: 'p_sit', label: 'Elevate Head / Sit Up', speech: 'Please raise my bed so I can sit up higher.', icon: '⬆️' },
      { id: 'p_flat', label: 'Lay Flat Down', speech: 'Please lower the bed so I can lie down flat.', icon: '⬇️' },
      { id: 'p_pillow', label: 'Reposition Pillow', speech: 'My pillow is uncomfortable, please reposition it.', icon: '🛋️' }
    ]
  },
  {
    id: 'pain',
    label: 'Pain & Clinical Care',
    speech: 'I am experiencing pain or need medicine.',
    icon: <AlertCircle size={30} />,
    categoryTag: 'Clinical Alert',
    colorVar: 'var(--aac-rose)',
    subItems: [
      { id: 'm_head', label: 'Headache Discomfort', speech: 'I have a painful headache.', icon: '🤕' },
      { id: 'm_chest', label: 'Chest or Breathing', speech: 'I have discomfort in my chest or breathing.', icon: '🫁' },
      { id: 'm_back', label: 'Back & Body Ache', speech: 'My back and body are aching severely.', icon: '⚡' },
      { id: 'm_med', label: 'Scheduled Medication', speech: 'Is it time for my scheduled medication?', icon: '💊' },
      { id: 'm_doctor', label: 'Call Attending Doctor', speech: 'Please call the nurse or attending doctor.', icon: '🩺' }
    ]
  },
  {
    id: 'family',
    label: 'Family & Conversation',
    speech: 'I want to communicate with my family.',
    icon: <HeartHandshake size={30} />,
    categoryTag: 'Social Connection',
    colorVar: '#e11d48',
    subItems: [
      { id: 's_talk', label: 'Please Stay & Talk', speech: 'Please sit with me and talk, I like your company.', icon: '💬' },
      { id: 's_hand', label: 'Hold My Hand', speech: 'Please hold my hand.', icon: '🤝' },
      { id: 's_yes', label: 'Yes / Agree', speech: 'Yes, I agree.', icon: '✅' },
      { id: 's_no', label: 'No / Disagree', speech: 'No, I disagree or do not want that.', icon: '' },
      { id: 's_thanks', label: 'Thank You So Much', speech: 'Thank you very much for taking care of me.', icon: '🙏' },
      { id: 's_love', label: 'I Love You', speech: 'I love you so much.', icon: '❤️' }
    ]
  },
  {
    id: 'sos',
    label: 'Nurse Call / Emergency',
    speech: 'EMERGENCY! I need immediate help right now!',
    icon: <BellRing size={30} />,
    categoryTag: 'High Priority',
    colorVar: 'var(--aac-red)',
    subItems: [
      { id: 'sos_urgent', label: 'Urgent Nurse Bedside Call', speech: 'EMERGENCY! Caregiver, please come to the bed immediately!', icon: '🚨' },
      { id: 'sos_choke', label: 'Airway / Suction Needed', speech: 'I need suction or assistance clearing my airway!', icon: '⚠️' }
    ]
  }
];

export const DailyCommunication: React.FC<DailyCommunicationProps> = ({
  focusedIndex,
  isSubMenu,
  onEnterSubMenu,
  onExitSubMenu,
  triggerSelect,
  onSelectHandled,
  activeItemCount
}) => {
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number>(0);
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);

  // Compute active selectable items
  const currentItems = isSubMenu
    ? [
        { id: 'back', label: 'Back to Categories', speech: 'Returning to main categories menu.', icon: '⬅️' },
        ...(CATEGORIES[activeCategoryIndex]?.subItems || [])
      ]
    : CATEGORIES;

  useEffect(() => {
    activeItemCount(currentItems.length);
  }, [isSubMenu, activeCategoryIndex, currentItems.length, activeItemCount]);

  // Handle selection (Triple-blink trigger)
  useEffect(() => {
    if (!triggerSelect) return;

    if (!isSubMenu) {
      const chosenCategory = CATEGORIES[focusedIndex];
      if (chosenCategory) {
        if (chosenCategory.id === 'sos') {
          handleEmergencySOS();
        } else {
          setActiveCategoryIndex(focusedIndex);
          onEnterSubMenu();
          speechService.playSelectionTone();
          speechService.speak(`${chosenCategory.label} selected. Choose an option.`);
        }
      }
    } else {
      if (focusedIndex === 0) {
        onExitSubMenu();
        speechService.playSelectionTone();
      } else {
        const subItem = CATEGORIES[activeCategoryIndex]?.subItems?.[focusedIndex - 1];
        if (subItem) {
          triggerAction(CATEGORIES[activeCategoryIndex].id, subItem.label, subItem.speech);
        }
      }
    }

    onSelectHandled();
  }, [triggerSelect]);

  const handleEmergencySOS = async () => {
    speechService.playEmergencyAlarm();
    speechService.speak('EMERGENCY! Immediate assistance required at patient bed!');
    setSelectedNotification('EMERGENCY ALERT BROADCASTED TO ON-DUTY NURSE');

    const reqData: Partial<PatientRequestData> = {
      category: 'sos',
      label: 'EMERGENCY SOS',
      speechText: 'EMERGENCY! Immediate assistance required at patient bed!',
      urgency: 'emergency',
      triggerMethod: 'triple_blink'
    };

    await apiService.createRequest(reqData);
    setTimeout(() => setSelectedNotification(null), 6000);
  };

  const triggerAction = async (category: string, label: string, speechText: string) => {
    speechService.playSelectionTone();
    speechService.speak(speechText);
    setSelectedNotification(`Spoken & Logged: "${label}"`);

    const reqData: Partial<PatientRequestData> = {
      category: category as any,
      label,
      speechText,
      urgency: category === 'sos' || category === 'pain' ? 'urgent' : 'normal',
      triggerMethod: 'triple_blink'
    };

    await apiService.createRequest(reqData);
    setTimeout(() => setSelectedNotification(null), 4500);
  };

  return (
    <div className="w-full flex flex-col h-full">
      {/* Toast Confirmation */}
      {selectedNotification && (
        <div className="mb-3 py-2.5 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-500" />
            <span className="text-sm font-bold text-main">{selectedNotification}</span>
          </div>
          <span className="text-[11px] uppercase tracking-wider text-emerald-500 font-mono">Dispatched to Caregiver Feed</span>
        </div>
      )}

      {/* Breadcrumb Header when in Submenu */}
      {isSubMenu && (
        <div className="flex items-center justify-between mb-3 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
          <div className="flex items-center gap-2 text-xs md:text-sm font-medium">
            <button
              onClick={onExitSubMenu}
              className="text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft size={15} /> All Categories
            </button>
            <ChevronRight size={14} className="text-slate-500" />
            <span className="text-main font-bold">
              {CATEGORIES[activeCategoryIndex]?.label}
            </span>
          </div>

          <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
            Step: Select specific request or choose 'Back'
          </div>
        </div>
      )}

      {/* Main AAC Categories Grid */}
      {!isSubMenu ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 flex-1 items-stretch">
          {CATEGORIES.map((cat, idx) => {
            const isFocused = focusedIndex === idx;
            const isSOS = cat.id === 'sos';

            return (
              <div
                key={cat.id}
                className={`
                  aac-card p-4 md:p-5 flex flex-col items-start justify-between cursor-pointer
                  ${isSOS ? 'border-red-500/50 bg-red-950/20' : ''}
                  ${isFocused ? 'eye-focus-active' : ''}
                `}
                onClick={() => {
                  if (isSOS) handleEmergencySOS();
                  else {
                    setActiveCategoryIndex(idx);
                    onEnterSubMenu();
                  }
                }}
              >
                {/* Assistive Focus Badge */}
                {isFocused && (
                  <div className="assistive-focus-badge">
                    <span>{isSOS ? 'Triple-Blink to Call' : 'Triple-Blink to Open'}</span>
                  </div>
                )}

                {/* Top Row: Icon Container + AAC Classification Tag */}
                <div className="w-full flex items-center justify-between mb-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform"
                    style={{ 
                      backgroundColor: `${cat.colorVar}20`,
                      color: cat.colorVar,
                      border: `1.5px solid ${cat.colorVar}40`
                    }}
                  >
                    {cat.icon}
                  </div>

                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                    {idx + 1}. {cat.categoryTag}
                  </span>
                </div>

                {/* Middle: Content */}
                <div className="w-full text-left my-auto">
                  <h3 className={`text-base md:text-lg font-bold tracking-tight mb-1 ${isSOS ? 'text-red-500' : 'text-main'}`}>
                    {cat.label}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    "{cat.speech}"
                  </p>
                </div>

                {/* Bottom Row: Options Count & Interaction Prompt */}
                <div className="w-full pt-2.5 mt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>{cat.subItems ? `${cat.subItems.length} phrases` : 'Direct Call'}</span>
                  <span className="font-mono text-[11px] text-slate-400 font-medium">
                    {isFocused ? '3x Blink' : 'Item ' + (idx + 1)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Sub-Menu Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 flex-1 items-stretch">
          {currentItems.map((item: any, idx) => {
            const isFocused = focusedIndex === idx;
            const isBack = item.id === 'back';

            return (
              <div
                key={item.id}
                className={`
                  aac-card p-4 md:p-5 flex flex-col items-start justify-between cursor-pointer
                  ${isBack ? 'bg-slate-800/40 border-slate-700' : ''}
                  ${isFocused ? 'eye-focus-active' : ''}
                `}
                onClick={() => {
                  if (isBack) onExitSubMenu();
                  else triggerAction(CATEGORIES[activeCategoryIndex].id, item.label, item.speech);
                }}
              >
                {/* Assistive Focus Badge */}
                {isFocused && (
                  <div className="assistive-focus-badge">
                    <span>{isBack ? 'Triple-Blink: Back' : 'Triple-Blink: Speak'}</span>
                  </div>
                )}

                {/* Sub-item Icon & Tag */}
                <div className="w-full flex items-center justify-between mb-3">
                  <span className="text-3xl p-1 bg-slate-800/60 rounded-lg border border-slate-700/60">
                    {item.icon}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {isBack ? 'NAV' : `Option ${idx}`}
                  </span>
                </div>

                {/* Sub-item Text */}
                <div className="w-full text-left my-auto">
                  <h4 className="text-sm md:text-base font-bold text-main mb-1">
                    {item.label}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.speech}
                  </p>
                </div>

                {/* Footer Action Tag */}
                <div className="w-full pt-2.5 mt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Volume2 size={13} className="text-slate-400" />
                    Speech Audio
                  </span>
                  <span className="font-mono text-[11px] text-slate-400 font-medium">
                    {isFocused ? 'Ready' : `[${idx}]`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
