import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { LendingHistory } from '../types';

const COLLECTION_NAME = 'lending';

export const lendingService = {
  async lendAsset(userId: string, assetId: string, borrowerName: string, dueDate: string) {
    const assetRef = doc(db, 'assets', assetId);
    const lendingRef = collection(db, COLLECTION_NAME);
    
    // Create record
    const record = {
      userId,
      assetId,
      borrowerName,
      lentDate: new Date().toISOString(),
      dueDate,
      status: 'active'
    };
    
    try {
      const docRef = await addDoc(lendingRef, record);
      
      // Update asset
      await updateDoc(assetRef, {
        lendingStatus: {
          isLent: true,
          borrowerName,
          dueDate,
          lentDate: record.lentDate
        },
        updatedAt: serverTimestamp()
      });
      
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, COLLECTION_NAME);
    }
  },

  async returnAsset(assetId: string, recordId: string) {
    const assetRef = doc(db, 'assets', assetId);
    const lendingRef = doc(db, COLLECTION_NAME, recordId);
    
    try {
      // Update record
      await updateDoc(lendingRef, {
        status: 'returned',
        returnDate: new Date().toISOString()
      });
      
      // Update asset
      await updateDoc(assetRef, {
        'lendingStatus.isLent': false,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, COLLECTION_NAME);
    }
  },

  async getLendingHistory(userId: string, assetId: string) {
    const q = query(
      collection(db, COLLECTION_NAME), 
      where('userId', '==', userId),
      where('assetId', '==', assetId),
      orderBy('lentDate', 'desc')
    );
    try {
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ ...d.data(), id: d.id })) as LendingHistory[];
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      return [];
    }
  }
};
