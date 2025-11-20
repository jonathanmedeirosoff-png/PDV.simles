import React, { useState, useEffect } from 'react';
import { Receipt } from './components/Receipt';
import { SettingsForm } from './components/SettingsForm';
import { CartItem, ShopSettings, BluetoothDevice } from './types';
import { generateFooterMessage } from './services/geminiService';
import { connectToBluetoothPrinter, printTicket } from './services/printerService';
import { 
  Printer, 
  Settings, 
  Trash2, 
  Plus, 
  ShoppingCart, 
  Minus, 
  Store,
  Wand2,
  X,
  Bluetooth
} from 'lucide-react';

const DEFAULT_SETTINGS: ShopSettings = {
  shopName: '',
  document: '',
  address: '',
  phone: '',
  footerMessage: 'Obrigado pela preferência!',
  printerWidth: '58mm',
  printerType: 'system',
  printerPaddingLeft: 0
};

function App() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [settings, setSettings] = useState<ShopSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(1);
  
  // Input States
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemQty, setItemQty] = useState(1);

  // AI State
  const [aiMessage, setAiMessage] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Preview State
  const [showPreview, setShowPreview] = useState(false);
  const [orderDate, setOrderDate] = useState(new Date());

  // Bluetooth Printer State
  const [bluetoothDevice, setBluetoothDevice] = useState<BluetoothDevice | null>(null);

  // Load settings from local storage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('jpos_settings');
    const savedOrderId = localStorage.getItem('jpos_orderid');
    if (savedSettings) {
      setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
    } else {
      setIsSettingsOpen(true); // Force settings open on first run
    }
    if (savedOrderId) {
      setCurrentOrderId(parseInt(savedOrderId));
    }
  }, []);

  const saveSettings = (newSettings: ShopSettings) => {
    setSettings(newSettings);
    localStorage.setItem('jpos_settings', JSON.stringify(newSettings));
  };

  const addToCart = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!itemName || !itemPrice) return;

    const price = parseFloat(itemPrice.replace(',', '.'));
    if (isNaN(price)) return;

    const newItem: CartItem = {
      id: Date.now().toString(),
      name: itemName,
      price: price,
      quantity: itemQty
    };

    setCart([...cart, newItem]);
    
    // Reset inputs but keep focus handy
    setItemName('');
    setItemPrice('');
    setItemQty(1);
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleOpenPreview = () => {
    if (cart.length === 0) return;
    setOrderDate(new Date()); // Freeze date for this order
    setShowPreview(true);
  };

  const handleConnectBluetooth = async () => {
    const device = await connectToBluetoothPrinter();
    if (device) {
      setBluetoothDevice(device);
      // If connected via settings, update mode
      if (settings.printerType !== 'bluetooth') {
        saveSettings({ ...settings, printerType: 'bluetooth' });
      }
    }
  };

  const handlePrint = async () => {
    // Logic for Printing
    if (settings.printerType === 'bluetooth' && bluetoothDevice) {
       try {
         await printTicket(bluetoothDevice, settings, cart, cartTotal, currentOrderId, orderDate);
         alert("Enviado para impressora Bluetooth!");
         finishOrder();
       } catch (e) {
         alert("Erro ao imprimir via Bluetooth: " + e);
         console.error(e);
         // Fallback?
         if(confirm("Falha no Bluetooth. Deseja tentar a impressão normal do sistema?")) {
            window.print();
            finishOrder();
         }
       }
    } else {
       // Default System Print
       if (settings.printerType === 'bluetooth' && !bluetoothDevice) {
         alert("Modo Bluetooth ativo mas nenhuma impressora conectada. Usando sistema padrão.");
       }
       window.print();
       finishOrder();
    }
  };
  
  const finishOrder = () => {
    // Post-print clean up logic
    setTimeout(() => {
        setShowPreview(false);
        const nextId = currentOrderId + 1;
        setCurrentOrderId(nextId);
        localStorage.setItem('jpos_orderid', nextId.toString());
        setCart([]);
        setAiMessage(''); // Clear AI message
    }, 1000);
  };

  const handleGenerateAiMessage = async () => {
    if (!settings.shopName) {
      alert("Configure o nome da loja primeiro nas configurações.");
      setIsSettingsOpen(true);
      return;
    }
    setIsGenerating(true);
    const msg = await generateFooterMessage(settings);
    setAiMessage(msg);
    setIsGenerating(false);
  };

  return (
    <div className="h-full flex flex-col md:flex-row print:block">
      
      {/* LEFT PANEL: INPUTS & PRODUCT ENTRY (Hidden on print) */}
      <div className="flex-1 flex flex-col bg-white border-r border-slate-200 print:hidden h-full overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0">
          <div className="flex items-center gap-2">
            <Store className="w-6 h-6 text-emerald-400" />
            <h1 className="font-bold text-xl tracking-tight">JPos</h1>
          </div>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors relative"
          >
            <Settings className="w-5 h-5" />
            {settings.printerType === 'bluetooth' && bluetoothDevice && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full border border-slate-900"></span>
            )}
          </button>
        </div>

        {/* Product Input Form */}
        <div className="p-6 bg-slate-50 shrink-0">
          <form onSubmit={addToCart} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Produto / Serviço</label>
              <input
                type="text"
                className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-lg"
                placeholder="Ex: X-Tudo"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                autoFocus
              />
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Preço (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none text-lg font-mono"
                  placeholder="0,00"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                />
              </div>
              <div className="w-1/3">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Qtd</label>
                <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden h-[52px]">
                  <button 
                    type="button" 
                    className="px-3 py-3 hover:bg-slate-100 text-slate-600 border-r"
                    onClick={() => setItemQty(Math.max(1, itemQty - 1))}
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    className="w-full text-center outline-none font-bold text-slate-800"
                    value={itemQty}
                    onChange={(e) => setItemQty(parseInt(e.target.value) || 1)}
                  />
                  <button 
                    type="button" 
                    className="px-3 py-3 hover:bg-slate-100 text-slate-600 border-l"
                    onClick={() => setItemQty(itemQty + 1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!itemName || !itemPrice}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg shadow-lg transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-lg"
            >
              <Plus size={24} />
              ADICIONAR ITEM
            </button>
          </form>
        </div>

        {/* Quick Visual Cart (Mobile visible) */}
        <div className="flex-1 p-6 overflow-y-auto bg-white md:hidden">
            <h3 className="text-slate-500 font-bold uppercase text-xs mb-3">Itens Recentes</h3>
            {cart.length === 0 ? (
              <p className="text-slate-400 text-center py-4 italic">Carrinho vazio</p>
            ) : (
               <div className="space-y-2">
                 {cart.slice().reverse().map(item => (
                   <div key={item.id} className="flex justify-between items-center p-2 border rounded bg-slate-50">
                      <span className="font-medium">{item.quantity}x {item.name}</span>
                      <span className="font-mono text-sm">R$ {(item.price * item.quantity).toFixed(2)}</span>
                   </div>
                 ))}
               </div>
            )}
        </div>
      </div>

      {/* RIGHT PANEL: CART SUMMARY & ACTIONS (Hidden on print) */}
      <div className="flex-1 flex flex-col bg-slate-100 print:hidden h-full overflow-hidden border-l border-slate-200">
        
        {/* Cart List Header */}
        <div className="p-4 bg-white shadow-sm z-10 flex justify-between items-center">
          <div className="flex items-center gap-2 text-slate-700">
            <ShoppingCart className="w-5 h-5" />
            <h2 className="font-bold text-lg">Pedido Atual #{currentOrderId}</h2>
          </div>
          <button 
            onClick={() => setCart([])}
            disabled={cart.length === 0}
            className="text-red-500 text-sm hover:bg-red-50 px-3 py-1 rounded transition-colors disabled:opacity-50"
          >
            Limpar
          </button>
        </div>

        {/* Scrollable Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
              <ShoppingCart size={64} strokeWidth={1} />
              <p className="mt-4 text-lg font-medium">Nenhum item no pedido</p>
              <p className="text-sm">Adicione produtos ao lado para começar.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 flex items-center justify-between group">
                <div className="flex-1">
                  <p className="font-bold text-slate-800">{item.name}</p>
                  <p className="text-sm text-slate-500">R$ {item.price.toFixed(2)} un.</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-slate-100 rounded">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-slate-200 rounded"><Minus size={14}/></button>
                    <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-slate-200 rounded"><Plus size={14}/></button>
                  </div>
                  
                  <div className="w-20 text-right font-mono font-bold text-slate-700">
                    R$ {(item.price * item.quantity).toFixed(2)}
                  </div>
                  
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* AI Message Section */}
        <div className="bg-indigo-50 p-4 border-t border-indigo-100">
          <div className="flex justify-between items-start mb-2">
             <label className="text-xs font-bold text-indigo-800 uppercase flex items-center gap-1">
                <Wand2 size={12} /> Mensagem do Rodapé (IA)
             </label>
             <button 
               onClick={handleGenerateAiMessage}
               disabled={isGenerating}
               className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded transition-colors disabled:opacity-50"
             >
               {isGenerating ? 'Criando...' : 'Gerar Nova Frase'}
             </button>
          </div>
          
          {aiMessage ? (
             <div className="text-indigo-700 text-sm italic bg-white p-2 rounded border border-indigo-200">
                "{aiMessage}"
                <button onClick={() => setAiMessage('')} className="ml-2 text-xs text-slate-400 underline">Remover</button>
             </div>
          ) : (
            <p className="text-xs text-indigo-400 italic">
              Use a IA para gerar um agradecimento criativo para este cliente específico.
            </p>
          )}
        </div>

        {/* Total & Checkout */}
        <div className="bg-white p-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20">
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-500 font-medium text-lg">Total</span>
            <span className="text-3xl font-bold text-slate-900 font-mono">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartTotal)}
            </span>
          </div>
          
          <button
            onClick={handleOpenPreview}
            disabled={cart.length === 0}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg transform active:scale-[0.99] transition-all flex items-center justify-center gap-3 text-xl"
          >
            <Printer size={28} />
            VISUALIZAR E IMPRIMIR
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsForm 
          settings={settings} 
          onSave={saveSettings} 
          onClose={() => setIsSettingsOpen(false)}
          onConnectBluetooth={handleConnectBluetooth}
          bluetoothDevice={bluetoothDevice}
        />
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 print:hidden animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-100 border-b flex justify-between items-center shrink-0">
              <h2 className="font-bold text-lg text-slate-800">Pré-visualização do Recibo</h2>
              <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-8 bg-slate-300 overflow-y-auto flex-1 flex justify-center">
                <Receipt 
                  cart={cart} 
                  settings={settings} 
                  total={cartTotal} 
                  orderId={currentOrderId}
                  date={orderDate}
                  customFooter={aiMessage}
                  preview={true}
                />
            </div>

            <div className="p-4 border-t bg-white grid grid-cols-2 gap-4 shrink-0">
              <button 
                onClick={() => setShowPreview(false)}
                className="py-3 px-4 rounded-lg font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                Voltar
              </button>
              <button 
                onClick={handlePrint}
                className="py-3 px-4 rounded-lg font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {settings.printerType === 'bluetooth' && bluetoothDevice ? (
                    <><Bluetooth size={20} /> Imprimir BT</>
                ) : (
                    <><Printer size={20} /> Imprimir</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print Component (Always present for printing logic via window.print) */}
      <Receipt 
        cart={cart} 
        settings={settings} 
        total={cartTotal} 
        orderId={currentOrderId}
        date={orderDate}
        customFooter={aiMessage}
        preview={false}
      />

    </div>
  );
}

export default App;