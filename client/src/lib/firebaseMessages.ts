import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Type definitions for compatibility with old code
export interface FirebaseMessage {
  id?: string;
  content: string;
  orderId: number;
  userId: number;
  isAdmin?: boolean;
  isFromAdmin?: boolean;
  createdAt: any;
  isRead: boolean;
  subject?: string;
  imageUrl?: string;
}

// Order summary type - matches the server-side type
export interface OrderSummary {
  orderId: number;
  orderNumber?: string;
  date: Date;
  hasMessages: boolean;
  unreadCount?: number;
}

// For API migration - now simply passes through to the API
export async function createMessage(message: Omit<FirebaseMessage, 'createdAt' | 'id'>) {
  try {
    // Format the message for the API
    const apiMessage = {
      content: message.content || '',
      userId: Number(message.userId),
      orderId: Number(message.orderId),
      isFromAdmin: Boolean(message.isFromAdmin || message.isAdmin),
      subject: message.subject || `הודעה להזמנה ${message.orderId}`,
      imageUrl: message.imageUrl
    };
    
    // Admin message
    if (apiMessage.isFromAdmin) {
      const response = await fetch(`/api/admin/orders/${apiMessage.orderId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiMessage)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create admin message: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.id;
    }
    // User message
    else {
      const response = await fetch(`/api/orders/${apiMessage.orderId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiMessage)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create user message: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.id;
    }
  } catch (error) {
    console.error('Error creating message:', error);
    throw error;
  }
}

// Mark a message as read using the API
export async function markMessageAsRead(messageId: string | string[] | number | number[], orderId: number) {
  try {
    if (Array.isArray(messageId)) {
      // Mark multiple messages as read
      const promises = messageId.map(id => 
        fetch(`/api/messages/${id}/read`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' }
        })
      );
      
      const results = await Promise.allSettled(promises);
      const failures = results.filter(result => result.status === 'rejected');
      
      if (failures.length > 0) {
        console.error('Error marking some messages as read:', failures);
      }
      
      return failures.length === 0;
    } else {
      // Mark single message as read
      const response = await fetch(`/api/messages/${messageId}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to mark message as read: ${response.statusText}`);
      }
      
      return true;
    }
  } catch (error) {
    console.error('Error marking message as read:', error);
    return false;
  }
}

// Stub functions for backward compatibility
export function getOrderMessages() {
  console.warn('getOrderMessages is deprecated - use API endpoints directly');
  return () => {}; // no-op unsubscribe function
}

export function getUserMessages() {
  console.warn('getUserMessages is deprecated - use API endpoints directly');
  return () => {}; // no-op unsubscribe function
}

export function getUnreadMessagesCount() {
  console.warn('getUnreadMessagesCount is deprecated - use API endpoints directly');
  return () => {}; // no-op unsubscribe function
}

export function getUserOrdersWithMessages() {
  console.warn('getUserOrdersWithMessages is deprecated - use API endpoints directly');
  return () => {}; // no-op unsubscribe function
}

// Type definition for API migration
export interface OrderWithLatestMessage {
  orderId: number;
  orderNumber?: string;
  latestMessage: FirebaseMessage;
  unreadCount: number;
  date?: Date;
}

// Function for uploading a message image
export async function uploadMessageImage(file: File): Promise<string> {
  try {
    // Create a reference to the file in Firebase Storage
    const imageRef = ref(storage, `message_images/${new Date().getTime()}_${file.name}`);
    
    // Upload the file to Firebase Storage
    const snapshot = await uploadBytes(imageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading message image:', error);
    throw error;
  }
}