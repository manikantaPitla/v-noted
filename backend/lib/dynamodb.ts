import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({})
export const ddb = DynamoDBDocumentClient.from(client)

export const TABLE = process.env.NOTES_TABLE || 'vnoted-notes'

export const db = {
  get: (PK: string, SK: string) =>
    ddb.send(new GetCommand({ TableName: TABLE, Key: { PK, SK } })),

  put: (item: Record<string, unknown>) =>
    ddb.send(new PutCommand({ TableName: TABLE, Item: item })),

  update: (PK: string, SK: string, updates: Record<string, unknown>) => {
    const keys = Object.keys(updates)
    const ExpressionAttributeNames: Record<string, string> = {}
    const ExpressionAttributeValues: Record<string, unknown> = {}
    const UpdateExpression = 'SET ' + keys.map((k) => {
      ExpressionAttributeNames[`#${k}`] = k
      ExpressionAttributeValues[`:${k}`] = updates[k]
      return `#${k} = :${k}`
    }).join(', ')

    return ddb.send(new UpdateCommand({
      TableName: TABLE,
      Key: { PK, SK },
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    }))
  },

  delete: (PK: string, SK: string) =>
    ddb.send(new DeleteCommand({ TableName: TABLE, Key: { PK, SK } })),

  batchDelete: async (PK: string, SKs: string[]) => {
    const chunks = []
    for (let i = 0; i < SKs.length; i += 25) chunks.push(SKs.slice(i, i + 25))

    for (const chunk of chunks) {
      await ddb.send(new BatchWriteCommand({
        RequestItems: {
          [TABLE]: chunk.map(SK => ({ DeleteRequest: { Key: { PK, SK } } }))
        }
      }))
    }
  },

  query: (PK: string, IndexName?: string, ConsistentRead?: boolean) =>
    ddb.send(new QueryCommand({
      TableName: TABLE,
      ...(IndexName ? { IndexName } : {}),
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: { ':pk': PK },
      ScanIndexForward: false,
      ConsistentRead,
    })),
}
