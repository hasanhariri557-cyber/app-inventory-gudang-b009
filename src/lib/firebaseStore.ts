import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  writeBatch 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

/**
 * Save a single document to Firestore
 */
export async function saveToFirestore(collectionName: string, docId: string, data: any) {
  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error(`Error saving to collection ${collectionName} with ID ${docId}:`, error);
  }
}

/**
 * Delete a document from Firestore
 */
export async function deleteFromFirestore(collectionName: string, docId: string) {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting from collection ${collectionName} with ID ${docId}:`, error);
  }
}

/**
 * Load all documents from a Firestore collection
 */
export async function loadCollectionFromFirestore(collectionName: string): Promise<any[]> {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const items: any[] = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    return items;
  } catch (error) {
    console.error(`Error loading collection ${collectionName}:`, error);
    return [];
  }
}

/**
 * Sync entire local collection to Firestore (Bulk Overwrite)
 */
export async function syncCollectionToFirestore(collectionName: string, dataList: any[]) {
  try {
    const batch = writeBatch(db);
    
    // 1. Get existing docs to clear if needed (optional, or just overwrite/set)
    // To prevent exceeding batch limit (500), we can loop or do it in chunks.
    const chunks = [];
    for (let i = 0; i < dataList.length; i += 400) {
      chunks.push(dataList.slice(i, i + 400));
    }

    for (const chunk of chunks) {
      const b = writeBatch(db);
      chunk.forEach((item) => {
        if (item && item.id) {
          const docRef = doc(db, collectionName, item.id);
          b.set(docRef, {
            ...item,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      });
      await b.commit();
    }
  } catch (error) {
    console.error(`Error syncing collection ${collectionName}:`, error);
  }
}
