import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Trash2, Edit2, Locate, Wheat, Droplets, X, Save } from 'lucide-react';
import TopBar from '@/components/TopBar';
import GlassCard from '@/components/GlassCard';
import FloatingSection from '@/components/FloatingSection';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface FarmField {
  id: string;
  field_name: string;
  crop_name: string | null;
  area_acres: number | null;
  latitude: number | null;
  longitude: number | null;
  soil_type: string | null;
  irrigation_type: string | null;
  notes: string | null;
}

const emptyField = (): Partial<FarmField> => ({
  field_name: '',
  crop_name: '',
  area_acres: null,
  latitude: null,
  longitude: null,
  soil_type: '',
  irrigation_type: '',
  notes: '',
});

const FarmPortfolio = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [fields, setFields] = useState<FarmField[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editField, setEditField] = useState<Partial<FarmField> | null>(null);
  const [locating, setLocating] = useState(false);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [weather, setWeather] = useState<Record<string, { temp: number; desc: string }>>({});

  const fetchFields = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('farm_fields')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setFields(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchFields(); }, [fetchFields]);

  // Fetch weather for active field
  useEffect(() => {
    const field = fields.find(f => f.id === activeFieldId);
    if (!field?.latitude || !field?.longitude || weather[field.id]) return;
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${field.latitude}&longitude=${field.longitude}&current=temperature_2m,weathercode`)
      .then(r => r.json())
      .then(data => {
        setWeather(prev => ({
          ...prev,
          [field.id]: { temp: Math.round(data.current.temperature_2m), desc: getWeatherDesc(data.current.weathercode) },
        }));
      })
      .catch(() => {});
  }, [activeFieldId, fields]);

  const getWeatherDesc = (code: number) => {
    if (code <= 3) return '☀️ Clear';
    if (code <= 48) return '☁️ Cloudy';
    if (code <= 67) return '🌧️ Rain';
    if (code <= 77) return '❄️ Snow';
    return '⛈️ Storm';
  };

  const handleLocate = async () => {
    setLocating(true);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 })
      );
      setEditField(prev => ({
        ...prev,
        latitude: parseFloat(pos.coords.latitude.toFixed(6)),
        longitude: parseFloat(pos.coords.longitude.toFixed(6)),
      }));
      toast.success(t('common.success'));
    } catch {
      toast.error(t('common.error'));
    }
    setLocating(false);
  };

  const handleSave = async () => {
    if (!user || !editField?.field_name) return;
    const payload = {
      user_id: user.id,
      field_name: editField.field_name,
      crop_name: editField.crop_name || null,
      area_acres: editField.area_acres || null,
      latitude: editField.latitude || null,
      longitude: editField.longitude || null,
      soil_type: editField.soil_type || null,
      irrigation_type: editField.irrigation_type || null,
      notes: editField.notes || null,
    };

    if (editField.id) {
      await supabase.from('farm_fields').update(payload).eq('id', editField.id);
    } else {
      await supabase.from('farm_fields').insert(payload);
    }
    toast.success(t('common.success'));
    setShowForm(false);
    setEditField(null);
    fetchFields();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('farm_fields').delete().eq('id', id);
    toast.success(t('common.success'));
    fetchFields();
  };

  const soilTypes = ['Clay', 'Loam', 'Sandy', 'Silt', 'Red', 'Black', 'Laterite'];
  const irrigationTypes = ['Drip', 'Sprinkler', 'Canal', 'Well', 'Rain-fed'];

  return (
    <div className="ether-bg pb-20">
      <TopBar />
      <main className="px-4 py-4 max-w-lg mx-auto space-y-5">
        <FloatingSection index={0} float="none">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">🌾 Farm Portfolio</h2>
            <motion.button
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setEditField(emptyField()); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
            >
              <Plus size={18} /> Add Field
            </motion.button>
          </div>
        </FloatingSection>

        {loading ? (
          <FloatingSection index={1}><p className="text-center text-muted-foreground">{t('common.loading')}</p></FloatingSection>
        ) : fields.length === 0 ? (
          <FloatingSection index={1}>
            <GlassCard className="text-center py-12">
              <MapPin size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No fields yet. Tap "Add Field" to start mapping your farm.</p>
            </GlassCard>
          </FloatingSection>
        ) : (
          fields.map((field, i) => (
            <FloatingSection key={field.id} index={i + 1} float="slow">
              <GlassCard
                onClick={() => setActiveFieldId(prev => prev === field.id ? null : field.id)}
                className="relative"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-lg">{field.field_name}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {field.crop_name && (
                        <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                          <Wheat size={12} /> {field.crop_name}
                        </span>
                      )}
                      {field.area_acres && (
                        <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent font-mono">
                          {field.area_acres} acres
                        </span>
                      )}
                      {field.soil_type && (
                        <span className="text-xs px-2 py-1 rounded-full bg-earth/10 text-earth">
                          {field.soil_type}
                        </span>
                      )}
                      {field.irrigation_type && (
                        <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-secondary/10 text-secondary">
                          <Droplets size={12} /> {field.irrigation_type}
                        </span>
                      )}
                    </div>
                    {field.latitude && field.longitude && (
                      <p className="text-[11px] text-muted-foreground mt-2 font-mono">
                        📍 {field.latitude}, {field.longitude}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <motion.button
                      whileHover={{ y: -3 }}
                      onClick={(e) => { e.stopPropagation(); setEditField(field); setShowForm(true); }}
                      className="p-2 rounded-lg hover:bg-muted/50"
                    >
                      <Edit2 size={16} className="text-muted-foreground" />
                    </motion.button>
                    <motion.button
                      whileHover={{ y: -3 }}
                      onClick={(e) => { e.stopPropagation(); handleDelete(field.id); }}
                      className="p-2 rounded-lg hover:bg-destructive/10"
                    >
                      <Trash2 size={16} className="text-destructive" />
                    </motion.button>
                  </div>
                </div>

                {/* Contextual weather when expanded */}
                <AnimatePresence>
                  {activeFieldId === field.id && weather[field.id] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 pt-3 border-t border-border/30"
                    >
                      <p className="text-sm text-foreground">
                        {weather[field.id].desc} &nbsp;
                        <span className="font-mono font-semibold">{weather[field.id].temp}°C</span>
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            </FloatingSection>
          ))
        )}
      </main>

      {/* Add/Edit Field Modal */}
      <AnimatePresence>
        {showForm && editField && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => { setShowForm(false); setEditField(null); }}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg max-h-[85vh] overflow-y-auto glass-card-solid p-5 mx-4 mb-4 sm:mb-0 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-foreground">
                  {editField.id ? 'Edit Field' : 'Add New Field'}
                </h3>
                <button onClick={() => { setShowForm(false); setEditField(null); }}>
                  <X size={20} className="text-muted-foreground" />
                </button>
              </div>

              <input
                placeholder="Field Name (e.g. North Acre - Rice)"
                value={editField.field_name || ''}
                onChange={e => setEditField(p => ({ ...p, field_name: e.target.value }))}
                className="w-full p-3 rounded-xl bg-muted/50 border border-border/40 text-foreground"
              />
              <input
                placeholder="Crop (e.g. Wheat, Tomato)"
                value={editField.crop_name || ''}
                onChange={e => setEditField(p => ({ ...p, crop_name: e.target.value }))}
                className="w-full p-3 rounded-xl bg-muted/50 border border-border/40 text-foreground"
              />
              <input
                type="number"
                placeholder="Area (acres)"
                value={editField.area_acres ?? ''}
                onChange={e => setEditField(p => ({ ...p, area_acres: e.target.value ? parseFloat(e.target.value) : null }))}
                className="w-full p-3 rounded-xl bg-muted/50 border border-border/40 text-foreground"
              />

              {/* GPS */}
              <div className="flex gap-2">
                <input
                  type="number"
                  step="any"
                  placeholder="Latitude"
                  value={editField.latitude ?? ''}
                  onChange={e => setEditField(p => ({ ...p, latitude: e.target.value ? parseFloat(e.target.value) : null }))}
                  className="flex-1 p-3 rounded-xl bg-muted/50 border border-border/40 text-foreground font-mono text-sm"
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Longitude"
                  value={editField.longitude ?? ''}
                  onChange={e => setEditField(p => ({ ...p, longitude: e.target.value ? parseFloat(e.target.value) : null }))}
                  className="flex-1 p-3 rounded-xl bg-muted/50 border border-border/40 text-foreground font-mono text-sm"
                />
                <motion.button
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLocate}
                  disabled={locating}
                  className="p-3 rounded-xl bg-primary text-primary-foreground"
                >
                  <Locate size={18} className={locating ? 'animate-spin' : ''} />
                </motion.button>
              </div>

              {/* Soil & Irrigation */}
              <select
                value={editField.soil_type || ''}
                onChange={e => setEditField(p => ({ ...p, soil_type: e.target.value }))}
                className="w-full p-3 rounded-xl bg-muted/50 border border-border/40 text-foreground"
              >
                <option value="">Soil Type</option>
                {soilTypes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={editField.irrigation_type || ''}
                onChange={e => setEditField(p => ({ ...p, irrigation_type: e.target.value }))}
                className="w-full p-3 rounded-xl bg-muted/50 border border-border/40 text-foreground"
              >
                <option value="">Irrigation Type</option>
                {irrigationTypes.map(i => <option key={i} value={i}>{i}</option>)}
              </select>

              <textarea
                placeholder="Notes..."
                value={editField.notes || ''}
                onChange={e => setEditField(p => ({ ...p, notes: e.target.value }))}
                className="w-full p-3 rounded-xl bg-muted/50 border border-border/40 text-foreground min-h-[80px]"
              />

              <motion.button
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={!editField.field_name}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save size={18} /> {t('common.save')}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FarmPortfolio;
