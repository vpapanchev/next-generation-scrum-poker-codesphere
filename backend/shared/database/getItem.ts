import { readItem } from './store';

export const getItem = async <T>(itemKey: string, itemId: string): Promise<T | undefined> =>
  readItem<T>(`${itemKey}:${itemId}`);
