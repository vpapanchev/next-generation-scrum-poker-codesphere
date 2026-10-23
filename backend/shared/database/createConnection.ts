import { Config } from '../types';
import { writeItem } from './store';

export const createConnection = async (ttl: number, { connectionId }: Config) =>
  writeItem({
    primaryKey: `connectionId:${connectionId}`,
    connectionId,
    ttl,
  });
