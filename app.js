const { format } = require('util');
const express = require('express');
const Multer = require('multer');
const cors = require('cors');


// By default, the client will authenticate using the service account file
// specified by the GOOGLE_APPLICATION_CREDENTIALS environment variable and use
// the project specified by the GOOGLE_CLOUD_PROJECT environment variable. See
// https://github.com/GoogleCloudPlatform/google-cloud-node/blob/master/docs/authentication.md
// These environment variables are set automatically on Google App Engine
const { Storage } = require('@google-cloud/storage');

// Instantiate a storage client
const storage = new Storage();

const app = express();
app.set('view engine', 'pug');

// This middleware is available in Express v4.16.0 onwards
app.use(express.json());
app.use(cors());

// Multer is required to process file uploads and make them available via
// req.files.
const multer = Multer({
    storage: Multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // no larger than 5mb, you can change as needed.
    },
});

// A bucket is a container for objects (files).
const bucket = storage.bucket("schaden_images");

// Display a form for uploading files.
app.get('/', (req, res) => {
    res.status(200).send('It works!');;
});

// Process the file upload and upload to Google Cloud Storage.
app.post('/upload', multer.any('files'), (req, res, next) => {
    app.use(cors());

    if (!req.files[0]) {
        res.status(400).send('No file uploaded.');
        return;
    }

    // Create a new blob in the bucket and upload the file data.
    const blob = bucket.file(req.files[0].fieldname);
    const blobStream = blob.createWriteStream({
        metadata: {
            contentType: "image/jpeg"
        }
    });

    blobStream.on('error', err => {
        next(err);
    });

    blobStream.on('finish', () => {
        // The public URL can be used to directly access the file via HTTP.
        const publicUrl = format(
            `https://storage.googleapis.com/${bucket.name}/${req.files[0].fieldname}`
        );
        res.append('url', publicUrl);
        res.json({ 'uploaded_to': publicUrl })
        res.status(200).send(publicUrl);
    });

    blobStream.end(req.files[0].buffer);
});

const PORT = parseInt(process.env.PORT) || 8080;
app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
});