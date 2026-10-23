import { GroupItem } from '../types';
import { mutateItem } from './store';

export const revealGroupVotes = async (groupId: string): Promise<GroupItem> =>
  mutateItem<GroupItem>(`groupId:${groupId}`, (item) => {
    item.visible = true;
  });
