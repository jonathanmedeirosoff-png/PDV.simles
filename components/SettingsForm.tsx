import React, { useState } from 'react';
import { ShopSettings, BluetoothDevice } from '../types';
import { Bluetooth, Store, Printer } from 'lucide-react';

interface SettingsFormProps {
  settings: ShopSettings;
  onSave: (newSettings: ShopSettings) => void;
  onClose: () => void;
  onConnectBluetooth: () => void;
  bluetoothDevice: BluetoothDevice | null;
}

export const SettingsForm: React.FC<SettingsFormProps> = ({ 
  settings, 
  onSave, 
  onClose,
  onConnectBluetooth,
  bluetoothDevice
}) => {
  const [formData, setFormData] = useState<ShopSettings>(settings);
  const [activeTab, setActiveTab] = useState<'general' | 'printer'>('general');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <SettingsIcon /> Configurações
          </h2>
          <button onClick={onClose} className="text-slate-300 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${activeTab === 'general' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Store size={18} /> Dados do Estabelecimento
          </button>
          <button 
            onClick={() => setActiveTab('printer')}
            className={`flex-1 py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${activeTab === 'printer' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Printer size={18} /> Conexão e Impressão
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <form id="settings-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* TAB: GENERAL */}
            {activeTab === 'general' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Estabelecimento</label>
                  <input
                    type="text"
                    name="shopName"
                    value={formData.shopName}
                    onChange={handleChange}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ex: Trailer do João"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CNPJ / CPF</label>
                    <input
                      type="text"
                      name="document"
                      value={formData.document}
                      onChange={handleChange}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="00.000.000/0001-00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefone</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Endereço</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Rua das Flores, 123"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mensagem de Rodapé Padrão</label>
                  <textarea
                    name="footerMessage"
                    value={formData.footerMessage}
                    onChange={handleChange}
                    rows={2}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Obrigado pela preferência!"
                  />
                </div>
              </div>
            )}

            {/* TAB: PRINTER */}
            {activeTab === 'printer' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* Printer Type Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Método de Impressão</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className={`cursor-pointer border rounded-lg p-4 flex items-center gap-3 transition-all ${formData.printerType === 'system' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'hover:bg-slate-50 border-slate-200'}`}>
                      <input 
                        type="radio" 
                        name="printerType" 
                        value="system" 
                        checked={formData.printerType === 'system'} 
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                         <div className="font-bold text-slate-800 flex items-center gap-2">
                            <Printer size={16} /> Nativo do Sistema
                         </div>
                         <div className="text-xs text-slate-500">Usa o diálogo de impressão do navegador (USB, WiFi, Bluetooth pareado no Android/Windows).</div>
                      </div>
                    </label>

                    <label className={`cursor-pointer border rounded-lg p-4 flex items-center gap-3 transition-all ${formData.printerType === 'bluetooth' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'hover:bg-slate-50 border-slate-200'}`}>
                      <input 
                        type="radio" 
                        name="printerType" 
                        value="bluetooth" 
                        checked={formData.printerType === 'bluetooth'} 
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-600"
                      />
                       <div>
                         <div className="font-bold text-slate-800 flex items-center gap-2">
                            <Bluetooth size={16} /> Bluetooth Direto (Beta)
                         </div>
                         <div className="text-xs text-slate-500">Conecta diretamente via App (Requer impressora BLE compatível). Para impressoras antigas, use "Nativo".</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Bluetooth Controls */}
                {formData.printerType === 'bluetooth' && (
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h3 className="font-bold text-sm text-slate-700 mb-3">Gerenciar Dispositivo</h3>
                    
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between bg-white p-3 rounded border border-slate-200">
                        <div className="flex items-center gap-2">
                           <div className={`w-3 h-3 rounded-full ${bluetoothDevice ? 'bg-green-500' : 'bg-red-400'}`}></div>
                           <span className="font-mono text-sm">
                             {bluetoothDevice ? bluetoothDevice.name || "Dispositivo Desconhecido" : "Nenhuma impressora conectada"}
                           </span>
                        </div>
                        <span className="text-xs font-bold text-slate-400">
                          {bluetoothDevice ? "CONECTADO" : "DESCONECTADO"}
                        </span>
                      </div>

                      <button 
                        type="button"
                        onClick={onConnectBluetooth}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                      >
                        <Bluetooth size={20} />
                        {bluetoothDevice ? 'Trocar Impressora' : 'Localizar Impressora Bluetooth'}
                      </button>
                      <p className="text-[10px] text-slate-500 text-center">
                        Nota: O navegador solicitará permissão para parear. Certifique-se de que o Bluetooth está ligado.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Largura do Papel</label>
                    <select
                      name="printerWidth"
                      value={formData.printerWidth}
                      onChange={handleChange}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="58mm">58mm (Bobina Pequena)</option>
                      <option value="80mm">80mm (Bobina Padrão)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3 shrink-0">
           <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 font-bold transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="settings-form"
            className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md transition-transform active:scale-[0.98]"
          >
            Salvar Configurações
          </button>
        </div>

      </div>
    </div>
  );
};

function SettingsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
  );
}