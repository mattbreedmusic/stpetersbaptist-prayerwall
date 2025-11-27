const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const { authenticationWrapper } = require('../utils/authenticationWrapper');

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'eu-central-1' });

/**
 * Handler for getting a presigned URL for uploading a media file to S3
 * This is a simple handler that generates a presigned URL for uploading a media file to S3
 */
exports.handler = authenticationWrapper(async (event) => {
  try {
    console.log('Event:', JSON.stringify(event, null, 2));

    // Parse the request body
    const body = event.body ? JSON.parse(event.body) : {};
    
    const { fileName, fileType } = body;

    if (!fileName || !fileType) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          error: 'Missing required fields: fileName, fileType' 
        }),
      };
    }

    // Generate unique file name
    const fileId = uuidv4();
    const extension = fileName.split('.').pop();
    const key = `uploads/${fileId}.${extension}`;

    // Create presigned URL for upload
    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        uploadUrl,
        fileId,
        key,
        message: 'Use the uploadUrl to PUT your file directly to S3',
      }),
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
        error: 'Failed to generate upload URL',
        details: error.message 
      }),
    };
  }
});

