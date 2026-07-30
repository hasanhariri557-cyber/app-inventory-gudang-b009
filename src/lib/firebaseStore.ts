import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  writeBatch 
} from "firebase/firestore";
const firebaseConfig = {
  projectId: "prime-xylopolist-5v8b6",
  appId: "1:152292905925:web:9f8860729b7f4119ecb1ac",
  apiKey: "AIzaSyCrbaLWf7WedIxz-c2-9nydqk9SVpe-A7g",
  authDomain: "prime-xylopolist-5v8b6.firebaseapp.com",
  storageBucket: "prime-xylopolist-5v8b6.firebasestorage.app",
  messagingSenderId: "152292905925",
  firestoreDatabaseId: "ai-studio-gudangb009-7f2dae09-fc55-48db-a7f3-b22cf82601e0"
};

// 1. Inisialisasi Firebase App secara aman
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Hubungkan ke Database khusus Firestore AI Studio
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

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

/**
 * Sync only changed/deleted items to Firestore to reduce quota usage and prevent rate exceeded errors.
 */
export async function syncCollectionIncrementally(
  collectionName: string, 
  newList: any[], 
  oldListStr: string | undefined
) {
  if (!oldListStr) {
    // Fallback to standard sync if old state string is unavailable
    await syncCollectionToFirestore(collectionName, newList);
    return;
  }

  try {
    const oldList = JSON.parse(oldListStr) as any[];
    
    // Create maps of ID -> item
    const oldMap = new Map<string, any>();
    oldList.forEach(item => {
      if (item && item.id !== undefined) oldMap.set(String(item.id), item);
    });

    const newMap = new Map<string, any>();
    newList.forEach(item => {
      if (item && item.id !== undefined) newMap.set(String(item.id), item);
    });

    // 1. Find items to create or update
    const toWrite: any[] = [];
    newList.forEach(newItem => {
      if (!newItem || newItem.id === undefined) return;
      const oldItem = oldMap.get(String(newItem.id));
      if (!oldItem) {
        toWrite.push(newItem);
      } else {
        // Compare values, ignoring dynamic timestamps
        const { updatedAt: oldUpdated, ...oldRest } = oldItem;
        const { updatedAt: newUpdated, ...newRest } = newItem;
        if (JSON.stringify(oldRest) !== JSON.stringify(newRest)) {
          toWrite.push(newItem);
        }
      }
    });

    // 2. Find items to delete
    const toDelete: string[] = [];
    oldList.forEach(oldItem => {
      if (oldItem && oldItem.id !== undefined && !newMap.has(String(oldItem.id))) {
        toDelete.push(String(oldItem.id));
      }
    });

    if (toWrite.length === 0 && toDelete.length === 0) {
      // Nothing changed!
      return;
    }

    console.log(`[Incremental Sync] ${collectionName}: Writing ${toWrite.length} items, deleting ${toDelete.length} items.`);

    // Write changes in batches of 400
    const allOperations: Array<{ type: 'set' | 'delete'; id: string; data?: any }> = [
      ...toWrite.map(item => ({ type: 'set' as const, id: String(item.id), data: item })),
      ...toDelete.map(id => ({ type: 'delete' as const, id, data: undefined }))
    ];

    for (let i = 0; i < allOperations.length; i += 400) {
      const chunk = allOperations.slice(i, i + 400);
      const batch = writeBatch(db);
      
      chunk.forEach(op => {
        const docRef = doc(db, collectionName, op.id);
        if (op.type === 'set' && op.data) {
          batch.set(docRef, {
            ...op.data,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } else if (op.type === 'delete') {
          batch.delete(docRef);
        }
      });
      
      await batch.commit();
    }
  } catch (error) {
    console.error(`Error in syncCollectionIncrementally for ${collectionName}:`, error);
    // Fallback on failure
    await syncCollectionToFirestore(collectionName, newList);
  }
}

