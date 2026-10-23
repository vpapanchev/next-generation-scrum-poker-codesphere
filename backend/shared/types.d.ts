import { ApiGatewayManagementApi } from '@aws-sdk/client-apigatewaymanagementapi';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { CardValue } from '../../shared/cards';

export interface Config {
  connectionId: string;
  tableName: string;
  // Only used by the AWS Lambda handlers. The Codesphere PoC keeps state in
  // process memory, so the local server does not provide a DynamoDB client.
  ddb?: DynamoDBDocument;
}

export interface ConfigWithHandler extends Config {
  handler: Pick<ApiGatewayManagementApi, 'postToConnection'>;
}

export interface ConnectionItem {
  groupId?: string;
  userId?: string;
}

export type GroupConnections = Record<
  string,
  {
    connectionId?: string;
    vote: CardValue;
  }
>;

export interface GroupItem {
  scale: CardValue[];
  ttl: number;
  groupId: string;
  visible: boolean;
  connections: GroupConnections;
}

export interface AWSError extends Error {
  code?: string;
  statusCode?: number;
}
