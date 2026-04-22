import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({ region: 'ap-south-1' })
const ddb = DynamoDBDocumentClient.from(client)
const TABLE = 'vnoted-notes'

async function wipeTable() {
  console.log(`Starting wipe of table: ${TABLE}`)
  
  let totalDeleted = 0
  let ExclusiveStartKey: any = undefined
  
  do {
    const scan: any = await ddb.send(new ScanCommand({ 
      TableName: TABLE,
      ExclusiveStartKey,
      ProjectionExpression: 'PK, SK'
    }))
    
    const items = scan.Items || []
    if (items.length === 0) break
    
    const chunks = []
    for (let i = 0; i < items.length; i += 25) {
      chunks.push(items.slice(i, i + 25))
    }
    
    for (const chunk of chunks) {
      await ddb.send(new BatchWriteCommand({
        RequestItems: {
          [TABLE]: chunk.map(item => ({
            DeleteRequest: { Key: { PK: item.PK.S, SK: item.SK.S } }
          }))
        }
      }))
      totalDeleted += chunk.length
      console.log(`Deleted ${totalDeleted} items...`)
    }
    
    ExclusiveStartKey = scan.LastEvaluatedKey
  } while (ExclusiveStartKey)
  
  console.log('Wipe complete!')
}

wipeTable().catch(console.error)
