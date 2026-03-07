// Hauler CRUD Management - localStorage based, global access

export interface Hauler {
  id: string;
  name: string;
  route: string;
  retase: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  timestamp: string;
  message: string;
}

export interface HaulerStatistics {
  totalHaulers: number;
  totalRetase: number;
  averageRetase: number;
}

const HAULERS_KEY = 'haulers_global';
const HAULERS_BACKUP_KEY = 'haulers_backup_global';
const ACTIVITY_LOG_KEY = 'hauler_activity_log';

// Load haulers from localStorage
export function loadHaulers(): Hauler[] {
  if (typeof window === 'undefined') return [];

  const haulers = localStorage.getItem(HAULERS_KEY);
  const backupHaulers = localStorage.getItem(HAULERS_BACKUP_KEY);

  if (!haulers && !backupHaulers) {
    return [];
  }

  const data = haulers ? JSON.parse(haulers) : JSON.parse(backupHaulers!);

  // Restore backup to primary if needed
  if (backupHaulers && !haulers) {
    saveHaulers(data);
  }

  return data;
}

// Save haulers to localStorage with backup
export function saveHaulers(haulers: Hauler[]): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(HAULERS_KEY, JSON.stringify(haulers));
  localStorage.setItem(HAULERS_BACKUP_KEY, JSON.stringify(haulers));
}

// Create new hauler
export function createHauler(data: { name: string; route: string; retase?: number }): Hauler {
  const haulers = loadHaulers();

  const newHauler: Hauler = {
    id: 'hauler_' + Date.now(),
    name: data.name,
    route: data.route,
    retase: data.retase || 0,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  haulers.push(newHauler);
  saveHaulers(haulers);
  addActivityLog(`${newHauler.name} ditambahkan (${newHauler.route})`);

  return newHauler;
}

// Update existing hauler
export function updateHauler(id: string, updates: Partial<Hauler>): Hauler | null {
  const haulers = loadHaulers();
  const index = haulers.findIndex((h) => h.id === id);

  if (index === -1) return null;

  haulers[index] = {
    ...haulers[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveHaulers(haulers);
  addActivityLog(`${haulers[index].name} diperbarui`);

  return haulers[index];
}

// Delete hauler
export function deleteHauler(id: string): boolean {
  const haulers = loadHaulers();
  const index = haulers.findIndex((h) => h.id === id);

  if (index === -1) return false;

  const haulerName = haulers[index].name;
  haulers.splice(index, 1);
  saveHaulers(haulers);
  addActivityLog(`${haulerName} dihapus`);

  return true;
}

// Increment retase
export function incrementRetase(id: string): Hauler | null {
  const haulers = loadHaulers();
  const hauler = haulers.find((h) => h.id === id);

  if (!hauler) return null;

  hauler.retase++;
  hauler.updatedAt = new Date().toISOString();
  saveHaulers(haulers);
  addActivityLog(`${hauler.name} +1 retase (total: ${hauler.retase})`);

  return hauler;
}

// Decrement retase
export function decrementRetase(id: string): Hauler | null {
  const haulers = loadHaulers();
  const hauler = haulers.find((h) => h.id === id);

  if (!hauler || hauler.retase <= 0) return null;

  hauler.retase--;
  hauler.updatedAt = new Date().toISOString();
  saveHaulers(haulers);
  addActivityLog(`${hauler.name} -1 retase (total: ${hauler.retase})`);

  return hauler;
}

// Get statistics
export function getStatistics(): HaulerStatistics {
  const haulers = loadHaulers();
  const totalHaulers = haulers.length;
  const totalRetase = haulers.reduce((sum, h) => sum + h.retase, 0);
  const averageRetase = totalHaulers > 0 ? totalRetase / totalHaulers : 0;

  return {
    totalHaulers,
    totalRetase,
    averageRetase,
  };
}

// Get unique routes
export function getRoutes(): string[] {
  const haulers = loadHaulers();
  const routes = new Set(haulers.map((h) => h.route).filter(Boolean));
  return Array.from(routes);
}

// Activity Log functions
export function getActivityLog(): ActivityLog[] {
  if (typeof window === 'undefined') return [];

  const log = localStorage.getItem(ACTIVITY_LOG_KEY);
  return log ? JSON.parse(log) : [];
}

export function addActivityLog(message: string): void {
  if (typeof window === 'undefined') return;

  const logs = getActivityLog();
  const timestamp = new Date().toLocaleTimeString('id-ID', {
    timeZone: 'Asia/Makassar',
    hour: '2-digit',
    minute: '2-digit',
  });

  logs.unshift({ timestamp, message });

  // Keep only last 20 logs
  const trimmedLogs = logs.slice(0, 20);
  localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(trimmedLogs));
}

export function clearActivityLog(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACTIVITY_LOG_KEY);
}

// Generate WhatsApp resi text
export function generateWhatsAppResi(): string {
  const haulers = loadHaulers();
  const stats = getStatistics();

  const today = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Group haulers by route
  const groupedByRoute: Record<string, Hauler[]> = {};
  haulers.forEach((h) => {
    const route = h.route || 'Tanpa Rute';
    if (!groupedByRoute[route]) {
      groupedByRoute[route] = [];
    }
    groupedByRoute[route].push(h);
  });

  let resi = `📋 REKAP HAULER\nTanggal: ${today}\n\n`;

  Object.entries(groupedByRoute).forEach(([route, routeHaulers]) => {
    resi += `📍 Rute: ${route}\n`;
    routeHaulers.forEach((h) => {
      resi += `🚛 ${h.name}: ${h.retase} retase\n`;
    });
    resi += '\n';
  });

  resi += `━━━━━━━━━━━━━━━━\nTotal: ${stats.totalHaulers} hauler | ${stats.totalRetase} retase`;

  return resi;
}

// Share to WhatsApp
export function shareToWhatsApp(): void {
  const resi = generateWhatsAppResi();
  const encodedText = encodeURIComponent(resi);
  window.open(`https://wa.me/?text=${encodedText}`, '_blank');
}

// Check if hauler name already exists
export function isHaulerNameExists(name: string, excludeId?: string): boolean {
  const haulers = loadHaulers();
  return haulers.some(
    (h) => h.name.toLowerCase() === name.toLowerCase() && h.id !== excludeId
  );
}
