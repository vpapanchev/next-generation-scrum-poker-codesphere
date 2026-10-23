import { GroupConnections, GroupItem } from '../types';
import { mutateItem } from './store';

export const removeConnectionsFromGroup = async (
  groupId: string,
  removedUserIds: string[],
): Promise<GroupItem> =>
  mutateItem<GroupItem>(`groupId:${groupId}`, (item) => {
    const connections = (item.connections as GroupConnections | undefined) ?? {};
    for (const userId of removedUserIds) {
      Reflect.deleteProperty(connections, userId);
    }
    item.connections = connections;
  });
