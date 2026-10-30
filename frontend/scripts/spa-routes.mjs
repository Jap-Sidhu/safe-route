// Static hosts only serve files that exist, so give each client-side route its own copy of
// index.html (e.g. dist/Map/index.html). Opening /Map directly then loads the app, and
// React Router renders the right page. 404.html covers anything else.
import { copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROUTES = ['Map', 'SafetyGuide', 'SafetyGuide/Wildfire', 'SafetyGuide/Earthquake'];
const dist = new URL('../dist/', import.meta.url).pathname;
const index = join(dist, 'index.html');

for (const route of ROUTES) {
  mkdirSync(join(dist, route), { recursive: true });
  copyFileSync(index, join(dist, route, 'index.html'));
}
copyFileSync(index, join(dist, '404.html'));
console.log(`SPA routes written: /${ROUTES.join(', /')}`);
