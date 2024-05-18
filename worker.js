#!/usr/bin/node
const Bull = require('bull');
const fs = require('fs');
const imageThumbnail = require('image-thumbnail');
const dbClient = require('./utils/db');

const fileQueue = new Bull('fileQueue');
const userQueue = new Bull('userQueue');

fileQueue.process(async (job, done) => {
    const { userId, fileId } = job.data;

    if (!fileId) throw new Error('Missing fileId');
    if (!userId) throw new Error('Missing userId');

    const file = await dbClient.db.collection('files').findOne({ _id: new ObjectID(fileId), userId: new ObjectID(userId) });
    if (!file) throw new Error('File not found');

    const thumbnailSizes = [100, 250, 500];
    const filePath = file.localPath;

    try {
        for (const size of thumbnailSizes) {
            const thumbnail = await imageThumbnail(filePath, { width: size, height: size, responseType: 'base64' });
            fs.writeFileSync(`${filePath}_${size}`, thumbnail, 'base64');
        }
    } catch (error) {
        console.error('Error generating thumbnails', error);
    }

    done();
});

userQueue.process(async (job, done) => {
    const { userId } = job.data;

    if (!userId) throw new Error('Missing userId');

    const user = await dbClient.db.collection('users').findOne({ _id: new ObjectID(userId) });
    if (!user) throw new Error('User not found');

    console.log(`Welcome ${user.email}!`);
    done();
});
