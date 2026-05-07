import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  serverTimestamp,
  Timestamp,
  DocumentReference
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { Asset } from '../types';

const COLLECTION_NAME = 'assets';

export const assetService = {
  async createAsset(userId: string, data: Partial<Asset>) {
    const assetRef = doc(collection(db, COLLECTION_NAME));
    const asset: Partial<Asset> = {
      ...data,
      id: assetRef.id,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    try {
      await setDoc(assetRef, asset);
      return assetRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
    }
  },

  async updateAsset(assetId: string, data: Partial<Asset>) {
    const assetRef = doc(db, COLLECTION_NAME, assetId);
    try {
      await updateDoc(assetRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${assetId}`);
    }
  },

  async deleteAsset(assetId: string) {
    const assetRef = doc(db, COLLECTION_NAME, assetId);
    try {
      await deleteDoc(assetRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${assetId}`);
    }
  },

  subscribeToUserAssets(userId: string, callback: (assets: Asset[]) => void) {
    const q = query(
      collection(db, COLLECTION_NAME), 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const assets = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        purchaseDate: doc.data().purchaseDate || '',
        warrantyExpiry: doc.data().warrantyExpiry || '',
      } as Asset));
      callback(assets);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    });
  },

  async getAssetCount(userId: string) {
    const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.size;
  }
};
