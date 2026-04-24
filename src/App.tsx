import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  isWithinInterval,
  isAfter,
  isBefore,
  startOfDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Hotel, 
  LogOut, 
  Plus, 
  Search, 
  User, 
  Users,
  LayoutGrid,
  Calendar,
  Clock,
  ArrowRightLeft,
  Trash2,
  X,
  CreditCard,
  Mail,
  AlertCircle,
  Package,
  Coffee,
  ShoppingCart,
  DollarSign,
  ChevronRight,
  PlusCircle,
  MinusCircle,
  BedDouble,
  BarChart3,
  ArrowUpCircle,
  ArrowDownCircle,
  CheckCircle2,
  Settings,
  ListFilter,
  FileText,
  CalendarDays,
  CalendarPlus,
  ArrowRight,
  UserPlus
} from 'lucide-react';
import { Guest, Room, Booking, AuthState, InventoryItem, RoomType, ItemCategory, Charge, Transaction, AppUser, UserRole } from './types.ts';

export default function App() {
  const [auth, setAuth] = useState<AuthState>({ isAuthenticated: false, user: null });
  const [view, setView] = useState<'map' | 'guests' | 'inventory' | 'bookings' | 'finance' | 'users' | 'calendar' | 'booking-history' | 'occupancy'>('map');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showReservationForm, setShowReservationForm] = useState<string | null>(null); // roomId
  const [reservationData, setReservationData] = useState({
    guestId: '',
    checkIn: format(new Date(), 'yyyy-MM-dd'),
    checkOut: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    adults: 1,
    children: 0,
  });

  const getRoomCapacity = (type: RoomType) => {
    switch(type) {
      case 'single': return 1;
      case 'double': 
      case 'couple': return 2;
      case 'triple': return 3;
      default: return 2;
    }
  };

  const handleReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReservationForm) return;

    const room = rooms.find(r => r.id === showReservationForm);
    const start = new Date(reservationData.checkIn);
    const end = new Date(reservationData.checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (editingReservationId) {
      setBookings(bookings.map(b => b.id === editingReservationId ? {
        ...b,
        guestId: reservationData.guestId,
        checkIn: start.getTime(),
        checkOut: end.getTime(),
        basePrice: (room?.pricePerNight || 0) * diffDays,
        adults: reservationData.adults,
        children: reservationData.children,
      } : b));
    } else {
      const booking: Booking = {
        id: Math.random().toString(36).substring(2, 9),
        roomId: showReservationForm,
        guestId: reservationData.guestId,
        checkIn: start.getTime(),
        checkOut: end.getTime(),
        basePrice: (room?.pricePerNight || 0) * diffDays,
        charges: [],
        status: 'reserved',
        adults: reservationData.adults,
        children: reservationData.children,
        registeredBy: auth.user?.name || 'Unknown'
      };
      setBookings([booking, ...bookings]);
    }
    
    setShowReservationForm(null);
    setEditingReservationId(null);
    setGuestSearchTerm('');
  };

  const cancelReservation = (id: string) => {
    setBookings(bookings.map(b => b.id === id ? { ...b, status: 'canceled' } : b));
    setShowReservationForm(null);
    setEditingReservationId(null);
    setGuestSearchTerm('');
  };
  
  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getBookingForRoomAndDate = (roomId: string, date: Date) => {
    return bookings.find(b => 
      b.roomId === roomId && 
      (b.status === 'active' || b.status === 'reserved') &&
      isWithinInterval(startOfDay(date), { 
        start: startOfDay(new Date(b.checkIn)), 
        end: startOfDay(new Date(b.checkOut)) 
      })
    );
  };
  const [users, setUsers] = useState<AppUser[]>([
    { id: '1', name: 'Administrador', username: 'admin', password: '123', role: 'admin' },
    { id: '2', name: 'Recepcionista', username: 'recep', password: '123', role: 'receptionist' }
  ]);
  
  const [roomCategories, setRoomCategories] = useState<{ value: RoomType; label: string; price: number }[]>([
    { value: 'single', label: 'Solteiro', price: 150 },
    { value: 'double', label: 'Duplo', price: 250 },
    { value: 'couple', label: 'Casal', price: 220 },
    { value: 'triple', label: 'Triplo', price: 350 },
  ]);

  const [rooms, setRooms] = useState<Room[]>(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: (i + 1).toString(),
      number: (i + 1).toString().padStart(2, '0'),
      type: 'couple',
      pricePerNight: 220,
      status: 'vago'
    }));
  });
  
  const [guests, setGuests] = useState<Guest[]>([
    { id: 'g1', name: 'João Silva', cpf: '123.456.789-00', birthDate: '1990-01-01', email: 'joao@example.com' }
  ]);
  const [editingReservationId, setEditingReservationId] = useState<string | null>(null);
  const [editingInventoryItem, setEditingInventoryItem] = useState<InventoryItem | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: 'i1', name: 'Água Mineral 500ml', category: 'beverage', price: 5, stock: 50 },
    { id: 'i2', name: 'Cerveja Lata 350ml', category: 'beverage', price: 8, stock: 24 },
    { id: 'i3', name: 'Refrigerante Lata 350ml', category: 'beverage', price: 6, stock: 30 },
    { id: 'i4', name: 'Chocolate Barra', category: 'food', price: 10, stock: 15 },
    { id: 'i5', name: 'Salgadinho Pacote', category: 'food', price: 7, stock: 20 },
    { id: 's1', name: 'Lavanderia - Peça', category: 'service', price: 15, stock: 999 },
    { id: 's2', name: 'Translado Aeroporto', category: 'service', price: 80, stock: 999 },
    { id: 'o1', name: 'Estacionamento Diário', category: 'misc', price: 25, stock: 999 },
  ]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Modals / Selection States
  const [showCheckIn, setShowCheckIn] = useState<string | null>(null); // roomId
  const [showAddCharge, setShowAddCharge] = useState<string | null>(null); // bookingId
  const [showCheckoutConf, setShowCheckoutConf] = useState<string | null>(null); // bookingId
  const [checkoutData, setCheckoutData] = useState({ paymentMethod: 'cash' as 'cash' | 'card' | 'pix', daysToCharge: 1 });
  const [roomConfig, setRoomConfig] = useState<string | null>(null); // roomId
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showStockUpdate, setShowStockUpdate] = useState<string | null>(null); // itemId
  const [showCategoryPrices, setShowCategoryPrices] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState<string | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<'username' | 'reset'>('username');
  const [recoveryUsername, setRecoveryUsername] = useState('');
  const [masterKey, setMasterKey] = useState('');
  const [guestSearchTerm, setGuestSearchTerm] = useState('');
  
  const [stockUpdateData, setStockUpdateData] = useState({ amount: 1, type: 'add' as 'add' | 'remove', reason: '' });
  const [newUserData, setNewUserData] = useState({ name: '', username: '', password: '', role: 'receptionist' as UserRole });
  const [newPassword, setNewPassword] = useState('');
  
  const [newGuest, setNewGuest] = useState({ name: '', cpf: '', birthDate: '', email: '' });
  const [newItem, setNewItem] = useState({ name: '', category: 'beverage' as ItemCategory, price: 0, stock: 0 });
  const [newExpense, setNewExpense] = useState({ description: '', amount: 0, category: 'Maintenance' });
  const [checkInData, setCheckInData] = useState({ 
    guestId: '', 
    checkInDate: new Date().toISOString().split('T')[0], 
    checkOutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    adults: 1,
    children: 0,
  });
  
  const [loginForm, setLoginForm] = useState({ user: 'admin', pass: '1234' });
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 30000);
    
    if (showCheckoutConf) {
      const booking = bookings.find(b => b.id === showCheckoutConf);
      const defaultDays = booking ? Math.max(1, Math.ceil((booking.checkOut - booking.checkIn) / 86400000)) : 1;
      setCheckoutData({ paymentMethod: 'cash', daysToCharge: defaultDays });
    }

    return () => clearInterval(timer);
  }, [showCheckoutConf]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const foundUser = users.find(u => u.username === loginForm.user && u.password === loginForm.pass);
    if (foundUser) {
      setAuth({ isAuthenticated: true, user: foundUser });
      setError('');
    } else {
      setError('Credenciais inválidas. Verifique seu usuário e senha.');
    }
  };

  const addRoom = () => {
    const nextNum = (rooms.length + 1).toString().padStart(2, '0');
    setRooms([...rooms, { id: nextNum, number: nextNum, type: 'couple', pricePerNight: 220, status: 'vago' }]);
  };

  const updateRoomStatus = (roomId: string, status: 'vago' | 'sujo' | 'manuntencao') => {
    setRooms(rooms.map(r => r.id === roomId ? { ...r, status } : r));
  };

  const updateRoomType = (roomId: string, type: RoomType) => {
    const category = roomCategories.find(c => c.value === type);
    setRooms(rooms.map(r => r.id === roomId ? { ...r, type, pricePerNight: category?.price || r.pricePerNight } : r));
    setRoomConfig(null);
  };

  const updateIndividualRoomPrice = (roomId: string, price: number) => {
    setRooms(rooms.map(r => r.id === roomId ? { ...r, pricePerNight: price } : r));
  };

  const registerGuest = (e: React.FormEvent) => {
    e.preventDefault();
    const guest: Guest = { ...newGuest, id: Math.random().toString(36).substring(2, 9) };
    setGuests([...guests, guest]);
    
    // If registering during check-in, auto-select this guest
    if (showCheckIn) {
      setCheckInData(prev => ({ ...prev, guestId: guest.id }));
    }

    setNewGuest({ name: '', cpf: '', birthDate: '', email: '' });
    setShowGuestForm(false);
  };

  const registerItem = (e: React.FormEvent) => {
    e.preventDefault();
    const item: InventoryItem = { ...newItem, id: Math.random().toString(36).substring(2, 9) };
    setInventory([...inventory, item]);
    setNewItem({ name: '', category: 'beverage', price: 0, stock: 0 });
    setShowItemForm(false);
  };

  const addExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const trans: Transaction = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'expense',
      amount: newExpense.amount,
      category: newExpense.category,
      description: newExpense.description,
      timestamp: Date.now()
    };
    setTransactions([...transactions, trans]);
    setNewExpense({ description: '', amount: 0, category: 'Maintenance' });
    setShowExpenseForm(false);
  };

  const handleCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    const room = rooms.find(r => r.id === showCheckIn);
    if (!room || !checkInData.guestId) return;

    const checkInTime = new Date(checkInData.checkInDate + 'T12:00:00').getTime();
    const checkOutTime = new Date(checkInData.checkOutDate + 'T11:00:00').getTime();
    
    // Calculate days
    const diffTime = checkOutTime - checkInTime;
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const booking: Booking = {
      id: Math.random().toString(36).substring(2, 9),
      roomId: room.id,
      guestId: checkInData.guestId,
      checkIn: checkInTime,
      checkOut: checkOutTime,
      basePrice: room.pricePerNight * diffDays,
      charges: [],
      status: 'active',
      adults: checkInData.adults,
      children: checkInData.children,
      registeredBy: auth.user?.name || 'Unknown'
    };

    // Remove or complete existing reservation for this room/guest if it exists
    const updatedBookings = bookings.map(b => 
      b.roomId === room.id && b.guestId === checkInData.guestId && b.status === 'reserved' 
        ? { ...b, status: 'completed' as const } 
        : b
    );

    setBookings([booking, ...updatedBookings]);
    setRooms(rooms.map(r => r.id === room.id ? { ...r, status: 'occupied' } : r));
    setCheckInData({ 
      guestId: '', 
      checkInDate: new Date().toISOString().split('T')[0], 
      checkOutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      adults: 1,
      children: 0,
    });
    setShowCheckIn(null);
    setGuestSearchTerm('');
  };

  const addCharge = (bookingId: string, itemId: string) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item || item.stock <= 0) return;

    const newCharge: Charge = {
      id: Math.random().toString(36).substring(2, 9),
      itemId,
      quantity: 1,
      priceAtTime: item.price,
      timestamp: Date.now()
    };

    setInventory(inventory.map(i => i.id === itemId ? { ...i, stock: i.stock - 1 } : i));
    setBookings(bookings.map(b => b.id === bookingId ? { ...b, charges: [...b.charges, newCharge] } : b));
  };

  const removeCharge = (bookingId: string, chargeId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    const charge = booking?.charges.find(c => c.id === chargeId);
    if (!charge) return;

    setInventory(inventory.map(i => i.id === charge.itemId ? { ...i, stock: i.stock + charge.quantity } : i));
    setBookings(bookings.map(b => b.id === bookingId ? { ...b, charges: b.charges.filter(c => c.id !== chargeId) } : b));
  };

  const finalizeCheckOut = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const guest = guests.find(g => g.id === booking.guestId);
    const room = rooms.find(r => r.id === booking.roomId);
    
    // Recalculate price based on adjusted days
    const pricePerNight = room?.pricePerNight || (booking.basePrice / Math.max(1, Math.ceil((booking.checkOut - booking.checkIn) / 86400000)));
    const adjustedBasePrice = pricePerNight * checkoutData.daysToCharge;
    
    const totalCharges = booking.charges.reduce((sum, c) => sum + (c.priceAtTime * c.quantity), 0);
    const total = adjustedBasePrice + totalCharges;
    
    const trans: Transaction = {
      id: `T-${bookingId}-${Date.now()}`,
      type: 'income',
      amount: total,
      category: 'Stay',
      description: `Checkout: Quarto ${room?.number || '?'} | Cliente: ${guest?.name || 'Unknown'} | Ref: ${bookingId} | Op: ${auth.user?.name || 'Sistema'}`,
      timestamp: Date.now(),
      refId: bookingId
    };

    setTransactions([...transactions, trans]);
    setBookings(bookings.map(b => b.id === bookingId ? { 
      ...b, 
      status: 'completed', 
      paymentMethod: checkoutData.paymentMethod as any,
      basePrice: adjustedBasePrice 
    } : b));
    setRooms(rooms.map(r => r.id === booking.roomId ? { ...r, status: 'sujo' } : r));
    setShowCheckoutConf(null);
  };

  const getRoomStatus = (roomId: string) => {
    const activeBooking = bookings.find(b => b.roomId === roomId && b.status === 'active');
    if (!activeBooking) {
      return rooms.find(r => r.id === roomId)?.status || 'vago';
    }
    
    const oneHour = 3600000;
    const timeToCheckout = activeBooking.checkOut - currentTime;
    
    if (timeToCheckout < 0) return 'overdue';
    if (timeToCheckout <= oneHour) return 'expiring';
    return 'occupied';
  };

  const handleStockUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showStockUpdate) return;

    const item = inventory.find(i => i.id === showStockUpdate);
    if (!item) return;

    const change = stockUpdateData.type === 'add' ? stockUpdateData.amount : -stockUpdateData.amount;
    const newStock = Math.max(0, item.stock + change);

    setInventory(inventory.map(i => i.id === showStockUpdate ? { ...i, stock: newStock } : i));
    
    // Log as a special transaction or just reason (user mentioned "reason")
    // I will log as a transaction if it's a significant change or just keep it simple.
    // The user wants "options to add a reason for the stock change".
    
    setStockUpdateData({ amount: 1, type: 'add', reason: '' });
    setShowStockUpdate(null);
  };

  const generateReceipt = (booking: Booking, guest: Guest) => {
    const doc = new jsPDF();
    const hotelName = "HOTEL GESTÃO PRO";
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.text(hotelName, 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Comprovante de Hospedagem / Recibo", 105, 30, { align: 'center' });
    
    // Horizontal Line
    doc.setDrawColor(200);
    doc.line(20, 35, 190, 35);

    // Guest Info
    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.text(`Cliente: ${guest.name.toUpperCase()}`, 20, 50);
    const maskedCpf = guest.cpf.substring(0, 3) + ".***.***-**";
    doc.text(`CPF: ${maskedCpf}`, 20, 60);
    
    // Stay Info
    doc.setFontSize(11);
    doc.text("Resumo da Estadiana:", 20, 75);
    doc.setFontSize(10);
    doc.text(`Check-in: ${new Date(booking.checkIn).toLocaleDateString()}`, 25, 85);
    doc.text(`Check-out: ${new Date(booking.checkOut).toLocaleDateString()}`, 25, 95);
    doc.text(`Registrado por: ${booking.registeredBy || 'Sistema'}`, 25, 105);
    
    // Charges Table
    const tableData = booking.charges.map(c => {
      const item = inventory.find(i => i.id === c.itemId);
      return [
        item?.name || 'Item de Consumo',
        c.quantity,
        formatPrice(c.priceAtTime),
        formatPrice(c.quantity * c.priceAtTime)
      ];
    });
    
    // Base Stay
    const diffDays = Math.max(1, Math.ceil((booking.checkOut - booking.checkIn) / (1000 * 60 * 60 * 24)));
    tableData.unshift(['Diárias de Hospedagem', `${diffDays} diárias`, formatPrice(booking.basePrice / diffDays), formatPrice(booking.basePrice)]);
    
    autoTable(doc, {
      startY: 115,
      head: [['Descrição', 'Qtd/Dias', 'Preço Unit.', 'Subtotal']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [51, 65, 85] },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' }
      }
    });
    
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    const total = booking.basePrice + booking.charges.reduce((sum, c) => sum + (c.priceAtTime * c.quantity), 0);
    
    doc.setFontSize(14);
    doc.setFont("Helvetica", "bold");
    doc.text(`VALOR TOTAL PAGO: ${formatPrice(total)}`, 190, finalY, { align: 'right' });
    
    doc.setFontSize(8);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(150);
    doc.text("Este documento não possui valor fiscal. Gerado automaticamente pelo sistema LuxeStay.", 105, finalY + 40, { align: 'center' });
    
    doc.save(`Recibo_${guest.name.replace(/\s+/g, '_')}_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
  };

  const registerUser = (e: React.FormEvent) => {
    e.preventDefault();
    const user: AppUser = { ...newUserData, id: Math.random().toString(36).substring(2, 9) };
    setUsers([...users, user]);
    setNewUserData({ name: '', username: '', password: '', role: 'receptionist' });
    setShowUserForm(false);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showChangePasswordModal) return;
    setUsers(users.map(u => u.id === showChangePasswordModal ? { ...u, password: newPassword } : u));
    setNewPassword('');
    setShowChangePasswordModal(null);
  };

  const handleAdminRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    if (recoveryStep === 'username') {
      if (recoveryUsername.toLowerCase() === 'admin') {
        setRecoveryStep('reset');
        setError('');
      } else {
        setError('Apenas o administrador pode recuperar senha por aqui.');
      }
    } else {
      // Validando a "Master Key" (Chave de segurança do criador)
      if (masterKey === '200763') {
        setUsers(users.map(u => u.username === 'admin' ? { ...u, password: newPassword } : u));
        setIsRecovering(false);
        setRecoveryStep('username');
        setNewPassword('');
        setRecoveryUsername('');
        setMasterKey('');
        setError('Senha Admin alterada com sucesso!');
      } else {
        setError('Chave Mestra inválida. Entre em contato com o desenvolvedor.');
      }
    }
  };

  const stats = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const formatPrice = (p: number) => `R$ ${p.toFixed(2).replace('.', ',')}`;

  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen bg-bg-surface flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm bg-white p-10 rounded-xl border border-slate-200 shadow-sm transition-all">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg">
              <Hotel size={24} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Meu Hotel</h1>
          </div>
          
          {!isRecovering ? (
            <>
              <h2 className="text-xl font-semibold mb-2">Entrar no Sistema</h2>
              <p className="text-sm text-slate-500 mb-8">Administração Hoteleira</p>
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-1.5"><label className="text-xs font-semibold text-slate-700">USUÁRIO</label><input type="text" className="minimal-input" placeholder="Seu usuário" value={loginForm.user} onChange={e => setLoginForm({...loginForm, user: e.target.value})} /></div>
                <div className="space-y-1.5"><label className="text-xs font-semibold text-slate-700">SENHA</label><input type="password" underline-none className="minimal-input" placeholder="••••••••" value={loginForm.pass} onChange={e => setLoginForm({...loginForm, pass: e.target.value})} /></div>
                <div className="flex justify-between items-center">
                  {error && <p className={`text-xs font-medium ${error.includes('sucesso') ? 'text-emerald-500' : 'text-red-500'}`}>{error}</p>}
                  <button type="button" onClick={() => { setIsRecovering(true); setError(''); }} className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hover:text-slate-600 transition-colors ml-auto">Esqueci a senha</button>
                </div>
                <button type="submit" className="minimal-btn w-full mt-4">Acessar Painel</button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-2">Recuperar Admin</h2>
              <p className="text-sm text-slate-500 mb-8">
                {recoveryStep === 'username' ? 'Identifique sua conta master' : 'Autentique com a Chave Mestra'}
              </p>
              <form onSubmit={handleAdminRecovery} className="space-y-5">
                {recoveryStep === 'username' ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-tighter">Login do Administrador</label>
                    <input type="text" required className="minimal-input" placeholder="Ex: admin" value={recoveryUsername} onChange={e => setRecoveryUsername(e.target.value)} />
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 uppercase tracking-tighter">Chave Mestra de Segurança</label>
                      <input type="password" required className="minimal-input" placeholder="Código de 6 dígitos" value={masterKey} onChange={e => setMasterKey(e.target.value)} />
                      <p className="text-[9px] text-slate-400 italic">Solicite a chave ao desenvolvedor do sistema.</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 uppercase tracking-tighter">Nova Senha</label>
                      <input type="password" required className="minimal-input font-mono" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    </div>
                  </>
                )}
                {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => { setIsRecovering(false); setRecoveryStep('username'); setError(''); }} className="flex-1 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 rounded-xl hover:bg-slate-100 transition-all text-center">Voltar</button>
                  <button type="submit" className="flex-[2] py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all uppercase text-[10px] tracking-widest shadow-lg shadow-slate-100">
                    {recoveryStep === 'username' ? 'Continuar' : 'Resetar Senha'}
                  </button>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-bg-surface overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 h-full bg-white border-r border-slate-200 flex flex-col p-8 shrink-0">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-md">
            <Hotel size={18} strokeWidth={2.5} />
          </div>
          <h1 className="text-sm font-black tracking-tight text-slate-900 uppercase">Meu Hotel</h1>
        </div>
        <nav className="flex-1 space-y-2">
          <button onClick={() => setView('map')} className={`sidebar-item w-full ${view === 'map' ? 'active' : ''}`}><div className="sidebar-dot" /><LayoutGrid size={16} /> Mapa de Quartos</button>
          <button onClick={() => setView('guests')} className={`sidebar-item w-full ${view === 'guests' ? 'active' : ''}`}><div className="sidebar-dot" /><Users size={16} /> Hóspedes</button>
          <button onClick={() => setView('calendar')} className={`sidebar-item w-full ${view === 'calendar' ? 'active' : ''}`}><div className="sidebar-dot" /><CalendarDays size={16} /> Calendário</button>
          <button onClick={() => setView('occupancy')} className={`sidebar-item w-full ${view === 'occupancy' ? 'active' : ''}`}><div className="sidebar-dot" /><FileText size={16} /> Ocupação Diária</button>
          <button onClick={() => setView('inventory')} className={`sidebar-item w-full ${view === 'inventory' ? 'active' : ''}`}><div className="sidebar-dot" /><Package size={16} /> Estoque e Serviços</button>
          <button onClick={() => setView('booking-history')} className={`sidebar-item w-full ${view === 'booking-history' ? 'active' : ''}`}><div className="sidebar-dot" /><Calendar size={16} /> Histórico</button>
          
          {auth.user?.role === 'admin' && (
            <>
              <button onClick={() => setView('finance')} className={`sidebar-item w-full ${view === 'finance' ? 'active' : ''}`}><div className="sidebar-dot" /><BarChart3 size={16} /> Financeiro</button>
              <button onClick={() => setView('users')} className={`sidebar-item w-full ${view === 'users' ? 'active' : ''}`}><div className="sidebar-dot" /><User size={16} /> Usuários</button>
            </>
          )}
        </nav>
        <button onClick={() => setAuth({ isAuthenticated: false, user: null })} className="mt-auto flex items-center gap-3 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest text-left"><LogOut size={14} /> Sair</button>
      </aside>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 shrink-0">
          <h2 className="text-lg font-semibold text-slate-900">
            {view === 'map' ? 'Mapa de Quartos' : 
             view === 'guests' ? 'Fichas de Hóspedes' : 
             view === 'inventory' ? 'Gerenciamento de Estoque' : 
             view === 'finance' ? 'Fluxo de Caixa' : 
             view === 'users' ? 'Gestão de Usuários' :
             'Histórico de Estadias'}
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 mr-4 pr-4 border-r border-slate-100">
               <div className="text-right">
                  <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{auth.user?.name}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{auth.user?.role === 'admin' ? 'Administrador' : 'Recepcionista'}</p>
               </div>
               <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs">
                  {auth.user?.name?.charAt(0)}
               </div>
            </div>
            {view === 'map' && <button onClick={addRoom} className="minimal-btn flex items-center gap-2"><Plus size={14} /> Novo Quarto</button>}
            {view === 'guests' && <button onClick={() => setShowGuestForm(true)} className="minimal-btn flex items-center gap-2"><Plus size={14} /> Novo Hóspede</button>}
            {view === 'inventory' && (
              <div className="flex gap-3">
                <button onClick={() => setShowCategoryPrices(true)} className="minimal-btn flex items-center gap-2 bg-white text-slate-900 border-slate-200"><Settings size={14} /> Preços por Categoria</button>
                <button onClick={() => setShowItemForm(true)} className="minimal-btn flex items-center gap-2"><Plus size={14} /> Novo Item</button>
              </div>
            )}
          {view === 'users' && auth.user?.role === 'admin' && <button onClick={() => setShowUserForm(true)} className="minimal-btn flex items-center gap-2"><Plus size={14} /> Novo Usuário</button>}
            {view === 'finance' && <button onClick={() => setShowExpenseForm(true)} className="minimal-btn flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"><ArrowDownCircle size={14} /> Registrar Despesa</button>}
          </div>
        </header>

        <main className="flex-1 p-8 overflow-auto">
          {view === 'map' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 max-w-screen-2xl mx-auto">
              {rooms.map(room => {
                const status = getRoomStatus(room.id);
                const booking = bookings.find(b => b.roomId === room.id && b.status === 'active');
                const guest = booking ? guests.find(g => g.id === booking.guestId) : null;
                const totalCharges = booking ? booking.charges.reduce((sum, c) => sum + (c.priceAtTime * c.quantity), 0) : 0;
                
                const reservationToday = bookings.find(b => 
                  b.roomId === room.id && 
                  b.status === 'reserved' &&
                  isWithinInterval(startOfDay(new Date()), {
                    start: startOfDay(new Date(b.checkIn)),
                    end: startOfDay(new Date(b.checkOut))
                  })
                );
                const resGuest = reservationToday ? guests.find(g => g.id === reservationToday.guestId) : null;
                
                return (
                  <motion.div 
                    key={room.id}
                    layout
                    whileHover={{ y: -4 }}
                    className={`relative p-4 rounded-2xl border transition-all h-[280px] flex flex-col justify-between overflow-hidden ${
                      status === 'vago' ? (reservationToday && !booking ? 'bg-white border-emerald-200 ring-1 ring-emerald-50' : 'bg-white border-slate-200') :
                      status === 'sujo' ? 'bg-[#fefaf3] border-amber-200 ring-1 ring-amber-50' : 
                      status === 'manuntencao' ? 'bg-slate-50 border-slate-300 opacity-70' :
                      status === 'occupied' ? 'bg-blue-50 border-blue-200 shadow-md ring-1 ring-blue-100' :
                      status === 'expiring' ? 'bg-blue-50 border-amber-300 shadow-lg ring-2 ring-amber-500 ring-offset-1 animate-pulse' :
                      'bg-blue-50 border-red-300 shadow-lg ring-2 ring-red-500 ring-offset-1'
                    }`}
                  >
                    {/* Status Badges */}
                    <div className="absolute top-2 left-4 flex gap-1">
                      {status === 'expiring' && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500 text-white rounded-md z-10 shadow-sm">
                           <Clock size={8} strokeWidth={3} />
                           <span className="text-[7px] font-black uppercase tracking-widest">Saída</span>
                        </div>
                      )}
                      {status === 'overdue' && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-600 text-white rounded-md z-10 shadow-sm animate-bounce">
                           <AlertCircle size={8} strokeWidth={3} />
                           <span className="text-[7px] font-black uppercase tracking-widest">Atraso</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      {/* Room Identity & Quick Status */}
                      <div className="flex justify-between items-start">
                        <div className="flex gap-2">
                          <div className="flex flex-col">
                            <span className="text-2xl font-black text-slate-900 leading-none">{room.number}</span>
                            <div className="flex items-center gap-1 mt-0.5 text-slate-400">
                               <span className="text-[8px] font-black uppercase tracking-tighter">
                                 {roomCategories.find(c => c.value === room.type)?.label}
                               </span>
                               <button onClick={() => setRoomConfig(room.id)} className="hover:text-slate-900 transition-colors"><Settings size={8} /></button>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end">
                          {booking ? (
                            <div className={`px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider border ${
                              status === 'occupied' ? 'bg-blue-600 text-white border-blue-600' :
                              status === 'expiring' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-600 border-red-200'
                            }`}>
                              {status === 'occupied' ? 'Hospedado' : status === 'expiring' ? 'Saída' : 'Atraso'}
                            </div>
                          ) : (
                            <select 
                              value={room.status} 
                              onChange={(e) => updateRoomStatus(room.id, e.target.value as any)}
                              className={`text-[8px] font-black uppercase tracking-widest bg-transparent border-none cursor-pointer focus:ring-0 px-1 py-0.5 rounded appearance-none text-right hover:bg-slate-50 transition-colors ${
                                room.status === 'vago' ? 'text-emerald-600 bg-emerald-50/50' : 
                                room.status === 'sujo' ? 'text-amber-600 bg-amber-50/50' : 'text-red-600 bg-red-50/50'
                              }`}
                            >
                              <option value="vago">VAGO</option>
                              <option value="sujo">SUJO</option>
                              <option value="manuntencao">MANUT.</option>
                            </select>
                          )}
                        </div>
                      </div>

                      {booking && guest ? (
                        <div className="space-y-2.5">
                          {/* Guest Name & pax */}
                          <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100/50">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5 overflow-hidden">
                                 <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                   <User size={10} />
                                 </div>
                                 <span className="text-xs font-bold text-slate-800 truncate leading-tight">{guest.name}</span>
                              </div>
                            </div>
                            <div className="flex gap-1">
                               <span className="text-[8px] font-bold text-slate-500 bg-white border border-slate-100 px-1 py-0.5 rounded shadow-sm opacity-80 uppercase">
                                 {booking.adults} Ad.
                               </span>
                               {booking.children > 0 && (
                                 <span className="text-[8px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1 py-0.5 rounded shadow-sm uppercase">
                                   {booking.children} Cr.
                                 </span>
                               )}
                            </div>
                          </div>

                          {/* Stay Dates */}
                          <div className="flex items-center justify-between gap-1 text-[8px] bg-white p-1.5 rounded-lg shadow-sm border border-slate-100 leading-tight">
                             <div className="flex flex-col">
                                <span className="text-[6px] font-black text-slate-400 uppercase tracking-tighter">IN</span>
                                <div className="flex items-center gap-0.5 font-bold text-slate-500">
                                  {format(new Date(booking.checkIn), 'dd/MM')}
                                </div>
                             </div>
                             <ArrowRight size={8} className="text-slate-300" />
                             <div className="flex flex-col text-right">
                                <span className="text-[6px] font-black text-slate-400 uppercase tracking-tighter">OUT</span>
                                <div className="flex items-center gap-0.5 font-bold text-slate-700 justify-end">
                                  {format(new Date(booking.checkOut), 'dd/MM')}
                                </div>
                             </div>
                          </div>
                          
                          {/* Consumption Preview */}
                          <div className="space-y-1">
                             <div className="flex justify-between items-center px-0.5 opacity-60">
                                <span className="text-[7px] font-black text-slate-400 uppercase">Consumo</span>
                             </div>
                             <div className="space-y-0.5 max-h-12 overflow-y-auto no-scrollbar">
                                {booking.charges.length === 0 ? (
                                  <p className="text-[8px] text-slate-300 text-center py-1 border border-dashed rounded italic">Sem itens</p>
                                ) : (
                                 booking.charges.slice(-1).map(c => {
                                   const item = inventory.find(i => i.id === c.itemId);
                                   return (
                                     <div key={c.id} className="text-[8px] text-slate-600 flex justify-between bg-white px-1.5 py-0.5 rounded border border-slate-50">
                                       <span className="truncate pr-1">• {item?.name}</span>
                                       <span className="font-bold">{formatPrice(c.priceAtTime)}</span>
                                     </div>
                                   );
                                 })
                                )}
                             </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div 
                            onClick={() => {
                              if (reservationToday) {
                                setCheckInData({
                                  ...checkInData,
                                  guestId: reservationToday.guestId,
                                  checkInDate: format(new Date(reservationToday.checkIn), 'yyyy-MM-dd'),
                                  checkOutDate: format(new Date(reservationToday.checkOut), 'yyyy-MM-dd'),
                                  adults: reservationToday.adults || 1,
                                  children: reservationToday.children || 0,
                                });
                              }
                              setShowCheckIn(room.id);
                            }} 
                            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl h-28 cursor-pointer transition-all ${
                              reservationToday ? 'border-emerald-200 bg-emerald-50/20 hover:bg-emerald-50/50' : 'border-slate-100 hover:bg-slate-50'
                            }`}
                          >
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                               reservationToday ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-300'
                             }`}>
                               {reservationToday ? <CalendarDays size={14} /> : <Plus size={14} />}
                             </div>
                             <span className={`text-[8px] font-black uppercase tracking-widest text-center px-2 ${reservationToday ? 'text-emerald-700' : 'text-slate-400'}`}>
                               {reservationToday ? 'Reserva Hoje' : 'Check-in'}
                             </span>
                          </div>
                          
                          <div className="flex justify-between items-center px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">DIÁRIA</span>
                            <span className="text-xs font-black text-slate-700">{formatPrice(room.pricePerNight)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {booking && (
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                         <div className="flex flex-col leading-none">
                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total</span>
                            <span className="text-base font-black text-slate-900 tabular-nums leading-none">
                              {formatPrice(booking.basePrice + totalCharges)}
                            </span>
                         </div>
                         <div className="flex gap-1">
                            <button 
                              onClick={() => {
                                const currentEnd = new Date(booking.checkOut);
                                const newEnd = addDays(currentEnd, 1);
                                const roomObj = rooms.find(r => r.id === booking.roomId);
                                setBookings(bookings.map(b => b.id === booking.id ? { 
                                  ...b, 
                                  checkOut: newEnd.getTime(),
                                  basePrice: b.basePrice + (roomObj?.pricePerNight || 0)
                                } : b));
                              }} 
                              title="Renovar 1 Diária"
                              className="p-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                            >
                              <CalendarPlus size={10} strokeWidth={2.5} />
                            </button>
                            <button onClick={() => setShowAddCharge(booking.id)} title="Lançar" className="p-1.5 bg-slate-900 text-white rounded-lg hover:bg-blue-600 transition-all shadow-sm"><ShoppingCart size={10} /></button>
                            <button onClick={() => setShowCheckoutConf(booking.id)} title="Checkout" className="p-1.5 bg-slate-900 text-white rounded-lg hover:bg-emerald-600 transition-all shadow-sm"><CheckCircle2 size={10} /></button>
                         </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {view === 'guests' && (
            <div className="minimal-card max-w-5xl mx-auto overflow-hidden">
               <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <span className="card-label mb-0">Hóspedes Registrados</span>
                <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" /><input type="text" placeholder="Filtrar por nome ou CPF..." className="pl-9 pr-4 py-2 bg-slate-50 border-none rounded-lg text-xs" /></div>
              </div>
              <table className="w-full">
                <thead><tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest"><th className="px-6 py-4 text-left">Hóspede</th><th className="px-6 py-4 text-left">Documentação</th><th className="px-6 py-4 text-left">Contato</th><th className="px-6 py-4 text-right">Ação</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                   {guests.map(g => (
                     <tr key={g.id} className="text-sm hover:bg-slate-50/40">
                       <td className="px-6 py-5"><p className="font-bold text-slate-900">{g.name}</p><p className="text-[10px] text-slate-400 font-medium">Nasc: {g.birthDate}</p></td>
                       <td className="px-6 py-5 font-mono text-slate-600">{g.cpf}</td>
                       <td className="px-6 py-5 text-slate-500 font-medium">{g.email}</td>
                       <td className="px-6 py-5 text-right"><button onClick={() => setGuests(guests.filter(x => x.id !== g.id))} className="text-slate-200 hover:text-red-500 p-2"><Trash2 size={16} /></button></td>
                     </tr>
                   ))}
                   {guests.length === 0 && <tr><td colSpan={4} className="py-24 text-center text-slate-300 text-sm font-medium italic">Banco de dados vazio.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {view === 'inventory' && (
            <div className="max-w-6xl mx-auto space-y-8">
               {inventory.some(i => i.stock < 5) && (
                 <motion.div 
                   initial={{ opacity: 0, y: -20 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="bg-red-50 border border-red-100 rounded-2xl p-6 flex items-center gap-6"
                 >
                   <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                     <AlertCircle size={24} />
                   </div>
                   <div>
                     <h3 className="text-sm font-black text-red-900 uppercase tracking-tight">Alerta de Estoque Baixo</h3>
                     <p className="text-xs text-red-600 font-medium">Você tem {inventory.filter(i => i.stock < 5).length} item(ns) com menos de 5 unidades. Reposição sugerida.</p>
                   </div>
                   <div className="ml-auto flex gap-2">
                     {inventory.filter(i => i.stock < 5).slice(0, 3).map(item => (
                       <span key={item.id} className="px-3 py-1 bg-white border border-red-100 text-[10px] font-bold text-red-600 rounded-lg uppercase tracking-tight">
                         {item.name}: {item.stock}
                       </span>
                     ))}
                     {inventory.filter(i => i.stock < 5).length > 3 && (
                       <span className="px-3 py-1 bg-white border border-red-100 text-[10px] font-bold text-red-600 rounded-lg">
                         +{inventory.filter(i => i.stock < 5).length - 3}
                       </span>
                     )}
                   </div>
                 </motion.div>
               )}

               <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                 {['beverage', 'food', 'service', 'misc'].map(cat => (
                   <div key={cat} className="minimal-card p-6">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1 block">{cat}</span>
                      <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-slate-900">{inventory.filter(i => i.category === cat).length}</span>
                        <span className="text-[10px] font-bold text-slate-400 mb-1.5 underline underline-offset-4 decoration-slate-200">SKUs</span>
                      </div>
                   </div>
                 ))}
               </div>
               <div className="minimal-card overflow-hidden">
                  <div className="p-6 border-b border-slate-50"><span className="card-label mb-0">Catálogo de Venda e Serviços</span></div>
                  <table className="w-full">
                     <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                       <tr><th className="px-6 py-4 text-left">PRODUTO / SERVIÇO</th><th className="px-6 py-4 text-left">PREÇO</th><th className="px-6 py-4 text-left">DISPONIBILIDADE</th><th className="px-6 py-4 text-right">CONTROLES</th></tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {inventory.map(item => (
                          <tr key={item.id} className={`text-sm hover:bg-slate-50/40 transition-colors ${item.stock < 5 ? 'bg-red-50/30' : ''}`}>
                            <td className="px-6 py-5">
                               <p className="font-bold text-slate-900 uppercase tracking-tight">{item.name}</p>
                               <span className="text-[9px] font-black text-slate-300 uppercase">{item.category}</span>
                            </td>
                            <td className="px-6 py-5 font-mono font-bold text-blue-600">{formatPrice(item.price)}</td>
                            <td className="px-6 py-5">
                               <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                     <div className={`w-1.5 h-1.5 rounded-full ${item.stock < 5 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                                     <span className="font-bold text-slate-700">{item.stock} unidades</span>
                                  </div>
                                  <button 
                                    onClick={() => setShowStockUpdate(item.id)}
                                    className="p-1 px-2.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black hover:bg-blue-50 hover:text-blue-600 transition-all uppercase tracking-tighter"
                                  >
                                    Atualizar
                                  </button>
                               </div>
                            </td>
                            <td className="px-6 py-5 text-right flex gap-2 justify-end">
                              <button onClick={() => setEditingInventoryItem(item)} className="text-slate-300 hover:text-blue-500 p-2"><Settings size={16} /></button>
                              <button onClick={() => setInventory(inventory.filter(x => x.id !== item.id))} className="text-slate-100 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                            </td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          )}

          {view === 'calendar' && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-6">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                         <CalendarDays size={20} />
                      </div>
                      <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900">
                        {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                      </h2>
                   </div>
                   <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600"><PlusCircle size={18} className="rotate-45" /></button>
                    <button onClick={() => setCurrentMonth(new Date())} className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Hoje</button>
                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600"><PlusCircle size={18} /></button>
                  </div>
                </div>
                <div className="flex gap-3">
                   <div className="flex items-center gap-2 px-4 border-r border-slate-100">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Ocupado</span>
                   </div>
                   <div className="flex items-center gap-2 px-4">
                      <div className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-200" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Reservado</span>
                   </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm overflow-x-auto">
                <table className="w-full border-collapse">
                   <thead>
                      <tr>
                         <th className="sticky left-0 z-10 bg-slate-50 p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-r border-b border-slate-100 min-w-[120px]">Quarto</th>
                         {daysInMonth.map(day => (
                            <th key={day.toString()} className={`p-4 text-center border-b border-slate-100 min-w-[50px] ${isSameDay(day, new Date()) ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400'}`}>
                               <p className="text-[10px] font-bold uppercase tracking-tighter">{format(day, 'EEE', { locale: ptBR })}</p>
                               <p className="text-sm font-black">{format(day, 'dd')}</p>
                            </th>
                         ))}
                      </tr>
                   </thead>
                   <tbody>
                      {rooms.map(room => (
                         <tr key={room.id} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50/50 p-4 border-r border-b border-slate-100 transition-colors">
                               <p className="text-sm font-black text-slate-900">Q. {room.number}</p>
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{room.type}</p>
                            </td>
                            {daysInMonth.map(day => {
                               const booking = getBookingForRoomAndDate(room.id, day);
                               const guest = booking ? guests.find(g => g.id === booking.guestId) : null;
                               return (
                                  <td key={`${room.id}-${day.getTime()}`} className="p-1 border-b border-slate-100 min-w-[50px] text-center relative h-16">
                                     {booking ? (
                                        <div 
                                          title={`${guest?.name} (${booking.status})`}
                                          onClick={() => {
                                             if (booking.status === 'reserved') {
                                               setReservationData({
                                                 guestId: booking.guestId,
                                                 checkIn: format(new Date(booking.checkIn), 'yyyy-MM-dd'),
                                                 checkOut: format(new Date(booking.checkOut), 'yyyy-MM-dd'),
                                                 adults: booking.adults || 1,
                                                 children: booking.children || 0,
                                               });
                                               setEditingReservationId(booking.id);
                                               setShowReservationForm(room.id);
                                             }
                                          }}
                                          className={`absolute inset-1 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all transform hover:scale-105 shadow-sm p-1 ${
                                            booking.status === 'active' ? 'bg-blue-500 text-white' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                          }`}
                                        >
                                           <User size={12} className={booking.status === 'reserved' ? 'text-emerald-500' : ''} />
                                           <span className="text-[8px] font-black uppercase truncate w-full mt-1">
                                             {guest?.name.split(' ')[0]}
                                           </span>
                                        </div>
                                     ) : (
                                        <button 
                                          onClick={() => {
                                            setReservationData(prev => ({ ...prev, checkIn: format(day, 'yyyy-MM-dd'), checkOut: format(addDays(day, 1), 'yyyy-MM-dd') }));
                                            setShowReservationForm(room.id);
                                          }}
                                          className="w-full h-full opacity-0 hover:opacity-100 flex items-center justify-center text-slate-200 transition-opacity"
                                        >
                                           <PlusCircle size={16} />
                                        </button>
                                     )}
                                  </td>
                               );
                            })}
                         </tr>
                      ))}
                   </tbody>
                </table>
              </div>
            </div>
          )}

          {view === 'occupancy' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto space-y-8">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Relatório de Ocupação</h2>
                  <p className="text-sm text-slate-500 font-medium">Situação detalhada do hotel em {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                </div>
                <button 
                  onClick={() => {
                    const csvRows = [
                      ['RELATORIO DE OCUPACAO DIARIA'],
                      ['Data:', format(new Date(), 'dd/MM/yyyy HH:mm')],
                      [''],
                      ['Quarto', 'Status', 'Categoria', 'Preco Diaria'],
                      ...rooms.map(room => {
                        const statusMap: any = { vago: 'Livre', occupied: 'Ocupado', sujo: 'Sujo', manuntencao: 'Manutencao' };
                        return [room.name, statusMap[room.status] || room.status, room.type, `R$ ${room.pricePerNight}`];
                      })
                    ];
                    const csvContent = csvRows.map(e => e.join(";")).join("\n");
                    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.setAttribute("href", url);
                    link.setAttribute("download", `mapa_ocupacao_${format(new Date(), 'yyyy-MM-dd')}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                >
                  <FileText size={16} /> Exportar Relatório CSV
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-6">
                {[
                  { label: 'Taxa de Ocupação', val: `${((rooms.filter(r => ['occupied', 'expiring', 'delayed'].includes(r.status)).length / rooms.length) * 100).toFixed(1)}%`, sub: 'Relativo ao total', color: 'blue' },
                  { label: 'Quartos Disponíveis', val: rooms.filter(r => r.status === 'vago').length, sub: 'Vagos e prontos', color: 'emerald' },
                  { label: 'Quartos Ocupados', val: rooms.filter(r => ['occupied', 'expiring', 'delayed'].includes(r.status)).length, sub: 'Com hóspedes ativos', color: 'blue' },
                  { label: 'Fora de Serviço', val: rooms.filter(r => r.status === 'manuntencao' || r.status === 'sujo').length, sub: 'Limpeza/Manutenção', color: 'amber' },
                ].map((s, i) => (
                  <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="relative">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{s.label}</div>
                      <div className={`text-4xl font-black ${s.color === 'blue' ? 'text-blue-600' : s.color === 'emerald' ? 'text-emerald-600' : 'text-amber-600'} tracking-tighter`}>{s.val}</div>
                      <div className="text-[10px] font-bold text-slate-400 mt-2 uppercase">{s.sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Detail Table */}
              <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificação</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Atual</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo de Unidade</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Diária</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rooms.map(room => (
                      <tr key={room.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-8 py-5">
                          <div className="font-black text-slate-900 text-base tracking-tight">{room.name}</div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full ${
                                room.status === 'vago' ? 'bg-emerald-500' : 
                                ['occupied', 'expiring', 'delayed'].includes(room.status) ? 'bg-blue-500' : 'bg-amber-500'
                             }`} />
                             <span className={`text-[10px] font-black uppercase tracking-widest ${
                                room.status === 'vago' ? 'text-emerald-600' : 
                                ['occupied', 'expiring', 'delayed'].includes(room.status) ? 'text-blue-600' : 'text-amber-600'
                             }`}>
                                {room.status === 'vago' ? 'Livre' : room.status === 'sujo' ? 'Limpando' : room.status === 'manuntencao' ? 'Manutenção' : 'Hospedado'}
                             </span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-tighter">{room.type}</div>
                        </td>
                        <td className="px-8 py-5 text-sm font-mono font-bold text-slate-900">
                          {formatPrice(room.pricePerNight)}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button 
                            onClick={() => setView('map')}
                            className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                          >
                            Ver no Mapa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {view === 'finance' && auth.user?.role === 'admin' && (
            <div className="max-w-6xl mx-auto space-y-10">
               <div className="grid md:grid-cols-3 gap-8">
                 <FinanceCard label="Receita Bruta" value={stats.income} icon={<ArrowUpCircle className="text-emerald-500" />} />
                 <FinanceCard label="Despesas" value={stats.expense} icon={<ArrowDownCircle className="text-red-500" />} />
                 <FinanceCard label="Saldo Líquido" value={stats.balance} icon={<DollarSign className="text-blue-500" />} isTotal />
               </div>
               
               <div className="minimal-card overflow-hidden">
                  <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                    <span className="card-label mb-0">Livro de Movimentações</span>
                    <button className="text-[10px] font-bold text-blue-600 hover:underline">EXPORTAR RELATÓRIO</button>
                  </div>
                  <table className="w-full">
                    <thead><tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest"><th className="px-6 py-4 text-left">Data</th><th className="px-6 py-4 text-left">Descrição</th><th className="px-6 py-4 text-left">Categoria</th><th className="px-6 py-4 text-right">Valor</th></tr></thead>
                    <tbody className="divide-y divide-slate-50">
                      {transactions.sort((a,b) => b.timestamp - a.timestamp).map(t => (
                        <tr key={t.id} className="text-sm hover:bg-slate-50/30">
                          <td className="px-6 py-4 text-slate-400 font-medium">{new Date(t.timestamp).toLocaleDateString()}</td>
                          <td className="px-6 py-4 font-bold text-slate-800">{t.description}</td>
                          <td className="px-6 py-4 uppercase text-[10px] font-black text-slate-300">{t.category}</td>
                          <td className={`px-6 py-4 text-right font-mono font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {t.type === 'income' ? '+' : '-'} {formatPrice(t.amount)}
                          </td>
                        </tr>
                      ))}
                      {transactions.length === 0 && <tr><td colSpan={4} className="py-20 text-center text-slate-300 italic">Sem registros para o período.</td></tr>}
                    </tbody>
                  </table>
               </div>
            </div>
          )}

          {view === 'booking-history' && (
            <div className="minimal-card max-w-5xl mx-auto overflow-hidden">
               <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <span className="card-label mb-0">Histórico de Estadias</span>
                <div className="flex gap-2"><button className="p-1 px-3 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-400">Todos</button><button className="p-1 px-3 bg-blue-50 rounded-lg text-[10px] font-bold text-blue-600">Ativos</button><button className="p-1 px-3 bg-emerald-50 rounded-lg text-[10px] font-bold text-emerald-600">Concluídos</button></div>
              </div>
              <div className="divide-y divide-slate-50">
                 {bookings.sort((a,b) => b.checkIn - a.checkIn).map(b => {
                   const r = rooms.find(rm => rm.id === b.roomId);
                   const g = guests.find(gs => gs.id === b.guestId);
                   const total = b.basePrice + b.charges.reduce((sum, c) => sum + (c.priceAtTime * c.quantity), 0);
                   return (
                     <div key={`history-${b.id}`} className="p-6 flex items-center justify-between hover:bg-slate-50/30">
                        <div className="flex gap-5 items-center">
                           <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-lg">{r?.number}</div>
                           <div>
                              <p className="font-bold text-slate-900 text-lg leading-tight">{g?.name}</p>
                              <div className="flex items-center gap-3 mt-1.5">
                                 <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-tighter"><Calendar size={10} /> {new Date(b.checkIn).toLocaleDateString()} — {new Date(b.checkOut).toLocaleDateString()}</span>
                                 <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-tighter">• Cad. por: {b.registeredBy || 'Admin'}</span>
                                 <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${b.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : b.status === 'canceled' ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-600'}`}>{b.status}</span>
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-6">
                           {b.status === 'completed' && (
                             <button 
                               onClick={() => g && generateReceipt(b, g)}
                               className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all border border-transparent hover:border-blue-100 group"
                               title="Baixar Comprovante"
                             >
                               <FileText size={18} className="group-hover:scale-110 transition-transform" />
                             </button>
                           )}
                           <div className="text-right">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Liquidado</p>
                              <p className="text-2xl font-black text-slate-900">{formatPrice(total)}</p>
                           </div>
                        </div>
                     </div>
                   );
                 })}
              </div>
            </div>
          )}
          {view === 'users' && auth.user?.role === 'admin' && (
            <div className="minimal-card max-w-5xl mx-auto overflow-hidden">
               <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <span className="card-label mb-0">Gestão de Colaboradores</span>
                <p className="text-[10px] text-slate-400 font-medium">Controle de acesso para recepcionistas</p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-4 text-left">Nome</th>
                    <th className="px-6 py-4 text-left">Usuário</th>
                    <th className="px-6 py-4 text-left">Nível de Acesso</th>
                    <th className="px-6 py-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {users.map(u => (
                     <tr key={u.id} className="text-sm hover:bg-slate-50/40">
                       <td className="px-6 py-5">
                          <p className="font-bold text-slate-900">{u.name}</p>
                          {u.username === 'admin' && <span className="text-[8px] bg-slate-900 text-white px-1.5 py-0.5 rounded uppercase font-black tracking-tighter">Conta Mestra</span>}
                       </td>
                       <td className="px-6 py-5 font-mono text-slate-600">{u.username}</td>
                       <td className="px-6 py-5">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                             {u.role === 'admin' ? 'Administrador' : 'Recepcionista'}
                          </span>
                       </td>
                       <td className="px-6 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => setShowChangePasswordModal(u.id)} 
                              className="text-slate-400 hover:text-blue-600 p-2 border border-slate-100 rounded-lg hover:border-blue-100 transition-all"
                              title="Alterar Senha"
                            >
                               <Settings size={16} />
                            </button>
                            {u.username !== 'admin' && (
                              <button onClick={() => setUsers(users.filter(x => x.id !== u.id))} className="text-slate-200 hover:text-red-500 p-2 border border-slate-100 rounded-lg hover:border-red-100 transition-all">
                                 <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                       </td>
                     </tr>
                   ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* Modals & Overlays */}
      <AnimatePresence>
        {roomConfig && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setRoomConfig(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white rounded-2xl p-8 shadow-2xl">
              <h3 className="text-xl font-black mb-6 leading-tight">Configurar Quarto {rooms.find(r => r.id === roomConfig)?.number}</h3>
              
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Categoria do Quarto</p>
                  <div className="grid grid-cols-2 gap-3">
                    {roomCategories.map(cat => (
                      <button 
                        key={cat.value} 
                        onClick={() => updateRoomType(roomConfig, cat.value)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${rooms.find(r => r.id === roomConfig)?.type === cat.value ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                      >
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{cat.label}</p>
                        <p className="font-bold text-slate-900 text-xs">{formatPrice(cat.price)}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Preço Individual p/ Diária</label>
                   <div className="flex gap-2">
                      <input 
                        type="number" 
                        className="minimal-input font-bold" 
                        value={rooms.find(r => r.id === roomConfig)?.pricePerNight || 0}
                        onChange={(e) => updateIndividualRoomPrice(roomConfig, parseFloat(e.target.value))}
                      />
                   </div>
                   <p className="text-[9px] text-slate-400 italic">Alterar o preço aqui afetará apenas este quarto específico.</p>
                </div>
              </div>

              <button onClick={() => setRoomConfig(null)} className="w-full py-4 mt-8 text-slate-500 font-bold text-xs uppercase tracking-widest bg-slate-100 rounded-xl hover:bg-slate-200 transition-all">Salvar Alterações</button>
            </motion.div>
          </div>
        )}

        {showCheckoutConf && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCheckoutConf(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl bg-white rounded-3xl p-10 shadow-2xl flex flex-col max-h-[85vh]">
             <div className="flex justify-between items-start mb-8">
               <div>
                  <h3 className="text-2xl font-black text-slate-900">Conferência de Checkout</h3>
                  <p className="text-sm text-slate-500 font-medium">Revise a conta e o tempo de estadia</p>
               </div>
               <button onClick={() => setShowCheckoutConf(null)} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900"><X size={20} /></button>
             </div>
             
             {(() => {
               const booking = bookings.find(b => b.id === showCheckoutConf);
               const room = rooms.find(r => r.id === booking?.roomId);
               const defaultDays = booking ? Math.max(1, Math.ceil((booking.checkOut - booking.checkIn) / (1000 * 60 * 60 * 24))) : 1;
               const pricePerNight = room?.pricePerNight || (booking ? booking.basePrice / defaultDays : 0);
               const chargesTotal = booking?.charges.reduce((s, c) => s + (c.priceAtTime * c.quantity), 0) || 0;
               const currentTotal = (pricePerNight * checkoutData.daysToCharge) + chargesTotal;

               return (
                 <>
                   <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 grid grid-cols-2 gap-8">
                         <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Informações de Diárias</p>
                            <div className="space-y-4">
                               <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-slate-500 uppercase">Qtd. de Diárias a Cobrar</label>
                                  <div className="flex items-center gap-3">
                                     <button 
                                      type="button"
                                      onClick={() => setCheckoutData({...checkoutData, daysToCharge: Math.max(1, checkoutData.daysToCharge - 1)})}
                                      className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50"
                                     >-</button>
                                     <span className="text-xl font-black w-10 text-center">{checkoutData.daysToCharge}</span>
                                     <button 
                                      type="button"
                                      onClick={() => setCheckoutData({...checkoutData, daysToCharge: checkoutData.daysToCharge + 1})}
                                      className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50"
                                     >+</button>
                                  </div>
                                  <p className="text-[9px] text-slate-400 italic">Previsto original: {defaultDays} diárias</p>
                               </div>
                               <div className="flex justify-between items-center pt-2 border-t border-slate-200/50">
                                  <span className="text-sm font-bold text-slate-700">Subtotal Diárias</span>
                                  <span className="text-sm font-black text-slate-900">{formatPrice(pricePerNight * checkoutData.daysToCharge)}</span>
                               </div>
                            </div>
                         </div>

                         <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Método de Pagamento</p>
                            <div className="grid grid-cols-1 gap-2">
                               {([
                                 { id: 'pix', label: 'PIX', icon: <ArrowRightLeft size={14} /> },
                                 { id: 'cash', label: 'Dinheiro', icon: <DollarSign size={14} /> },
                                 { id: 'card', label: 'Cartão', icon: <CreditCard size={14} /> }
                               ] as const).map(method => (
                                 <button 
                                  key={`pay-${method.id}`}
                                  onClick={() => setCheckoutData({...checkoutData, paymentMethod: method.id as any})}
                                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${checkoutData.paymentMethod === method.id ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-white bg-white shadow-sm text-slate-400 hover:border-slate-100'}`}
                                 >
                                    {method.icon}
                                    <span className="text-xs font-bold uppercase tracking-widest">{method.label}</span>
                                 </button>
                               ))}
                            </div>
                         </div>
                      </div>

                      <div className="space-y-3">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Itens Consumidos / Lançados</p>
                         {booking?.charges.length === 0 ? (
                           <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl"><p className="text-xs text-slate-300 italic">Sem consumações no período.</p></div>
                         ) : (
                           <div className="space-y-2">
                              {booking?.charges.map(c => {
                                const item = inventory.find(i => i.id === c.itemId);
                                return (
                                  <div key={`charge-${c.id}`} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl group hover:border-slate-200">
                                     <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 text-blue-500 rounded-lg"><ShoppingCart size={14} /></div>
                                        <div><p className="text-sm font-bold text-slate-900">{item?.name}</p><p className="text-[10px] font-medium text-slate-400">{new Date(c.timestamp).toLocaleString()}</p></div>
                                     </div>
                                     <div className="flex items-center gap-4">
                                        <span className="text-sm font-black text-slate-900">{formatPrice(c.priceAtTime)}</span>
                                        <button onClick={() => removeCharge(showCheckoutConf, c.id)} className="text-slate-100 group-hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                     </div>
                                  </div>
                                );
                              })}
                           </div>
                         )}
                      </div>
                   </div>

                   <div className="mt-8 pt-8 border-t-2 border-slate-50 flex items-center justify-between">
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">TOTAL GERAL A LIQUIDAR</p>
                         <p className="text-4xl font-black text-blue-600">
                            {formatPrice(currentTotal)}
                         </p>
                      </div>
                      <div className="flex gap-4">
                         <button onClick={() => setShowAddCharge(showCheckoutConf)} className="px-6 py-4 bg-slate-100 text-slate-900 font-bold rounded-2xl hover:bg-slate-200 transition-all">Lançar Mais</button>
                         <button onClick={() => finalizeCheckOut(showCheckoutConf)} className="px-10 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-50 focus:ring-2 ring-emerald-500 ring-offset-2">Finalizar Check-out</button>
                      </div>
                   </div>
                 </>
               );
             })()}
          </motion.div></div>
        )}

        {showExpenseForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6"><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowExpenseForm(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" /><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white rounded-2xl p-8 shadow-2xl">
            <h3 className="text-xl font-bold mb-6">Registrar Saída de Caixa</h3>
            <form onSubmit={addExpense} className="space-y-4">
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400">DESCRIÇÃO DA DESPESA</label><input type="text" required value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} className="minimal-input" placeholder="Ex: Conta de Luz, Compra de Estoque..." /></div>
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400">CATEGORIA</label>
                <select value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})} className="minimal-input">
                   <option value="Maintenance">Manutenção</option><option value="Utility">Contas Consumo</option><option value="Inventory">Reposição Estoque</option><option value="Salary">Salários</option><option value="Other">Outros</option>
                </select>
              </div>
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400">VALOR (R$)</label><input type="number" step="0.01" required value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value)})} className="minimal-input" /></div>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setShowExpenseForm(false)} className="flex-1 py-2 text-sm font-semibold text-slate-400">Cancelar</button>
                <button type="submit" className="flex-1 minimal-btn bg-red-600 hover:bg-red-700">Lançar Despesa</button>
              </div>
            </form>
          </motion.div></div>
        )}

        {/* Existing Forms (Guest, Item, Checkin, etc) */}
        {showGuestForm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6"><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowGuestForm(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" /><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl">
            <h3 className="text-xl font-bold mb-6">Cadastrar Hóspede</h3>
            <form onSubmit={registerGuest} className="space-y-4">
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400">NOME COMPLETO</label><input type="text" required value={newGuest.name} onChange={e => setNewGuest({...newGuest, name: e.target.value})} className="minimal-input" placeholder="Nome Completo" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400">CPF</label><input type="text" required value={newGuest.cpf} onChange={e => setNewGuest({...newGuest, cpf: e.target.value})} className="minimal-input" placeholder="000.000.000-00" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400">NASCIMENTO</label><input type="date" required value={newGuest.birthDate} onChange={e => setNewGuest({...newGuest, birthDate: e.target.value})} className="minimal-input" /></div>
              </div>
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400">EMAIL</label><input type="email" required value={newGuest.email} onChange={e => setNewGuest({...newGuest, email: e.target.value})} className="minimal-input" placeholder="email@exemplo.com" /></div>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setShowGuestForm(false)} className="flex-1 py-2 text-sm font-semibold text-slate-400 hover:text-slate-900">Cancelar</button>
                <button type="submit" className="flex-1 minimal-btn">Salvar Hóspede</button>
              </div>
            </form>
          </motion.div></div>
        )}

        {showItemForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6"><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowItemForm(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" /><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl">
            <h3 className="text-xl font-bold mb-6">Novo Item / Serviço</h3>
            <form onSubmit={registerItem} className="space-y-4">
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400">NOME DO ITEM</label><input type="text" required value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="minimal-input" placeholder="Ex: Cerveja Lata, Almoço Executivo" /></div>
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400">CATEGORIA</label><select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value as ItemCategory})} className="minimal-input">
                <option value="beverage">Bebida</option><option value="food">Comida</option><option value="service">Serviço</option><option value="misc">Outros</option>
              </select></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400">PREÇO UNITÁRIO</label><input type="number" step="0.01" required value={newItem.price} onChange={e => setNewItem({...newItem, price: parseFloat(e.target.value)})} className="minimal-input" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400">ESTOQUE INICIAL</label><input type="number" required value={newItem.stock} onChange={e => setNewItem({...newItem, stock: parseInt(e.target.value)})} className="minimal-input" /></div>
              </div>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setShowItemForm(false)} className="flex-1 py-2 text-sm font-semibold text-slate-400 hover:text-slate-900">Cancelar</button>
                <button type="submit" className="flex-1 minimal-btn">Adicionar ao Catálogo</button>
              </div>
            </form>
          </motion.div></div>
        )}

        {showReservationForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowReservationForm(null); setEditingReservationId(null); setGuestSearchTerm(''); }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold uppercase tracking-tighter">
                  {editingReservationId ? 'Editar Reserva' : 'Nova Reserva'} - Quarto {rooms.find(r => r.id === showReservationForm)?.number}
                </h3>
                {editingReservationId && (
                  <button 
                    type="button" 
                    onClick={() => cancelReservation(editingReservationId)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold uppercase"
                  >
                    <Trash2 size={14} /> Cancelar Reserva
                  </button>
                )}
              </div>
              <form onSubmit={handleReservation} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">HÓSPEDE</label>
                  <input 
                    type="text" 
                    placeholder="Buscar por nome ou CPF..." 
                    value={guestSearchTerm}
                    onChange={e => setGuestSearchTerm(e.target.value)}
                    className="minimal-input text-xs"
                  />
                  <select 
                    required 
                    value={reservationData.guestId} 
                    onChange={e => setReservationData({...reservationData, guestId: e.target.value})} 
                    className="minimal-input"
                  >
                    <option value="">Selecione...</option>
                    {guests
                      .filter(g => 
                        g.name.toLowerCase().includes(guestSearchTerm.toLowerCase()) || 
                        g.cpf.includes(guestSearchTerm)
                      )
                      .map(g => <option key={g.id} value={g.id}>{g.name} ({g.cpf})</option>)
                    }
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase">INÍCIO</label><input type="date" required value={reservationData.checkIn} onChange={e => setReservationData({...reservationData, checkIn: e.target.value})} className="minimal-input" /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase">FIM</label><input type="date" required value={reservationData.checkOut} onChange={e => setReservationData({...reservationData, checkOut: e.target.value})} className="minimal-input" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      ADULTOS (MÁX {showReservationForm ? getRoomCapacity(rooms.find(r => r.id === showReservationForm)?.type || 'couple') : '-'})
                    </label>
                    <input 
                      type="number" 
                      min="1" 
                      max={showReservationForm ? getRoomCapacity(rooms.find(r => r.id === showReservationForm)?.type || 'couple') : 2} 
                      required 
                      value={reservationData.adults} 
                      onChange={e => setReservationData({...reservationData, adults: parseInt(e.target.value)})} 
                      className="minimal-input" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">CRIANÇAS</label>
                    <input 
                      type="number" 
                      min="0" 
                      required 
                      value={reservationData.children} 
                      onChange={e => setReservationData({...reservationData, children: parseInt(e.target.value)})} 
                      className="minimal-input" 
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => { setShowReservationForm(null); setEditingReservationId(null); setGuestSearchTerm(''); }} className="flex-1 px-6 py-3 border border-slate-200 text-slate-400 font-bold rounded-xl hover:bg-slate-50 transition-all uppercase text-xs tracking-widest">Fechar</button>
                  <button type="submit" className="flex-1 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all uppercase text-xs tracking-widest">
                    {editingReservationId ? 'Salvar Alterações' : 'Confirmar Reserva'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {editingInventoryItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingInventoryItem(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white rounded-2xl p-8 shadow-2xl">
              <h3 className="text-xl font-bold mb-6">Editar Item</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                setInventory(inventory.map(i => i.id === editingInventoryItem.id ? {
                  ...i,
                  name: formData.get('name') as string,
                  price: Number(formData.get('price')),
                  category: formData.get('category') as ItemCategory
                } : i));
                setEditingInventoryItem(null);
              }} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Nome</label>
                  <input name="name" required defaultValue={editingInventoryItem.name} className="minimal-input" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Preço</label>
                    <input type="number" step="0.01" name="price" required defaultValue={editingInventoryItem.price} className="minimal-input" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Categoria</label>
                    <select name="category" defaultValue={editingInventoryItem.category} className="minimal-input">
                      <option value="beverage">Bebida</option>
                      <option value="food">Comida</option>
                      <option value="service">Serviço</option>
                      <option value="misc">Outros</option>
                    </select>
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setEditingInventoryItem(null)} className="flex-1 px-6 py-3 border border-slate-100 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 rounded-xl transition-all">Cancelar</button>
                  <button type="submit" className="flex-1 px-6 py-3 bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-blue-600 rounded-xl transition-all shadow-lg shadow-slate-200">Salvar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showCheckIn && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6"><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowCheckIn(null); setGuestSearchTerm(''); }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" /><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white rounded-2xl p-8 shadow-2xl">
            <h3 className="text-xl font-bold mb-6">Check-In Quarto {rooms.find(r => r.id === showCheckIn)?.number}</h3>
            <form onSubmit={handleCheckIn} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">HÓSPEDE RESPONSÁVEL</label>
                <input 
                  type="text" 
                  placeholder="Buscar por nome ou CPF..." 
                  value={guestSearchTerm}
                  onChange={e => setGuestSearchTerm(e.target.value)}
                  className="minimal-input text-xs"
                />
                <div className="flex gap-2">
                  <select 
                    required 
                    value={checkInData.guestId} 
                    onChange={e => {
                      if (e.target.value === 'NEW_GUEST') {
                        setShowGuestForm(true);
                      } else {
                        setCheckInData({...checkInData, guestId: e.target.value});
                      }
                    }} 
                    className="flex-1 minimal-input"
                  >
                    <option value="">Selecione hóspede...</option>
                    <option value="NEW_GUEST" className="text-blue-600 font-bold tracking-tighter bg-blue-50">+ NOVO CLIENTE</option>
                    {guests
                      .filter(g => 
                        g.name.toLowerCase().includes(guestSearchTerm.toLowerCase()) || 
                        g.cpf.includes(guestSearchTerm)
                      )
                      .map(g => <option key={g.id} value={g.id}>{g.name} ({g.cpf})</option>)
                    }
                  </select>
                  <button 
                    type="button"
                    onClick={() => setShowGuestForm(true)}
                    className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors shadow-sm flex items-center justify-center shrink-0"
                    title="Cadastrar Novo Hóspede"
                  >
                    <UserPlus size={16} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase">ENTRADA</label><input type="date" required value={checkInData.checkInDate} onChange={e => setCheckInData({...checkInData, checkInDate: e.target.value})} className="minimal-input" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase">SAÍDA</label><input type="date" required value={checkInData.checkOutDate} onChange={e => setCheckInData({...checkInData, checkOutDate: e.target.value})} className="minimal-input" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    ADULTOS (MÁX {showCheckIn ? getRoomCapacity(rooms.find(r => r.id === showCheckIn)?.type || 'couple') : '-'})
                  </label>
                  <input 
                    type="number" 
                    min="1" 
                    max={showCheckIn ? getRoomCapacity(rooms.find(r => r.id === showCheckIn)?.type || 'couple') : 2} 
                    required 
                    value={checkInData.adults} 
                    onChange={e => setCheckInData({...checkInData, adults: parseInt(e.target.value)})} 
                    className="minimal-input" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">CRIANÇAS</label>
                  <input 
                    type="number" 
                    min="0" 
                    required 
                    value={checkInData.children} 
                    onChange={e => setCheckInData({...checkInData, children: parseInt(e.target.value)})} 
                    className="minimal-input" 
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium bg-slate-50 p-3 rounded-lg border border-slate-100 italic">O valor da reserva será calculado com base no número de diárias e categoria do quarto.</p>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => { setShowCheckIn(null); setGuestSearchTerm(''); }} className="flex-1 text-sm font-semibold text-slate-400">Volar</button>
                <button type="submit" className="flex-1 minimal-btn" disabled={!checkInData.guestId}>Confirmar</button>
              </div>
            </form>
          </motion.div></div>
        )}

        {showAddCharge && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6"><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddCharge(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" /><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-white rounded-2xl p-8 shadow-2xl h-[500px] flex flex-col">
            <h3 className="text-xl font-bold mb-6">Lançar Consumo / Serviço</h3>
            <div className="flex-1 overflow-auto divide-y divide-slate-50 pr-2">
              {inventory.map(item => (
                <div key={item.id} className="py-4 flex items-center justify-between group">
                  <div>
                    <p className="font-bold text-slate-900">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">{item.category}</span>
                      <span className="text-[10px] font-bold text-slate-400">{formatPrice(item.price)}</span>
                      <span className="text-[10px] font-medium text-slate-400">• Estoque: {item.stock}</span>
                    </div>
                  </div>
                  <button disabled={item.stock <= 0} onClick={() => addCharge(showAddCharge, item.id)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all disabled:opacity-30">
                    <Plus size={18} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => { setShowAddCharge(null); }} className="mt-8 minimal-btn w-full">Voltar</button>
          </motion.div></div>
        )}

        {showStockUpdate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6"><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowStockUpdate(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" /><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white rounded-2xl p-8 shadow-2xl">
            <h3 className="text-xl font-black mb-6">Atualizar Estoque</h3>
            <p className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-tight">{inventory.find(i => i.id === showStockUpdate)?.name}</p>
            <form onSubmit={handleStockUpdate} className="space-y-5">
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setStockUpdateData({...stockUpdateData, type: 'add'})}
                  className={`flex-1 py-3 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${stockUpdateData.type === 'add' ? 'border-emerald-600 bg-emerald-50 text-emerald-600' : 'border-slate-100 text-slate-300'}`}
                >
                  <PlusCircle size={14} className="mx-auto mb-1" /> Entrada
                </button>
                <button 
                  type="button" 
                  onClick={() => setStockUpdateData({...stockUpdateData, type: 'remove'})}
                  className={`flex-1 py-3 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${stockUpdateData.type === 'remove' ? 'border-red-600 bg-red-50 text-red-600' : 'border-slate-100 text-slate-300'}`}
                >
                  <MinusCircle size={14} className="mx-auto mb-1" /> Saída
                </button>
              </div>
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400">QUANTIDADE</label><input type="number" required min="1" value={stockUpdateData.amount} onChange={e => setStockUpdateData({...stockUpdateData, amount: parseInt(e.target.value)})} className="minimal-input" /></div>
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400">MOTIVO DA ALTERAÇÃO</label><input type="text" required value={stockUpdateData.reason} onChange={e => setStockUpdateData({...stockUpdateData, reason: e.target.value})} className="minimal-input" placeholder="Ex: Reposição, Venda externa, Brinde..." /></div>
              <div className="flex gap-3 pt-4 border-t border-slate-50">
                <button type="button" onClick={() => setShowStockUpdate(null)} className="flex-1 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Cancelar</button>
                <button type="submit" className="flex-1 minimal-btn">Confirmar</button>
              </div>
            </form>
          </motion.div></div>
        )}

        {showCategoryPrices && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6"><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCategoryPrices(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" /><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white rounded-2xl p-8 shadow-2xl">
            <h3 className="text-xl font-black mb-8 leading-tight">Preços das Categorias</h3>
            <div className="space-y-5">
              {roomCategories.map(cat => (
                <div key={cat.value} className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Quarto {cat.label}</label>
                   <input 
                     type="number" 
                     className="minimal-input font-bold" 
                     value={cat.price}
                     onChange={(e) => setRoomCategories(roomCategories.map(c => c.value === cat.value ? { ...c, price: parseFloat(e.target.value) } : c))}
                   />
                </div>
              ))}
              <p className="text-[10px] text-slate-400 italic bg-amber-50 p-4 rounded-xl border border-amber-100">DICA: Alterar estes valores não afetará quartos que já têm preços individuais definidos.</p>
            </div>
            <button onClick={() => setShowCategoryPrices(false)} className="w-full py-4 mt-8 text-black font-bold text-xs uppercase tracking-widest bg-slate-100 rounded-xl hover:bg-slate-200 transition-all">Fechar e Salvar</button>
          </motion.div></div>
        )}

        {showUserForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6"><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowUserForm(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" /><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white rounded-2xl p-8 shadow-2xl">
            <h3 className="text-xl font-black mb-8 leading-tight">Novo Colaborador</h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-6 -mt-4">Todos os colabores podem realizar login no sistema.</p>
            <form onSubmit={registerUser} className="space-y-5">
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase">Nome Completo</label><input type="text" required value={newUserData.name} onChange={e => setNewUserData({...newUserData, name: e.target.value})} className="minimal-input" /></div>
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase">Usuário (Login)</label><input type="text" required value={newUserData.username} onChange={e => setNewUserData({...newUserData, username: e.target.value})} className="minimal-input" /></div>
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase">Senha Provisória</label><input type="password" required value={newUserData.password} onChange={e => setNewUserData({...newUserData, password: e.target.value})} className="minimal-input" /></div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Cargo / Nível</label>
                <select value={newUserData.role} onChange={e => setNewUserData({...newUserData, role: e.target.value as UserRole})} className="minimal-input text-xs font-bold uppercase tracking-widest">
                  <option value="receptionist">Recepcionista</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setShowUserForm(false)} className="flex-1 text-sm font-semibold text-slate-400">Cancelar</button>
                <button type="submit" className="flex-1 minimal-btn">Cadastrar</button>
              </div>
            </form>
          </motion.div></div>
        )}

        {showChangePasswordModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowChangePasswordModal(null); setNewPassword(''); }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white rounded-2xl p-8 shadow-2xl">
              <div className="mb-6">
                <h3 className="text-xl font-black leading-tight">Alterar Senha</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Usuário: {users.find(u => u.id === showChangePasswordModal)?.username}</p>
              </div>
              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Nova Senha</label>
                  <input 
                    type="password" 
                    required 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    className="minimal-input font-mono" 
                    placeholder="••••••••"
                    autoFocus
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => { setShowChangePasswordModal(null); setNewPassword(''); }} className="flex-1 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 rounded-xl hover:bg-slate-100 transition-all">Cancelar</button>
                  <button type="submit" className="flex-1 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all uppercase text-[10px] tracking-widest shadow-lg shadow-slate-100">Atualizar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FinanceCard({ label, value, icon, isTotal = false }: { label: string, value: number, icon: React.ReactNode, isTotal?: boolean }) {
  return (
    <div className={`p-8 rounded-3xl border transition-all ${isTotal ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-100 shadow-sm'}`}>
       <div className="flex justify-between items-start mb-6">
          <span className={`p-3 rounded-2xl ${isTotal ? 'bg-white/10' : 'bg-slate-50'}`}>{icon}</span>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${isTotal ? 'bg-white/10' : 'bg-slate-100 text-slate-400'}`}>HOJE</span>
       </div>
       <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isTotal ? 'text-slate-400' : 'text-slate-400'}`}>{label}</p>
       <p className="text-3xl font-black">R$ {value.toFixed(2).replace('.', ',')}</p>
    </div>
  );
}
