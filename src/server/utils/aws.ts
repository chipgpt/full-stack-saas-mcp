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

export const getDynamoDBClient = once(() => {
  return DynamoDBDocumentClient.from(new DynamoDBClient({}));
});

export async function setSession(key: string, value: IMcpSession) {
  await getDynamoDBClient().send(
    new PutCommand({
      // @ts-ignore  - for some reason it doesn't like this when building
      TableName: Resource.MyDynamoMCPSessionCache.name,
      Item: {
        sessionId: key,
        value: JSON.stringify(value),
        expiresAt: addMinutes(new Date(), 5).getTime(),
      },
    })
  );
  return value;
}

export async function getSession(key: string) {
  const result = await getDynamoDBClient().send(
    new QueryCommand({
      // @ts-ignore  - for some reason it doesn't like this when building
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
      // @ts-ignore  - for some reason it doesn't like this when building
      TableName: Resource.MyDynamoMCPSessionCache.name,
      Key: { sessionId: key },
    })
  );
}
