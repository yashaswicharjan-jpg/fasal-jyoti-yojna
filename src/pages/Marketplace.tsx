import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Plus, Package, Truck, CheckCircle2,
  X, Search, Filter, IndianRupee, Calendar, MapPin, Store,
} from 'lucide-react';
import TopBar from '@/components/TopBar';
import GlassCard from '@/components/GlassCard';
import FloatingSection from '@/components/FloatingSection';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type Tab = 'browse' | 'my_listings' | 'orders';

interface Listing {
  id: string;
  user_id: string;
  crop_name: string;
  quantity_kg: number;
  price_per_kg: number;
  harvest_date: string | null;
  description: string | null;
  image_url: string | null;
  status: string;
  location: string | null;
  created_at: string;
  profiles?: { full_name: string; location_village: string | null } | null;
}

interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  quantity_kg: number;
  total_price: number;
  status: string;
  created_at: string;
  produce_listings?: { crop_name: string; image_url: string | null } | null;
}

const statusSteps = ['placed', 'confirmed', 'pickup_scheduled', 'in_transit', 'delivered'];
const statusIcons: Record<string, typeof Package> = {
  placed: ShoppingCart,
  confirmed: CheckCircle2,
  pickup_scheduled: Package,
  in_transit: Truck,
  delivered: CheckCircle2,
};
const statusLabels: Record<string, string> = {
  placed: 'Order Placed',
  confirmed: 'Farmer Confirmed',
  pickup_scheduled: 'Pickup Scheduled',
  in_transit: 'In Transit',
  delivered: 'Delivered',
};

const Marketplace = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('browse');
  const [listings, setListings] = useState<Listing[]>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddListing, setShowAddListing] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState<Listing | null>(null);
  const [orderQty, setOrderQty] = useState('');
  const [newListing, setNewListing] = useState({
    crop_name: '', quantity_kg: '', price_per_kg: '', harvest_date: '', description: '', location: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    // Browse all available listings
    const { data: all } = await supabase
      .from('produce_listings')
      .select('*')
      .eq('status', 'available')
      .order('created_at', { ascending: false });
    setListings(all || []);

    if (user) {
      const { data: mine } = await supabase
        .from('produce_listings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setMyListings(mine || []);

      const { data: buyerOrders } = await supabase
        .from('orders')
        .select('*, produce_listings(crop_name, image_url)')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      const { data: sellerOrders } = await supabase
        .from('orders')
        .select('*, produce_listings(crop_name, image_url)')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      const allOrders = [...(buyerOrders || []), ...(sellerOrders || [])];
      const unique = Array.from(new Map(allOrders.map(o => [o.id, o])).values());
      setOrders(unique);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddListing = async () => {
    if (!user || !newListing.crop_name || !newListing.quantity_kg || !newListing.price_per_kg) return;
    await supabase.from('produce_listings').insert({
      user_id: user.id,
      crop_name: newListing.crop_name,
      quantity_kg: parseFloat(newListing.quantity_kg),
      price_per_kg: parseFloat(newListing.price_per_kg),
      harvest_date: newListing.harvest_date || null,
      description: newListing.description || null,
      location: newListing.location || null,
    });
    toast.success('Listing added!');
    setShowAddListing(false);
    setNewListing({ crop_name: '', quantity_kg: '', price_per_kg: '', harvest_date: '', description: '', location: '' });
    fetchData();
  };

  const handlePlaceOrder = async () => {
    if (!user || !showOrderModal || !orderQty) return;
    const qty = parseFloat(orderQty);
    const total = qty * showOrderModal.price_per_kg;
    await supabase.from('orders').insert({
      buyer_id: user.id,
      seller_id: showOrderModal.user_id,
      listing_id: showOrderModal.id,
      quantity_kg: qty,
      total_price: total,
    });
    toast.success('Order placed!');
    setShowOrderModal(null);
    setOrderQty('');
    fetchData();
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    toast.success(`Status updated to ${statusLabels[newStatus]}`);
    fetchData();
  };

  const filteredListings = listings.filter(l =>
    l.crop_name.toLowerCase().includes(search.toLowerCase()) ||
    l.location?.toLowerCase().includes(search.toLowerCase())
  );

  const tabs: { key: Tab; label: string; icon: typeof Store }[] = [
    { key: 'browse', label: '🛒 Fresh from Farm', icon: Store },
    { key: 'my_listings', label: '📦 My Listings', icon: Package },
    { key: 'orders', label: '🚚 Orders', icon: Truck },
  ];

  return (
    <div className="ether-bg pb-20">
      <TopBar />
      <main className="px-4 py-4 max-w-lg mx-auto space-y-5">
        <FloatingSection index={0} float="none">
          <h2 className="text-2xl font-bold text-foreground">🌿 Krishi Market</h2>
          <p className="text-sm text-muted-foreground">Farm-to-table, direct from farmers</p>
        </FloatingSection>

        {/* Tabs */}
        <FloatingSection index={1} float="none">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {tabs.map(tb => (
              <motion.button
                key={tb.key}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTab(tb.key)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  tab === tb.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                {tb.label}
              </motion.button>
            ))}
          </div>
        </FloatingSection>

        {/* Browse Tab */}
        {tab === 'browse' && (
          <>
            <FloatingSection index={2} float="none">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search crops or location..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/50 border border-border/40 text-foreground"
                />
              </div>
            </FloatingSection>

            {loading ? (
              <p className="text-center text-muted-foreground py-8">{t('common.loading')}</p>
            ) : filteredListings.length === 0 ? (
              <GlassCard className="text-center py-12">
                <Store size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No produce available yet.</p>
              </GlassCard>
            ) : (
              filteredListings.map((listing, i) => (
                <FloatingSection key={listing.id} index={i + 3} float="slow">
                  <GlassCard>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground text-lg">{listing.crop_name}</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-mono">
                            <IndianRupee size={11} />{listing.price_per_kg}/kg
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent font-mono">
                            {listing.quantity_kg} kg
                          </span>
                          {listing.harvest_date && (
                            <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                              <Calendar size={11} /> {listing.harvest_date}
                            </span>
                          )}
                          {listing.location && (
                            <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-earth/10 text-earth">
                              <MapPin size={11} /> {listing.location}
                            </span>
                          )}
                        </div>
                        {listing.description && (
                          <p className="text-sm text-muted-foreground mt-2">{listing.description}</p>
                        )}
                      </div>
                    </div>
                    {listing.user_id !== user?.id && (
                      <motion.button
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setShowOrderModal(listing); setOrderQty(''); }}
                        className="mt-3 w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <ShoppingCart size={16} /> Buy Now
                      </motion.button>
                    )}
                  </GlassCard>
                </FloatingSection>
              ))
            )}
          </>
        )}

        {/* My Listings Tab */}
        {tab === 'my_listings' && (
          <>
            <FloatingSection index={2} float="none">
              <motion.button
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddListing(true)}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2"
              >
                <Plus size={18} /> List Yield for Sale
              </motion.button>
            </FloatingSection>

            {myListings.length === 0 ? (
              <GlassCard className="text-center py-12">
                <Package size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">You haven't listed any produce yet.</p>
              </GlassCard>
            ) : (
              myListings.map((listing, i) => (
                <FloatingSection key={listing.id} index={i + 3} float="slow">
                  <GlassCard>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{listing.crop_name}</h3>
                        <p className="text-sm text-muted-foreground font-mono">
                          ₹{listing.price_per_kg}/kg · {listing.quantity_kg} kg
                        </p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        listing.status === 'available'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {listing.status}
                      </span>
                    </div>
                  </GlassCard>
                </FloatingSection>
              ))
            )}
          </>
        )}

        {/* Orders Tab */}
        {tab === 'orders' && (
          <>
            {orders.length === 0 ? (
              <GlassCard className="text-center py-12">
                <Truck size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No orders yet.</p>
              </GlassCard>
            ) : (
              orders.map((order, i) => {
                const isSeller = order.seller_id === user?.id;
                const currentStep = statusSteps.indexOf(order.status);
                const nextStatus = statusSteps[currentStep + 1];

                return (
                  <FloatingSection key={order.id} index={i + 2} float="slow">
                    <GlassCard>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-foreground">
                          {order.produce_listings?.crop_name || 'Order'}
                        </h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent font-mono">
                          ₹{order.total_price}
                        </span>
                      </div>

                      {/* Status pipeline */}
                      <div className="flex items-center gap-1 mb-3 overflow-x-auto scrollbar-hide">
                        {statusSteps.map((step, si) => {
                          const Icon = statusIcons[step];
                          const active = si <= currentStep;
                          return (
                            <div key={step} className="flex items-center">
                              <div className={`flex flex-col items-center ${active ? 'text-primary' : 'text-muted-foreground/40'}`}>
                                <Icon size={16} />
                                <span className="text-[9px] mt-0.5 whitespace-nowrap">{statusLabels[step]}</span>
                              </div>
                              {si < statusSteps.length - 1 && (
                                <div className={`w-6 h-0.5 mx-1 ${si < currentStep ? 'bg-primary' : 'bg-muted-foreground/20'}`} />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <p className="text-xs text-muted-foreground font-mono">
                        {order.quantity_kg} kg · {isSeller ? 'You are selling' : 'You are buying'}
                      </p>

                      {isSeller && nextStatus && order.status !== 'delivered' && (
                        <motion.button
                          whileHover={{ y: -3 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleUpdateOrderStatus(order.id, nextStatus)}
                          className="mt-3 w-full py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium"
                        >
                          Mark as: {statusLabels[nextStatus]}
                        </motion.button>
                      )}
                    </GlassCard>
                  </FloatingSection>
                );
              })
            )}
          </>
        )}
      </main>

      {/* Add Listing Modal */}
      <AnimatePresence>
        {showAddListing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowAddListing(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg glass-card-solid p-5 mx-4 mb-4 sm:mb-0 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-foreground">📦 List Yield for Sale</h3>
                <button onClick={() => setShowAddListing(false)}>
                  <X size={20} className="text-muted-foreground" />
                </button>
              </div>
              <input placeholder="Crop Name *" value={newListing.crop_name} onChange={e => setNewListing(p => ({ ...p, crop_name: e.target.value }))} className="w-full p-3 rounded-xl bg-muted/50 border border-border/40 text-foreground" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Quantity (kg) *" value={newListing.quantity_kg} onChange={e => setNewListing(p => ({ ...p, quantity_kg: e.target.value }))} className="p-3 rounded-xl bg-muted/50 border border-border/40 text-foreground" />
                <input type="number" placeholder="Price/kg (₹) *" value={newListing.price_per_kg} onChange={e => setNewListing(p => ({ ...p, price_per_kg: e.target.value }))} className="p-3 rounded-xl bg-muted/50 border border-border/40 text-foreground" />
              </div>
              <input type="date" placeholder="Harvest Date" value={newListing.harvest_date} onChange={e => setNewListing(p => ({ ...p, harvest_date: e.target.value }))} className="w-full p-3 rounded-xl bg-muted/50 border border-border/40 text-foreground" />
              <input placeholder="Location (e.g. Pune, Maharashtra)" value={newListing.location} onChange={e => setNewListing(p => ({ ...p, location: e.target.value }))} className="w-full p-3 rounded-xl bg-muted/50 border border-border/40 text-foreground" />
              <textarea placeholder="Description (optional)" value={newListing.description} onChange={e => setNewListing(p => ({ ...p, description: e.target.value }))} className="w-full p-3 rounded-xl bg-muted/50 border border-border/40 text-foreground min-h-[80px]" />
              <motion.button
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleAddListing}
                disabled={!newListing.crop_name || !newListing.quantity_kg || !newListing.price_per_kg}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50"
              >
                List Produce
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Place Order Modal */}
      <AnimatePresence>
        {showOrderModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowOrderModal(null)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg glass-card-solid p-5 mx-4 mb-4 sm:mb-0 space-y-4"
            >
              <h3 className="font-bold text-lg text-foreground">
                🛒 Buy {showOrderModal.crop_name}
              </h3>
              <p className="text-sm text-muted-foreground">
                Price: <span className="font-mono text-foreground">₹{showOrderModal.price_per_kg}/kg</span>
                &nbsp;·&nbsp;Available: <span className="font-mono text-foreground">{showOrderModal.quantity_kg} kg</span>
              </p>
              <input
                type="number"
                placeholder="Quantity (kg)"
                value={orderQty}
                onChange={e => setOrderQty(e.target.value)}
                max={showOrderModal.quantity_kg}
                className="w-full p-3 rounded-xl bg-muted/50 border border-border/40 text-foreground"
              />
              {orderQty && (
                <p className="text-sm font-medium text-foreground">
                  Total: <span className="font-mono text-primary">₹{(parseFloat(orderQty) * showOrderModal.price_per_kg).toFixed(2)}</span>
                </p>
              )}
              <motion.button
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.97 }}
                onClick={handlePlaceOrder}
                disabled={!orderQty || parseFloat(orderQty) <= 0}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ShoppingCart size={18} /> Place Order
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Marketplace;
