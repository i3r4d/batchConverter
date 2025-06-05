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

        const base64Data = imageBase64.split(';base64,').pop();
        const imageBuffer = Buffer.from(base64Data, 'base64');

        let convertedBuffer;
        let mimeType;
        // Ensure newFileName is constructed *after* knowing the actual output format extension
        const originalNameWithoutExtension = (inputFileName || 'converted_image').replace(/\.[^/.]+$/, "");
        let newFileName;

        const targetFormat = outputFormat.toLowerCase();

        if (targetFormat === 'png') {
            convertedBuffer = await sharp(imageBuffer).png().toBuffer();
            mimeType = 'image/png';
            newFileName = `${originalNameWithoutExtension}.png`;
        } else if (targetFormat === 'jpeg' || targetFormat === 'jpg') {
            convertedBuffer = await sharp(imageBuffer).jpeg().toBuffer();
            mimeType = 'image/jpeg';
            newFileName = `${originalNameWithoutExtension}.${targetFormat === 'jpeg' ? 'jpeg' : 'jpg'}`;
        } else if (targetFormat === 'webp') {
            convertedBuffer = await sharp(imageBuffer).webp().toBuffer();
            mimeType = 'image/webp';
            newFileName = `${originalNameWithoutExtension}.webp`;
        } else if (targetFormat === 'gif') { // Note: Sharp's GIF output might be static from animated inputs
            convertedBuffer = await sharp(imageBuffer).gif().toBuffer();
            mimeType = 'image/gif';
            newFileName = `${originalNameWithoutExtension}.gif`;
        } else if (targetFormat === 'tiff') {
            convertedBuffer = await sharp(imageBuffer).tiff().toBuffer();
            mimeType = 'image/tiff';
            newFileName = `${originalNameWithoutExtension}.tiff`;
        } else if (targetFormat === 'pdf') { // Added PDF output
            convertedBuffer = await sharp(imageBuffer).pdf().toBuffer();
            mimeType = 'application/pdf';
            newFileName = `${originalNameWithoutExtension}.pdf`;
        } else {
            return { statusCode: 400, body: JSON.stringify({ error: `Unsupported output image format: ${outputFormat}` }) };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                fileName: newFileName,
                mimeType: mimeType,
                data: convertedBuffer.toString('base64')
            }),
        };

    } catch (error) {
        console.error('Image conversion error in function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Image conversion failed: ' + error.message }),
        };
    }
};