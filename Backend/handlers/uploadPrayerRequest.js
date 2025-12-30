const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "eu-west-2",
});
const streamToString = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
  });

exports.handler = async (event) => {
  try {
    const fileId = `${new Date().toISOString().split("T")[0]}.json`;
    const bucket = process.env.BUCKET_NAME;

    // 1️⃣ Fetch existing file
    let existingData = [];

    try {
      const getCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: fileId,
      });

      const response = await s3Client.send(getCommand);
      const body = await streamToString(response.Body);
      existingData = JSON.parse(body);
    } catch (err) {
      // File may not exist yet — that's OK
      console.log("No existing file, creating new one");
    }
    const body = JSON.parse(event.body)
    console.log(body)
    // 2️⃣ Modify the data
    const newRequest = {
      id: crypto.randomUUID(),
      name: body.name,
      request: body.request,
      timestamp: new Date().toISOString(),
    };

    existingData.push(newRequest);

    // 3️⃣ Upload updated file
    const putCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: fileId,
      Body: JSON.stringify(existingData, null, 2),
      ContentType: "application/json",
    });

    await s3Client.send(putCommand);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Failed to update prayer requests",
        details: error.message,
      }),
    };
  }
};
