export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export type PrinterType = 'system' | 'bluetooth';

export interface ShopSettings {
  shopName: string;
  document: string; // CNPJ or CPF
  address: string;
  phone: string;
  footerMessage: string;
  printerWidth: '58mm' | '80mm';
  printerType: PrinterType;
  printerPaddingLeft: number; // Spaces to indent
}

export interface GeneratedContent {
  message: string;
}

// Web Bluetooth Types
export interface BluetoothDevice {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
}

export interface BluetoothRemoteGATTServer {
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  getPrimaryServices(service?: string | number): Promise<BluetoothRemoteGATTService[]>;
}

export interface BluetoothRemoteGATTService {
  getCharacteristics(characteristic?: string | number): Promise<BluetoothRemoteGATTCharacteristic[]>;
}

export interface BluetoothRemoteGATTCharacteristic {
  properties: {
    write: boolean;
    writeWithoutResponse: boolean;
  };
  writeValue(value: BufferSource): Promise<void>;
  writeValueWithoutResponse(value: BufferSource): Promise<void>;
}

// Fix for TypeScript not recognizing navigator.bluetooth
declare global {
  interface Navigator {
    bluetooth: any;
  }
}