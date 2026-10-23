import { Config } from '../types';
import { mutateItem } from './store';

export const removeGroupFromConnection = async ({ connectionId }: Config) =>
  mutateItem(`connectionId:${connectionId}`, (item) => {
    delete item.userId;
    delete item.groupId;
  });
