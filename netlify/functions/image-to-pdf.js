// File: netlify/functions/image-to-pdf.js
const sharp = require('sharp');
const { PDFDocument, rgb } = require('pdf-lib'); // Note: rgb might not be used if just embedding

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { imageBase64, inputFileName } = JSON.parse(event.body);

        if (!imageBase64) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing image data.' }) };
        }

        const base64Data = imageBase64.split(';base64,').pop();
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // Use sharp to get image metadata (format, width, height)
        const imageMetadata = await sharp(imageBuffer).metadata();
        
        // Create a new PDFDocument
        const pdfDoc = await PDFDocument.create();
        
        // Embed the image
        let embeddedImage;
        if (imageMetadata.format === 'jpeg' || imageMetadata.format === 'jpg') {
            embeddedImage = await pdfDoc.embedJpg(imageBuffer);
        } else if (imageMetadata.format === 'png') {
            embeddedImage = await pdfDoc.embedPng(imageBuffer);
        } 
        // pdf-lib can also embed other image types if you have their raw buffers
        // but JPG and PNG are the most direct. For other types, sharp could convert
        // them to JPG/PNG first before embedding if pdf-lib doesn't support direct embedding.
        // For simplicity, we'll stick to JPG/PNG input for embedding for now.
        // Sharp will have already identified the format from the buffer.
        else {
             // If not JPG/PNG, try to convert to PNG with sharp then embed
            console.log(`Input image format ${imageMetadata.format} not directly embeddable by pdf-lib as-is, converting to PNG first.`);
            const pngBufferForPdf = await sharp(imageBuffer).png().toBuffer();
            embeddedImage = await pdfDoc.embedPng(pngBufferForPdf);
        }

        // Add a page with the image's dimensions
        const page = pdfDoc.addPage([imageMetadata.width, imageMetadata.height]);
        
        // Draw the image on the page
        page.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width: imageMetadata.width,
            height: imageMetadata.height,
        });

        // Serialize the PDFDocument to bytes (a Uint8Array)
        const pdfBytes = await pdfDoc.save();

        const originalNameWithoutExtension = (inputFileName || 'converted_image').replace(/\.[^/.]+$/, "");
        const newFileName = `${originalNameWithoutExtension}.pdf`;

        return {
            statusCode: 200,
            body: JSON.stringify({
                fileName: newFileName,
                mimeType: 'application/pdf',
                data: Buffer.from(pdfBytes).toString('base64') // Convert Uint8Array to Buffer then to base64 string
            }),
        };

    } catch (error) {
        console.error('Image to PDF conversion error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Image to PDF conversion failed: ' + error.message }),
        };
    }
};