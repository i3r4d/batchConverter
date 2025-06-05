const sharp = require('sharp');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { imageBase64, outputFormat, inputFileName } = JSON.parse(event.body);

        if (!imageBase64 || !outputFormat) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing image data or output format.' }) };
        }

        // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
        const base64Data = imageBase64.split(';base64,').pop();
        const imageBuffer = Buffer.from(base64Data, 'base64');

        let convertedBuffer;
        let mimeType;
        let newFileName = (inputFileName || 'converted_image').replace(/\.[^/.]+$/, "") + `.${outputFormat.toLowerCase()}`;


        if (outputFormat.toLowerCase() === 'png') {
            convertedBuffer = await sharp(imageBuffer).png().toBuffer();
            mimeType = 'image/png';
        } else if (outputFormat.toLowerCase() === 'jpeg' || outputFormat.toLowerCase() === 'jpg') {
            convertedBuffer = await sharp(imageBuffer).jpeg().toBuffer();
            mimeType = 'image/jpeg';
        } else {
            return { statusCode: 400, body: JSON.stringify({ error: 'Unsupported output format for images.' }) };
        }

        const convertedBase64 = convertedBuffer.toString('base64');

        return {
            statusCode: 200,
            body: JSON.stringify({
                fileName: newFileName,
                mimeType: mimeType,
                data: convertedBase64 // Sending full base64 back, careful with size limits
            }),
            // For binary response (alternative, more complex to handle on client with fetch for multiple files)
            // headers: { 'Content-Type': mimeType, 'Content-Disposition': `attachment; filename="${newFileName}"` },
            // body: convertedBuffer.toString('base64'), // Netlify Functions expect string body
            // isBase64Encoded: true,
        };

    } catch (error) {
        console.error('Conversion error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Image conversion failed: ' + error.message }),
        };
    }
};