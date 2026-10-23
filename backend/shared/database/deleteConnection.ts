import { Config } from '../types';
import { deleteItem } from './store';

export const deleteConnection = async ({ connectionId }: Config) =>
  deleteItem(`connectionId:${connectionId}`);
