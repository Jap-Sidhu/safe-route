import React from 'react';
import { Shield } from 'lucide-react';

// types specific to earthquake content
export interface ActionItem {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface SituationItem {
  title: string;
  steps: string[];
}

export interface EarthquakeContent {
  signs: string[];
  actions: ActionItem[];
  situations: SituationItem[];
}

export interface EarthquakeContentProps {
  content: EarthquakeContent;
}

// earthquake data
export const earthquakeData: EarthquakeContent = {
  signs: ['Rumbling sounds', 'Loud bangs', 'Shaking ground', 'Emergency alerts'],
  actions: [
    {
      title: 'DROP',
      description: 'Get down on your hands and knees to prevent falling',
      icon: Shield
    },
    {
      title: 'COVER',
      description: 'Protect neck and head using arms, hands, or anything available',
      icon: Shield
    },
    {
      title: 'HOLD ON',
      description: 'Hold onto your shelter and neck until shaking stops',
      icon: Shield
    }
  ],
  situations: [
    {
      title: 'Wheelchair Users',
      steps: ['Lock wheels', 'Cover head and neck with arms', 'Stay in place until shaking stops']
    },
    {
      title: 'Shore/Beach',
      steps: ['Follow Drop, Cover, Hold procedure', 'After shaking ends, immediately move to high ground due to tsunami risks']
    },
    {
      title: 'Outdoors',
      steps: ['Drop, cover, and hold', 'If safe: Move away from buildings, power lines and trees to open area']
    },
    {
      title: 'Indoors',
      steps: ['Drop, cover, and hold', 'Stay in bed if already there (use pillow/blanket)', 'Move away from glass/windows', 'Shield from flying/falling objects']
    },
    {
      title: 'In a Car',
      steps: ['Pull over, stop, set handbrake', 'Avoid bridges, signs, powerlines', 'Stay inside until shaking ends', 'If powerline falls on car, wait for emergency help']
    }
  ]
};