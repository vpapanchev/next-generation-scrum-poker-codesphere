import {
  PostToConnectionCommandInput,
  PostToConnectionCommandOutput,
} from '@aws-sdk/client-apigatewaymanagementapi';
import { Server } from 'http';
import * as WebSocket from 'ws';
import { generateId } from '../../shared/generateId';
import { onConnect } from '../onconnect/src/on-connect';
import { onDisconnect } from '../ondisconnect/src/on-disconnect';
import { onMessage } from '../sendmessage/src/on-message';
import { ConfigWithHandler } from '../shared/types';

interface WebsocketWithId extends WebSocket {
  id: string;
}

/**
 * Attaches the scrum poker WebSocket protocol to an existing HTTP server, so
 * that frontend and backend can be served from the same port/domain.
 *
 * A note on scaling: connections are tracked in this process' memory (just like
 * the original AWS local server tracks them in `wss.clients`). Running more than
 * one replica therefore breaks message fan-out, which is why `ci.yml` pins
 * `replicas: 1`.
 */
export const attachWebSocketServer = (server: Server, path = '/ws') => {
  const wss = new WebSocket.Server({ server, path });

  wss.on('connection', (ws) => {
    const socketId = generateId(16);
    (ws as WebsocketWithId).id = socketId;

    const config: ConfigWithHandler = {
      connectionId: socketId,
      tableName: 'scrum-poker-local',
      handler: {
        postToConnection: async ({
          ConnectionId,
          Data,
        }: PostToConnectionCommandInput): Promise<PostToConnectionCommandOutput> => {
          // $metadata is required in the return type
          if (!Data) return { $metadata: {} };
          const client = [...wss.clients].find(
            (client) => ConnectionId === (client as WebsocketWithId).id,
          );
          if (!client) {
            throw Object.assign(new Error(`Could not find client with id ${ConnectionId}`), {
              statusCode: 410,
            });
          }
          await new Promise<void>((resolve, reject) =>
            client.send(Data as Buffer, (error) => (error ? reject(error) : resolve())),
          );
          return { $metadata: {} };
        },
      },
    };

    onConnect(config).then((result) => console.log('Connected', socketId, result));

    ws.on('close', () =>
      onDisconnect(config)
        .then((result) => console.log('Disconnected', socketId, result))
        .catch((error) => console.error('Error disconnecting', error)),
    );

    ws.on('unexpected-response', (request, message) =>
      console.error(`Unexpected socket response`, request, message),
    );

    ws.on('error', (error) => console.error('Socket error', error));

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(String(data));
        onMessage(message.data, config).catch((error) =>
          console.error('Error processing message', error),
        );
      } catch (error) {
        console.error('Error parsing message', error);
      }
    });
  });

  return wss;
};
