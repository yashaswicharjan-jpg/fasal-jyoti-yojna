import { create } from 'zustand';

interface ConnectionInfo {
  isOnline: boolean;
  effectiveType: string | null;
  isSlowConnection: boolean;
}

interface ConnectivityState extends ConnectionInfo {
  updateStatus: () => void;
}

const getConnectionInfo = (): ConnectionInfo => {
  const nav = navigator as any;
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

  return {
    isOnline: navigator.onLine,
    effectiveType: conn?.effectiveType || null,
    isSlowConnection:
      !navigator.onLine ||
      conn?.effectiveType === '2g' ||
      conn?.effectiveType === 'slow-2g',
  };
};

export const useConnectivity = create<ConnectivityState>((set) => ({
  ...getConnectionInfo(),
  updateStatus: () => set(getConnectionInfo()),
}));

// Auto-update on connection changes
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => useConnectivity.getState().updateStatus());
  window.addEventListener('offline', () => useConnectivity.getState().updateStatus());

  const nav = navigator as any;
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
  if (conn) {
    conn.addEventListener('change', () => useConnectivity.getState().updateStatus());
  }
}
