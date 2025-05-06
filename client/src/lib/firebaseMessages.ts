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
  doc,
  writeBatch,
  collectionGroup,
  limit,
  Timestamp,
  setDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Collection names
const ORDERS_COLLECTION = 'orders';
const MESSAGES_SUBCOLLECTION = 'messages';

// Log Firebase configuration for debugging
console.log('Firebase setup initialized');

// Message types
export interface FirebaseMessage {
  id?: string;
  content: string;
  orderId: number;
  userId: number;
  isAdmin: boolean;
  createdAt: any;
  isRead: boolean;
  subject?: string;
  imageUrl?: string;
}

// Helper to get the order document reference
function getOrderRef(orderId: number) {
  console.log(`Getting order ref for order ID: ${orderId}`);
  return doc(db, ORDERS_COLLECTION, orderId.toString());
}

// Helper to get the messages collection for an order
function getOrderMessagesCollection(orderId: number) {
  console.log(`Getting messages collection for order ID: ${orderId}`);
  return collection(getOrderRef(orderId), MESSAGES_SUBCOLLECTION);
}

// Function to create a guaranteed test message for a specific order
export async function createTestMessage(orderId: number, userId: number, isAdmin: boolean): Promise<string> {
  console.log(`Creating test message for order ${orderId}, user ${userId}, isAdmin: ${isAdmin}`);
  
  try {
    // First, ensure the order document exists
    const orderRef = getOrderRef(orderId);
    await setDoc(orderRef, { exists: true, updatedAt: new Date().toISOString() }, { merge: true });
    console.log(`Order document ensured: ${orderId}`);
    
    // Create the message document directly
    const messagesCollection = getOrderMessagesCollection(orderId);
    const message = {
      content: `Test message created at ${new Date().toLocaleString()}`,
      orderId: orderId,
      userId: userId,
      isAdmin: isAdmin,
      isRead: false,
      createdAt: new Date(),
      subject: `Test message for order ${orderId}`
    };
    
    console.log('Creating message with data:', message);
    const docRef = await addDoc(messagesCollection, message);
    console.log(`Test message created with ID: ${docRef.id}`);
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating test message:', error);
    throw error;
  }
}

// Create a new message for a specific order
export async function createMessage(message: Omit<FirebaseMessage, 'createdAt' | 'id'>) {
  console.log('🔥 Starting createMessage with input:', JSON.stringify(message));
  
  try {
    if (!message.orderId) {
      console.error('❌ Order ID is missing in message');
      throw new Error('Order ID is required');
    }

    // Convert orderId to a number to ensure consistency
    const orderId = Number(message.orderId);
    if (isNaN(orderId)) {
      console.error('❌ Invalid order ID format:', message.orderId);
      throw new Error('Invalid order ID - must be a number');
    }

    // Make sure to validate and sanitize data
    const sanitizedMessage = {
      content: message.content || '',
      userId: Number(message.userId),
      orderId: orderId,
      isAdmin: Boolean(message.isAdmin),
      isRead: Boolean(message.isRead),
      createdAt: serverTimestamp(),
      // Only include non-null values
      ...(message.subject && { subject: message.subject }),
      ...(message.imageUrl && { imageUrl: message.imageUrl })
    };
    
    console.log('🔥 Creating message for order:', orderId);
    console.log('🔥 Message data (sanitized):', JSON.stringify({
      ...sanitizedMessage,
      createdAt: '(serverTimestamp)'
    }));
    
    // First get a reference to the order document
    const orderRef = getOrderRef(orderId);
    console.log('🔥 Order reference path:', orderRef.path);
    
    // DIRECT METHOD: First ensure the order document exists
    console.log('🔥 Ensuring order document exists using direct setDoc method');
    try {
      await setDoc(orderRef, { 
        exists: true, 
        updatedAt: new Date().toISOString(),
        orderCreated: true
      }, { merge: true });
      console.log('✅ Order document ensured directly:', orderId.toString());
    } catch (orderError) {
      console.error('❌ Error ensuring order document exists (direct method):', orderError);
    }
    
    // Add message to the order's messages subcollection
    console.log('🔥 Getting messages collection for order', orderId);
    const messagesCollection = getOrderMessagesCollection(orderId);
    console.log('🔥 Messages collection path:', messagesCollection.path);
    
    console.log('🔥 Adding document to messages collection');
    try {
      const docRef = await addDoc(messagesCollection, sanitizedMessage);
      console.log('✅ Message created with ID:', docRef.id, 'for order:', orderId);
      
      // Immediately verify the message was created
      const messageSnapshot = await getDocs(query(messagesCollection, limit(10)));
      console.log(`🔥 Messages collection now has ${messageSnapshot.size} documents`);
      messageSnapshot.forEach(doc => {
        console.log(`🔥 Message found - ID: ${doc.id}, content: ${doc.data().content?.substring(0, 20) || '(no content)'}...`);
      });
      
      return docRef.id;
    } catch (addError) {
      console.error('❌ Error adding message to collection:', addError);
      throw addError;
    }
  } catch (error) {
    console.error('❌ Error creating message:', error);
    throw error;
  }
}

// Get messages for a specific user by joining all their orders' messages
export function getUserMessages(userId: number, callback: (messages: FirebaseMessage[]) => void) {
  // Query all messages from all orders
  const q = query(
    collectionGroup(db, MESSAGES_SUBCOLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const messages: FirebaseMessage[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        ...data,
        // Ensure orderId is included since we're using collectionGroup
        orderId: data.orderId
      } as FirebaseMessage);
    });
    callback(messages);
  });
}

// Get messages for a specific order
export function getOrderMessages(orderId: number, callback: (messages: FirebaseMessage[]) => void) {
  console.log(`Subscribing to messages for order ${orderId}`);
  
  // Get collection reference for this order's messages
  const messagesCollection = getOrderMessagesCollection(orderId);
  
  // Create query sorted by creation time (oldest first)
  const q = query(
    messagesCollection,
    orderBy('createdAt', 'asc')
  );

  // Subscribe to real-time updates
  return onSnapshot(q, (querySnapshot) => {
    console.log(`Received ${querySnapshot.size} messages for order ${orderId}`);
    
    const messages: FirebaseMessage[] = [];
    
    querySnapshot.forEach((doc) => {
      try {
        const data = doc.data();
        console.log(`Message for order ${orderId}: ${data.content?.substring(0, 20) || '(no content)'}... from ${data.isAdmin ? 'admin' : 'user'} (${data.userId})`);
        
        messages.push({
          id: doc.id,
          ...data,
          orderId // Ensure orderId is included
        } as FirebaseMessage);
      } catch (error) {
        console.error('Error processing message document:', error);
      }
    });
    
    // Log the result and return messages through callback
    console.log(`Returning ${messages.length} messages for order ${orderId}`);
    callback(messages);
  });
}

// Get all messages grouped by order (admin only)
export function getAllOrdersWithMessages(callback: (messages: Record<number, FirebaseMessage[]>) => void) {
  // Query all messages from all orders
  const q = query(
    collectionGroup(db, MESSAGES_SUBCOLLECTION),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const messagesByOrder: Record<number, FirebaseMessage[]> = {};
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const orderId = data.orderId;
      
      if (!messagesByOrder[orderId]) {
        messagesByOrder[orderId] = [];
      }
      
      messagesByOrder[orderId].push({
        id: doc.id,
        ...data,
        orderId
      } as FirebaseMessage);
    });
    
    // Sort messages within each order
    Object.keys(messagesByOrder).forEach((orderId) => {
      messagesByOrder[Number(orderId)].sort((a, b) => {
        const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return aTime - bTime;
      });
    });
    
    callback(messagesByOrder);
  });
}

// Get all messages (admin only) - for backward compatibility
export function getAllMessages(callback: (messages: FirebaseMessage[]) => void) {
  // Query all messages from all orders
  const q = query(
    collectionGroup(db, MESSAGES_SUBCOLLECTION),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const messages: FirebaseMessage[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        ...data,
        orderId: data.orderId
      } as FirebaseMessage);
    });
    callback(messages);
  });
}

// Get all unique orders with their latest message (admin only)
export function getAllOrdersWithLatestMessages(callback: (orders: OrderWithLatestMessage[]) => void) {
  // Query all messages from all orders
  const q = query(
    collectionGroup(db, MESSAGES_SUBCOLLECTION),
    orderBy('createdAt', 'desc') // Get in descending order to easily find latest
  );

  return onSnapshot(q, (querySnapshot) => {
    const orderMap = new Map<number, OrderWithLatestMessage>();
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as FirebaseMessage;
      data.id = doc.id;
      
      const orderId = data.orderId;
      
      if (!orderMap.has(orderId)) {
        // First message for this order, initialize with latest message
        orderMap.set(orderId, {
          orderId,
          latestMessage: data,
          unreadCount: !data.isAdmin && !data.isRead ? 1 : 0
        });
      } else {
        // Already have an entry for this order
        const orderData = orderMap.get(orderId)!;
        
        // Update unread count if needed
        if (!data.isAdmin && !data.isRead) {
          orderData.unreadCount++;
        }
      }
    });
    
    // Convert map to array and sort by latest message timestamp (most recent first)
    const orders = Array.from(orderMap.values()).sort((a, b) => {
      const aTime = a.latestMessage.createdAt?.toDate?.() 
        ? a.latestMessage.createdAt.toDate().getTime() 
        : new Date(a.latestMessage.createdAt).getTime();
      
      const bTime = b.latestMessage.createdAt?.toDate?.() 
        ? b.latestMessage.createdAt.toDate().getTime() 
        : new Date(b.latestMessage.createdAt).getTime();
      
      return bTime - aTime; // Descending order (newest first)
    });
    
    callback(orders);
  });
}

// Get unique order IDs with their latest message for a user
export interface OrderWithLatestMessage {
  orderId: number;
  latestMessage: FirebaseMessage;
  unreadCount: number;
  date?: Date; // Date for display purposes
}

// Order summary for display in the sidebar
export interface OrderSummary {
  orderId: number;
  date: Date;
  hasMessages: boolean;
  unreadCount?: number;
}

// Get all orders that have messages
export async function getOrdersWithMessages(): Promise<OrderSummary[]> {
  try {
    // First get all distinct orders
    const ordersQuery = query(collection(db, ORDERS_COLLECTION));
    const ordersSnapshot = await getDocs(ordersQuery);
    
    const orders: { id: number; date: Date }[] = [];
    
    ordersSnapshot.forEach(doc => {
      const orderId = Number(doc.id);
      orders.push({
        id: orderId,
        date: new Date() // Default date, will be updated with latest message date
      });
    });
    
    // For each order, check if it has messages
    const ordersWithMessages = await Promise.all(
      orders.map(async (order) => {
        const messagesQuery = query(
          collection(db, ORDERS_COLLECTION, order.id.toString(), MESSAGES_SUBCOLLECTION),
          orderBy('createdAt', 'desc'),
          // Limit to 1 to get the most recent message
          // limit(1)
        );
        
        const messagesSnapshot = await getDocs(messagesQuery);
        
        if (!messagesSnapshot.empty) {
          // Order has messages
          const latestMessage = messagesSnapshot.docs[0].data() as FirebaseMessage;
          const date = latestMessage.createdAt?.toDate?.() 
            ? latestMessage.createdAt.toDate() 
            : new Date();
            
          return {
            orderId: order.id,
            hasMessages: true,
            date
          };
        }
        
        return {
          orderId: order.id,
          hasMessages: false,
          date: order.date
        };
      })
    );
    
    // Filter out orders without messages and sort by ID ascending
    return ordersWithMessages
      .filter(order => order.hasMessages)
      .sort((a, b) => a.orderId - b.orderId);
  } catch (error) {
    console.error('Error getting orders with messages:', error);
    throw error;
  }
}

export function getUserOrdersWithMessages(userId: number, callback: (orders: OrderWithLatestMessage[]) => void) {
  console.log(`Subscribing to Firebase messages for user ${userId}`);
  
  // Query all messages from all orders
  const q = query(
    collectionGroup(db, MESSAGES_SUBCOLLECTION),
    orderBy('createdAt', 'desc') // Get in descending order to easily find latest
  );

  return onSnapshot(q, (querySnapshot) => {
    console.log(`Received ${querySnapshot.size} Firebase messages in snapshot`);
    const orderMap = new Map<number, OrderWithLatestMessage>();
    
    querySnapshot.forEach((doc) => {
      try {
        const data = doc.data() as FirebaseMessage;
        data.id = doc.id;
        
        // Skip messages without orderId
        if (!data.orderId) {
          console.log('Skipping message without orderId:', data);
          return;
        }
        
        const orderId = data.orderId;
        
        // We want to include messages that:
        // 1. Are from this user (userId matches), OR
        // 2. Are for this user (in their orders AND from admin)
        const isFromThisUser = data.userId === userId;
        const isForThisUser = data.isAdmin && data.orderId && data.userId !== userId;
        
        // Include messages that are from this user OR messages from admin to this user's orders
        if (isFromThisUser || isForThisUser) {
          console.log(`Processing message for order ${orderId}, user ${data.userId}, isAdmin: ${data.isAdmin}`);
          
          if (!orderMap.has(orderId)) {
            // First message for this order, initialize with latest message
            orderMap.set(orderId, {
              orderId,
              latestMessage: data,
              unreadCount: data.isAdmin && !data.isRead ? 1 : 0
            });
          } else {
            // Already have an entry for this order
            const orderData = orderMap.get(orderId)!;
            
            // Update unread count if needed
            if (data.isAdmin && !data.isRead) {
              orderData.unreadCount++;
            }
            
            // We're already sorted by descending date, so we don't need to update latestMessage
            // since the first message we encounter for each order is already the latest
          }
        }
      } catch (error) {
        console.error('Error processing message in getUserOrdersWithMessages:', error);
      }
    });
    
    // Convert map to array and sort by latest message timestamp (most recent first)
    const orders = Array.from(orderMap.values()).sort((a, b) => {
      try {
        const aTime = a.latestMessage.createdAt?.toDate?.() 
          ? a.latestMessage.createdAt.toDate().getTime() 
          : new Date(a.latestMessage.createdAt).getTime();
        
        const bTime = b.latestMessage.createdAt?.toDate?.() 
          ? b.latestMessage.createdAt.toDate().getTime() 
          : new Date(b.latestMessage.createdAt).getTime();
        
        return bTime - aTime; // Descending order (newest first)
      } catch (error) {
        console.error('Error sorting messages:', error);
        return 0;
      }
    });
    
    console.log(`Returning ${orders.length} orders with messages for user ${userId}`);
    callback(orders);
  });
}

// Mark a message as read
export async function markMessageAsRead(messageId: string | string[], orderId: number) {
  try {
    if (Array.isArray(messageId)) {
      // Batch update for multiple messages
      const batch = writeBatch(db);
      messageId.forEach((id) => {
        const messageRef = doc(getOrderMessagesCollection(orderId), id);
        batch.update(messageRef, { isRead: true });
      });
      await batch.commit();
      return true;
    } else {
      // Single message update
      const messageRef = doc(getOrderMessagesCollection(orderId), messageId);
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

// Get unread messages count for a user or admin
export function getUnreadMessagesCount(userId: number, isAdmin: boolean, callback: (count: number) => void) {
  // Query all messages from all orders that are unread
  const q = query(
    collectionGroup(db, MESSAGES_SUBCOLLECTION),
    where('isRead', '==', false),
    ...(isAdmin ? 
      [where('isAdmin', '==', false)] : // Admin sees unread messages from users
      [where('userId', '==', userId), where('isAdmin', '==', true)]) // User sees unread messages from admin
  );

  return onSnapshot(q, (querySnapshot) => {
    callback(querySnapshot.size);
  });
}

// Get all orders with messages for admin view (real-time updates)
export function getOrderConversations(callback: (orders: OrderSummary[]) => void) {
  console.log('Subscribing to order conversations for admin view');
  
  // Query all messages from all orders without filtering
  const q = query(
    collectionGroup(db, MESSAGES_SUBCOLLECTION),
    orderBy('createdAt', 'desc') // Get in descending order to easily find latest
  );

  return onSnapshot(q, (querySnapshot) => {
    console.log(`Received ${querySnapshot.size} messages in admin order conversations snapshot`);
    const orderMap = new Map<number, OrderSummary>();
    
    // Process each message to build order conversations list
    querySnapshot.forEach((doc) => {
      try {
        const data = doc.data() as FirebaseMessage;
        data.id = doc.id;
        
        // Skip messages without orderId
        if (!data.orderId) {
          console.log('Skipping message without orderId:', data);
          return;
        }
        
        const orderId = data.orderId;
        console.log(`Processing message in admin view for order ${orderId}, from ${data.isAdmin ? 'admin' : 'user'} ${data.userId}, content: ${data.content.substring(0, 20)}...`);
        
        // Get creation date
        const date = data.createdAt?.toDate?.() 
          ? data.createdAt.toDate() 
          : new Date(data.createdAt);
        
        if (!orderMap.has(orderId)) {
          // First message for this order (will be the latest due to desc ordering)
          orderMap.set(orderId, {
            orderId,
            date,
            hasMessages: true,
            unreadCount: !data.isAdmin && !data.isRead ? 1 : 0
          });
        } else {
          // Already have an entry for this order
          const orderData = orderMap.get(orderId)!;
          
          // Update unread count if needed
          if (!data.isAdmin && !data.isRead) {
            orderData.unreadCount = (orderData.unreadCount || 0) + 1;
          }
        }
      } catch (error) {
        console.error('Error processing message in getOrderConversations:', error);
      }
    });
    
    // Convert map to array and sort by order ID
    const orders = Array.from(orderMap.values()).sort((a, b) => a.orderId - b.orderId);
    console.log(`Returning ${orders.length} order conversations in admin view. Order IDs: ${orders.map(o => o.orderId).join(', ')}`);
    callback(orders);
  });
}

// Upload an image and return the URL
export async function uploadMessageImage(file: File, userId: number, orderId: number): Promise<string> {
  try {
    const timestamp = Date.now();
    const storageRef = ref(storage, `order-messages/${orderId}/${userId}_${timestamp}_${file.name}`);
    const uploadResult = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(uploadResult.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}