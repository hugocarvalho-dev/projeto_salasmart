export const MAX_QTY_PER_ITEM = 20;

export interface PItem {
  name: string;
  qty: number;
}

export type ProductCategory = string;

export interface Product {
  id: number;
  name: string;
  category: ProductCategory;
  unit: string;
  active: boolean;
}

export interface DeletionInfo {
  by: string;
  reason: string;
  at: Date;
}

export interface Purchase {
  id: string;
  customerName: string;
  room: string;
  date: Date;
  items: PItem[];
  deletion?: DeletionInfo;
}
