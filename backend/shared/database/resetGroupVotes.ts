import { VOTE_NOTE_VOTED, VOTE_OBSERVER } from '../../../shared/cards';
import { GroupConnections, GroupItem } from '../types';
import { mutateItem } from './store';

export const resetGroupVotes = async (
  groupId: string,
  updateScale: string[] | false,
): Promise<GroupItem> =>
  mutateItem<GroupItem>(`groupId:${groupId}`, (item) => {
    item.visible = false;
    if (updateScale) {
      item.scale = updateScale as GroupItem['scale'];
    }
    const connections = (item.connections as GroupConnections | undefined) ?? {};
    for (const userId of Object.keys(connections)) {
      if (connections[userId].vote !== VOTE_OBSERVER) {
        connections[userId].vote = VOTE_NOTE_VOTED;
      }
    }
    item.connections = connections;
  });
