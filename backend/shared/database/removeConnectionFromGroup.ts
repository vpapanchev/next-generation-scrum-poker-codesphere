import { GroupConnections, GroupItem } from '../types';
import { mutateItem } from './store';

export const removeConnectionFromGroup = async (
  userId: string,
  groupId: string,
): Promise<GroupItem> =>
  mutateItem<GroupItem>(`groupId:${groupId}`, (item) => {
    const connections = item.connections as GroupConnections | undefined;
    const connection = connections?.[userId];
    if (connection) {
      delete connection.connectionId;
    }
  });
