import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Landmark, ClipboardList } from 'lucide-react';
import SchemesBrowser from './SchemesBrowser';
import MyApplications from './MyApplications';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'schemes' | 'applications'>('schemes');

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-foreground/50 md:hidden"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 bottom-0 z-[70] w-[85vw] md:w-[320px] bg-card flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌿</span>
                <span className="font-bold text-foreground text-lg">{t('app_name')}</span>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                <X size={18} className="text-foreground" />
              </button>
            </div>

            {/* Tab pills */}
            <div className="flex gap-2 p-4 pb-2">
              {[
                { id: 'schemes' as const, icon: Landmark, label: t('sidebar.govt_schemes') },
                { id: 'applications' as const, icon: ClipboardList, label: t('sidebar.my_applications') },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-semibold transition-all min-h-[40px] ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'schemes' ? <SchemesBrowser /> : <MyApplications />}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-border text-center">
              <p className="text-[10px] text-muted-foreground">v2.0 · Krishi Sahayak</p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
