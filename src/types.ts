export type Category = 
  | 'Electronics' 
  | 'Furniture' 
  | 'Appliances' 
  | 'Clothing' 
  | 'Jewelry' 
  | 'Musical Instruments' 
  | 'Sports Equipment' 
  | 'Others';

export const CATEGORIES: Category[] = [
  'Electronics',
  'Furniture',
  'Appliances',
  'Clothing',
  'Jewelry',
  'Musical Instruments',
  'Sports Equipment',
  'Others'
];

export interface UserProfile {
  uid: string;
  email: string;
  isPro: boolean;
  createdAt: any;
  reminderDaysBefore?: number;
  notificationsEnabled?: boolean;
}

export interface ServiceRecord {
  id: string;
  date: string;
  description: string;
  cost?: number;
}

export interface Asset {
  id: string;
  userId: string;
  name: string;
  category: Category;
  estimatedBrand?: string;
  purchasePrice?: number;
  purchaseDate?: string;
  marketValue?: number;
  depreciationRate?: number;
  lastValuationDate?: string;
  warrantyExpiry?: string;
  imageUrl?: string;
  receiptUrl?: string;
  serialNumber?: string;
  manualUrl?: string;
  serviceHistory?: ServiceRecord[];
  nextMaintenanceDate?: string;
  maintenanceTips?: string[];
  lendingStatus?: {
    isLent: boolean;
    borrowerName?: string;
    dueDate?: string;
    lentDate?: string;
  };
  createdAt: any;
  updatedAt: any;
}

export interface LendingHistory {
  id: string;
  assetId: string;
  borrowerName: string;
  lentDate: string;
  returnDate?: string;
  dueDate: string;
  status: 'active' | 'returned';
}

export interface ChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'model';
  content: string;
  createdAt: any;
}
