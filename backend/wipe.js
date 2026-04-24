const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-south-1' });
const ddb = DynamoDBDocumentClient.from(client);
const TABLE = 'v-noted-notes';

async function wipeTable() {
    console.log(`Starting wipe of table: ${TABLE}`);
    let totalDeleted = 0;
    let ExclusiveStartKey = undefined;

    do {
        const scan = await ddb.send(new ScanCommand({
            TableName: TABLE,
            ExclusiveStartKey,
            ProjectionExpression: 'PK, SK'
        }));

        const items = scan.Items || [];
        if (items.length === 0) break;

        const chunks = [];
        for (let i = 0; i < items.length; i += 25) {
            chunks.push(items.slice(i, i + 25));
        }

        for (const chunk of chunks) {
            await ddb.send(new BatchWriteCommand({
                RequestItems: {
                    [TABLE]: chunk.map(item => ({
                        DeleteRequest: { Key: { PK: item.PK, SK: item.SK } }
                    }))
                }
            }));
            totalDeleted += chunk.length;
            console.log(`Deleted ${totalDeleted} items...`);
        }

        ExclusiveStartKey = scan.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    console.log('Wipe complete!');
}

wipeTable().catch(console.error);
