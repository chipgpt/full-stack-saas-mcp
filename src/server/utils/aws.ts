import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  PutCommand,
  DynamoDBDocumentClient,
  QueryCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { once } from 'lodash';
import { Resource } from 'sst';
import { addMinutes } from 'date-fns';
import { IMcpSession } from '../mcp/tools';
import { IOauthClientMetadata } from '../../lib/oauth';

export const getDynamoDBClient = once(() => {
  return DynamoDBDocumentClient.from(new DynamoDBClient({}));
});

export async function setSession(key: string, value: IMcpSession) {
  await getDynamoDBClient().send(
    new PutCommand({
      TableName: Resource.MyDynamoMCPSessionCache.name,
      Item: {
        sessionId: key,
        value: JSON.stringify(value),
        expiresAt: Math.floor(addMinutes(new Date(), 5).getTime() / 1000),
      },
    })
  );
  return value;
}

export async function getSession(key: string) {
  const result = await getDynamoDBClient().send(
    new QueryCommand({
      TableName: Resource.MyDynamoMCPSessionCache.name,
      KeyConditionExpression: 'sessionId = :sessionId',
      ExpressionAttributeValues: {
        ':sessionId': key,
      },
    })
  );
  if (result.Items?.length) {
    const session = JSON.parse(result.Items[0].value) as IMcpSession;
    return session;
  }
  return null;
}

export async function deleteSession(key: string) {
  return getDynamoDBClient().send(
    new DeleteCommand({
      TableName: Resource.MyDynamoMCPSessionCache.name,
      Key: { sessionId: key },
    })
  );
}

export async function setClientMetadata(key: string, value: IOauthClientMetadata) {
  await getDynamoDBClient().send(
    new PutCommand({
      TableName: Resource.MyDynamoClientMetadataCache.name,
      Item: {
        clientId: key,
        value: JSON.stringify(value),
        expiresAt: Math.floor(addMinutes(new Date(), 10).getTime() / 1000),
      },
    })
  );
  return value;
}

export async function getClientMetadata(key: string) {
  const result = await getDynamoDBClient().send(
    new QueryCommand({
      TableName: Resource.MyDynamoClientMetadataCache.name,
      KeyConditionExpression: 'clientId = :clientId',
      ExpressionAttributeValues: {
        ':clientId': key,
      },
    })
  );
  if (result.Items?.length) {
    const clientMetadata = JSON.parse(result.Items[0].value) as IOauthClientMetadata;
    return clientMetadata;
  }
  return null;
}
