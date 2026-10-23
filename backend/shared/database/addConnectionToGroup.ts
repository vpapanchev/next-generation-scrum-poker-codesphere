import { CardValue } from '../../../shared/cards';
import { Config, GroupConnections, GroupItem } from '../types';
import { mutateItem } from './store';

export const addConnectionToGroup = async (
  groupId: string,
  userId: string,
  vote: CardValue,
  { connectionId }: Config,
): Promise<GroupItem> =>
  mutateItem<GroupItem>(`groupId:${groupId}`, (item) => {
    const connections = (item.connections as GroupConnections | undefined) ?? {};
    connections[userId] = { connectionId, vote };
    item.connections = connections;
  });
