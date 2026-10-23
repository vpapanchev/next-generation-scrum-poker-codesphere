import { Config } from '../types';
import { mutateItem } from './store';

export const addUserAndGroupToConnection = async (
  groupId: string,
  userId: string,
  { connectionId }: Config,
) =>
  mutateItem(`connectionId:${connectionId}`, (item) => {
    item.userId = userId;
    item.groupId = groupId;
  });
