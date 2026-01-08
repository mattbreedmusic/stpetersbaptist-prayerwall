const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'eu-west-2' });

// Helper function to convert stream to string
const streamToString = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
};

// Helper function to generate date strings for the last 7 days
const getLast7Days = () => {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
};

exports.handler = async (event) => {
  try {
    console.log('Event:', JSON.stringify(event, null, 2));

    const dates = getLast7Days();
    const allPrayerRequests = [];

    // Fetch data for each of the last 7 days
    for (const date of dates) {
      const fileId = `${date}.json`;
      
      try {
        const command = new GetObjectCommand({
          Bucket: process.env.BUCKET_NAME,
          Key: fileId,
        });

        const response = await s3Client.send(command);
        const bodyString = await streamToString(response.Body);
        const jsonData = JSON.parse(bodyString);

        // Add date field to each entry and add to combined array
        if (Array.isArray(jsonData)) {
          jsonData.forEach(entry => {
            allPrayerRequests.push({
              ...entry,
              date: date
            });
          });
        }
      } catch (error) {
        // File doesn't exist for this date, skip it
        console.log(`No file found for date ${date}, skipping`);
      }
    }

    // Return the concatenated array with proper CORS headers
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify(allPrayerRequests),
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({
        error: 'Failed to retrieve media',
        details: error.message
      }),
    };
  }
};