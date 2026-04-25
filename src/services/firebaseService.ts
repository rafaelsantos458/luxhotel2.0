import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  getDocFromServer
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Guest, Room, Booking, InventoryItem, Transaction, AppUser } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

// Generic CRUD
export async function saveDocument<T extends { id: string }>(collName: string, data: T) {
  try {
    // Basic verification: documents should have a tenantId if they are part of a tenant's data
    await setDoc(doc(db, collName, data.id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, collName);
  }
}

export async function deleteDocument(collName: string, id: string) {
  try {
    await deleteDoc(doc(db, collName, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, collName);
  }
}

// Collection specific listeners
export function subscribeToCollection<T>(collName: string, callback: (data: T[]) => void, tenantId?: string) {
  // If tenantId is provided, filter query. Otherwise, fetch all (for admin or global items)
  let q;
  if (tenantId) {
    q = query(collection(db, collName), where('tenantId', '==', tenantId));
  } else {
    q = query(collection(db, collName));
  }
  
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => doc.data() as T);
    callback(items);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, collName);
  });
}

// Auth simulation or mapping
// Since we are moving to Firebase, we might want to use Firebase Auth properly later.
// For now, let's keep the existing AppUser logic but store them in Firestore.
