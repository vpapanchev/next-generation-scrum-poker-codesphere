import { CardValue } from '../../../shared/cards';
import { GroupConnections, GroupItem } from '../types';
import { mutateItem } from './store';

export const setGroupConnectionVote = async (
  groupId: string,
  userId: string,
  vote: CardValue,
): Promise<GroupItem> =>
  mutateItem<GroupItem>(`groupId:${groupId}`, (item) => {
    const connections = (item.connections as GroupConnections | undefined) ?? {};
    connections[userId] = { ...connections[userId], vote };
    item.connections = connections;
  });
