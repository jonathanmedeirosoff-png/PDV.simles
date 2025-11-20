import { CartItem, ShopSettings, BluetoothDevice } from '../types';

const ESC = '\x1B';
const GS = '\x1D';
const LF = '\x0A';

// Helper to strip accents (simple ASCII fallback for basic printers)
const removeAccents = (str: string) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

// Encoder for ESC/POS commands
class EscPosEncoder {
  private buffer: number[] = [];

  constructor() {
    this.reset();
  }

  reset() {
    this.buffer = [0x1B, 0x40]; // Initialize printer
    return this;
  }

  align(align: 'left' | 'center' | 'right') {
    let val = 0;
    if (align === 'center') val = 1;
    if (align === 'right') val = 2;
    this.buffer.push(0x1B, 0x61, val);
    return this;
  }

  bold(active: boolean) {
    this.buffer.push(0x1B, 0x45, active ? 1 : 0);
    return this;
  }

  text(content: string) {
    // Convert string to Uint8 array (simple encoding)
    // For better international support, we'd need a codepage mapping
    const cleanContent = removeAccents(content);
    for (let i = 0; i < cleanContent.length; i++) {
      this.buffer.push(cleanContent.charCodeAt(i));
    }
    return this;
  }

  newline(count = 1) {
    for (let i = 0; i < count; i++) {
      this.buffer.push(0x0A);
    }
    return this;
  }

  line(char = '-') {
    // Approx width: 58mm ~ 32 chars, 80mm ~ 48 chars (default font)
    // We will assume 32 for safety or standard width
    this.text(char.repeat(32));
    this.newline();
    return this;
  }

  cut() {
    this.buffer.push(0x1D, 0x56, 0x41, 0x03); // Cut with feed
    return this;
  }

  encode(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

export const connectToBluetoothPrinter = async (): Promise<BluetoothDevice | null> => {
  const nav = navigator as any;
  if (!nav.bluetooth) {
    alert("Seu navegador não suporta Web Bluetooth. Use o Chrome ou Edge.");
    return null;
  }

  try {
    // Request device - looking for generic serial services often used by thermal printers
    const device = await nav.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', 'e7810a71-73ae-499d-8c15-faa9aef0c3f2'] 
    });

    if (device.gatt) {
      await device.gatt.connect();
      return device;
    }
    return null;
  } catch (error) {
    console.error('Bluetooth connection failed:', error);
    return null;
  }
};

export const printTicket = async (
  device: BluetoothDevice, 
  settings: ShopSettings, 
  cart: CartItem[], 
  total: number,
  orderId: number,
  date: Date
) => {
  if (!device.gatt?.connected) {
    await device.gatt?.connect();
  }

  // Basic ESC/POS generation
  const encoder = new EscPosEncoder();
  
  // Header
  encoder.align('center').bold(true).text(settings.shopName.toUpperCase()).newline();
  encoder.bold(false).text(settings.address).newline();
  if(settings.phone) encoder.text(`Tel: ${settings.phone}`).newline();
  encoder.line();
  
  // Meta
  encoder.align('left');
  encoder.text(`DATA: ${date.toLocaleDateString()} ${date.toLocaleTimeString().slice(0,5)}`).newline();
  encoder.text(`PEDIDO: #${orderId.toString().padStart(4, '0')}`).newline();
  encoder.line();
  
  // Title
  encoder.align('center').bold(true).text("*** COMPROVANTE ***").newline();
  encoder.line();

  // Items
  encoder.align('left').bold(true).text("ITEM                 QTD   TOTAL").newline().bold(false);
  
  cart.forEach(item => {
    const totalItem = item.price * item.quantity;
    // Simple layout: Name on one line, Qty/Price on next if needed, or compact
    encoder.text(item.name).newline();
    
    // Format numbers
    const q = `${item.quantity}x`.padEnd(5);
    const t = totalItem.toFixed(2).padStart(8);
    
    // Right align numbers roughly
    encoder.align('right').text(`${q} R$ ${t}`).newline().align('left');
  });

  encoder.line();
  
  // Total
  encoder.align('right').bold(true).text(`TOTAL: R$ ${total.toFixed(2)}`).newline();
  encoder.line();
  
  // Footer
  encoder.align('center').bold(false).newline();
  encoder.text(settings.footerMessage || "Obrigado pela preferência!").newline();
  encoder.text("JPos Thermal").newline(3);
  encoder.cut();

  const data = encoder.encode();

  // Send to device
  // Note: We need to find the writable characteristic. 
  // This is a best-guess implementation for generic BLE printers.
  if (device.gatt) {
    const server = await device.gatt.connect();
    const services = await server.getPrimaryServices();
    
    for (const service of services) {
      const characteristics = await service.getCharacteristics();
      for (const char of characteristics) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          // Found a writable characteristic, send data
          // Chunking might be needed for large receipts (MTU limits), but for simple text usually ok
          await char.writeValue(data);
          return;
        }
      }
    }
    throw new Error("Não foi possível encontrar uma via de escrita na impressora.");
  }
};