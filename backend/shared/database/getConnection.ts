import { Config, ConnectionItem } from '../types';
import { getItem } from './getItem';

export const getConnection = async ({
  connectionId,
}: Config): Promise<ConnectionItem | undefined> => {
  const connection = await getItem<ConnectionItem>('connectionId', connectionId);
  if (!connection) {
    console.error('No connection found for connectionId', connectionId);
  }
  return connection;
};
