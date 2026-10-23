import { GroupItem } from '../types';
import { getItem } from './getItem';

export const getGroup = async (groupId: string): Promise<GroupItem | undefined> =>
  getItem<GroupItem>('groupId', groupId);
