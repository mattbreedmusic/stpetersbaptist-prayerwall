const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');


const s3Client = new S3Client({ region: process.env.AWS_REGION || 'eu-west-2' });

exports.handler = async (event) => {
  try {
    //get all objects in bucket, loop over all names, return back//
    console.log('Event:', JSON.stringify(event, null, 2));

  
    const fileId = `${new Date().toISOString().split('T')[0]}.json`

    // If fileId is provided, redirect to the file



    const command = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: fileId,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    // Return a 302 redirect to the signed URL
    return {
      statusCode: 302,
      headers: {
        'Location': signedUrl,
        'Access-Control-Allow-Origin': '*',
      },
    };



  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Failed to retrieve media',
        details: error.message
      }),
    };
  }
};