import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

import { COLLECTION } from '@/constants';
import { db } from '@/lib/firebase';
import type { Order } from '@/shared/types';

export const orderService = {
  async create(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION.ORDERS), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async updateStatus(id: string, status: Order['status'], extra?: Partial<Order>): Promise<void> {
    await updateDoc(doc(db, COLLECTION.ORDERS, id), {
      status,
      ...extra,
      updatedAt: serverTimestamp(),
    });
  },

  async getById(id: string): Promise<Order | null> {
    const snap = await getDoc(doc(db, COLLECTION.ORDERS, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Order;
  },

  async getByBuyer(buyerId: string): Promise<Order[]> {
    const q = query(
      collection(db, COLLECTION.ORDERS),
      where('buyerId', '==', buyerId),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
  },

  async getBySeller(sellerId: string): Promise<Order[]> {
    const q = query(
      collection(db, COLLECTION.ORDERS),
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
  },
};
