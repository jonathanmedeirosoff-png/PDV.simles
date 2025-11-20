import React from 'react';
import { CartItem, ShopSettings } from '../types';

interface ReceiptProps {
  cart: CartItem[];
  settings: ShopSettings;
  total: number;
  orderId: number;
  date: Date;
  customFooter?: string;
  preview?: boolean;
}

export const Receipt: React.FC<ReceiptProps> = ({ 
  cart, 
  settings, 
  total, 
  orderId, 
  date,
  customFooter,
  preview = false
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const widthClass = settings.printerWidth === '58mm' ? 'w-[58mm]' : 'w-[80mm]';

  // Defines visibility: 
  // Preview mode: Visible on screen (block), hidden on print (print:hidden) - we don't want to print the preview container
  // Print mode: Hidden on screen (hidden), visible on print (print:block)
  const visibilityClasses = preview 
    ? 'block shadow-2xl ring-1 ring-black/5 print:hidden' 
    : 'hidden print:block';

  return (
    <div 
      id={preview ? "preview-receipt" : "printable-receipt"} 
      className={`${visibilityClasses} font-mono text-xs leading-tight text-black bg-white p-2 mx-auto ${widthClass}`}
    >
      {/* Header */}
      <div className="text-center mb-2">
        <h1 className="font-bold text-base uppercase break-words">{settings.shopName || "LOJA SEM NOME"}</h1>
        {settings.address && <p className="break-words">{settings.address}</p>}
        {settings.phone && <p>Tel: {settings.phone}</p>}
        {settings.document && <p>CNPJ/CPF: {settings.document}</p>}
      </div>

      <div className="border-b border-dashed border-black my-2"></div>

      {/* Info */}
      <div className="flex justify-between mb-2">
        <span>{date.toLocaleDateString()} {date.toLocaleTimeString().slice(0,5)}</span>
        <span>#{orderId.toString().padStart(4, '0')}</span>
      </div>
      
      <div className="text-center font-bold mb-1">*** COMPROVANTE ***</div>

      <div className="border-b border-dashed border-black my-2"></div>

      {/* Items Header */}
      <div className="flex justify-between font-bold mb-1">
        <span className="w-1/2 text-left">ITEM</span>
        <span className="w-1/6 text-right">QTD</span>
        <span className="w-1/3 text-right">TOTAL</span>
      </div>

      {/* Items List */}
      <div className="mb-2">
        {cart.map((item) => (
          <div key={item.id} className="flex justify-between mb-1">
            <span className="w-1/2 text-left truncate pr-1">{item.name}</span>
            <span className="w-1/6 text-right">{item.quantity}x</span>
            <span className="w-1/3 text-right">{formatCurrency(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="border-b border-dashed border-black my-2"></div>

      {/* Totals */}
      <div className="flex justify-between font-bold text-sm mb-4">
        <span>TOTAL:</span>
        <span>{formatCurrency(total)}</span>
      </div>

      <div className="border-b border-dashed border-black my-2"></div>

      {/* Footer */}
      <div className="text-center mt-2">
        <p className="mb-2 italic break-words">{customFooter || settings.footerMessage || "Obrigado pela preferência!"}</p>
        <p className="text-[10px]">EasyPOS Thermal</p>
      </div>
    </div>
  );
};