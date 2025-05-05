import { db, storage } from './firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  getDocs, 
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Collection names
const MESSAGES_COLLECTION = 'messages';

// Message types
export interface FirebaseMessage {
  id?: string;
  content: string;
  orderId?: number | null;
  userId: number;
  isAdmin: boolean;
  createdAt: any;
  isRead: boolean;
  subject?: string;
  imageUrl?: string;
}

// Create a new message
export async function createMessage(message: Omit<FirebaseMessage, 'createdAt' | 'id'>) {
  try {
    const docRef = await addDoc(collection(db, MESSAGES_COLLECTION), {
      ...message,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating message:', error);
    throw error;
  }
}

// Get messages for a specific user
export function getUserMessages(userId: number, callback: (messages: FirebaseMessage[]) => void) {
  const q = query(
    collection(db, MESSAGES_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const messages: FirebaseMessage[] = [];
    querySnapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data()
      } as FirebaseMessage);
    });
    callback(messages);
  });
}

// Get messages for an order
export function getOrderMessages(orderId: number, callback: (messages: FirebaseMessage[]) => void) {
  const q = query(
    collection(db, MESSAGES_COLLECTION),
    where('orderId', '==', orderId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const messages: FirebaseMessage[] = [];
    querySnapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data()
      } as FirebaseMessage);
    });
    callback(messages);
  });
}

// Get all messages (admin only)
export function getAllMessages(callback: (messages: FirebaseMessage[]) => void) {
  const q = query(
    collection(db, MESSAGES_COLLECTION),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const messages: FirebaseMessage[] = [];
    querySnapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data()
      } as FirebaseMessage);
    });
    callback(messages);
  });
}

// Mark a message as read
export async function markMessageAsRead(messageId: string | string[]) {
  try {
    if (Array.isArray(messageId)) {
      // Batch update for multiple messages
      const batch = db.batch();
      messageId.forEach((id) => {
        const messageRef = doc(db, MESSAGES_COLLECTION, id);
        batch.update(messageRef, { isRead: true });
      });
      await batch.commit();
      return true;
    } else {
      // Single message update
      const messageRef = doc(db, MESSAGES_COLLECTION, messageId);
      await updateDoc(messageRef, {
        isRead: true
      });
      return true;
    }
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
}

// Upload an image and return the URL
export async function uploadMessageImage(file: File, userId: number): Promise<string> {
  try {
    const timestamp = Date.now();
    const storageRef = ref(storage, `message-images/${userId}_${timestamp}_${file.name}`);
    const uploadResult = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(uploadResult.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}