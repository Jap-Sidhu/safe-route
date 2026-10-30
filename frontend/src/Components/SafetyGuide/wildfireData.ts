// types specific to wildfire content
export interface AlertItem {
  type: string;
  action: string;
}

export interface WildfireContent {
  alerts: AlertItem[];
  preparation: string[];
  evacuation: string[];
  shelter: string[];
  hiking: string[];
}

export interface WildfireContentProps {
  content: WildfireContent;
}

// wildfire data
export const wildfireData: WildfireContent = {
  alerts: [
    { type: 'Evacuation Order', action: 'You must leave immediately. Follow official evacuation routes.' },
    { type: 'Evacuation Alert', action: 'Be ready to leave on short notice' }
  ],
  preparation: [
    'Keep vehicle fueled and ready',
    'Have emergency kit prepared',
    'Stock 1 month medication supply',
    'Keep important records safe',
    'Prepare backup power sources',
    'Have battery-powered radio'
  ],
  evacuation: [
    'Follow local officials instructions and routes',
    'Monitor radio/local news for updates',
    'Park vehicle facing forward, out of driveway',
    'Keep vehicle packed and ready'
  ],
  shelter: [
    'Move flammable materials away from house',
    'Close all windows and doors',
    'Seal entry points: vents, cracks, under doors',
    'Use wet rags to seal gaps',
    'Set HVAC to recirculate',
    'Use HEPA air purifier if available',
    'Wear N95, KN96, or KF94 mask outside'
  ],
  hiking: [
    'Check wildfire risks before going',
    'Inform others of your route/plans',
    'Wear natural fiber clothing (cotton, wool)',
    'Carry first-aid kit and emergency supplies',
    'Obey fire bans and local warnings',
    'Use designated fire pits only'
  ]
};
