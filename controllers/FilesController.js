#!/usr/bin/node
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const { v4: uuidv4 } = require('uuid');
const Bull = require('bull');
const fileQueue = new Bull('fileQueue');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

class FilesController {
    static async postUpload(req, res) {
        const token = req.headers['x-token'];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });

        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { name, type, data } = req.body;
        if (!name) return res.status(400).json({ error: 'Missing name' });
        if (!type || !['folder', 'file', 'image'].includes(type)) return res.status(400).json({ error: 'Missing type' });
        if (type !== 'folder' && !data) return res.status(400).json({ error: 'Missing data' });

        const fileData = {
            userId: new mongo.ObjectID(userId),
            name,
            type,
            isPublic: false,
            parentId: req.body.parentId ? new mongo.ObjectID(req.body.parentId) : 0,
            localPath: ''
        };

        if (type !== 'folder') {
            const filePath = path.join('/tmp/files_manager', uuidv4());
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
            fileData.localPath = filePath;
        }

        const result = await dbClient.db.collection('files').insertOne(fileData);
        res.status(201).json({
            id: result.insertedId,
            userId: fileData.userId,
            name,
            type,
            isPublic: fileData.isPublic,
            parentId: fileData.parentId
        });
    }

    static async putPublish(req, res) {
        const fileId = req.params.id;
        const token = req.headers['x-token'];

        if (!ObjectID.isValid(fileId)) return res.status(404).json({ error: 'Not found' });
        if (!token) return res.status(401).json({ error: 'Unauthorized' });

        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const file = await dbClient.db.collection('files').findOne({ _id: new ObjectID(fileId), userId: new ObjectID(userId) });
        if (!file) return res.status(404).json({ error: 'Not found' });

        await dbClient.db.collection('files').updateOne({ _id: new ObjectID(fileId) }, { $set: { isPublic: true } });
        file.isPublic = true;
        res.status(200).json(file);
    }

    static async putUnpublish(req, res) {
        const fileId = req.params.id;
        const token = req.headers['x-token'];

        if (!ObjectID.isValid(fileId)) return res.status(404).json({ error: 'Not found' });
        if (!token) return res.status(401).json({ error: 'Unauthorized' });

        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const file = await dbClient.db.collection('files').findOne({ _id: new ObjectID(fileId), userId: new ObjectID(userId) });
        if (!file) return res.status(404).json({ error: 'Not found' });

        await dbClient.db.collection('files').updateOne({ _id: new ObjectID(fileId) }, { $set: { isPublic: false } });
        file.isPublic = false;
        res.status(200).json(file);
    }

    static async getFile(req, res) {
        const fileId = req.params.id;
        const size = req.query.size;
        const token = req.headers['x-token'];

        if (!ObjectID.isValid(fileId)) return res.status(404).json({ error: 'Not found' });

        const file = await dbClient.db.collection('files').findOne({ _id: new ObjectID(fileId) });
        if (!file) return res.status(404).json({ error: 'Not found' });

        if (!file.isPublic) {
            if (!token) return res.status(404).json({ error: 'Not found' });

            const userId = await redisClient.get(`auth_${token}`);
            if (!userId || userId !== file.userId.toString()) return res.status(404).json({ error: 'Not found' });
        }

        if (file.type === 'folder') return res.status(400).json({ error: "A folder doesn't have content" });

        let filePath = file.localPath;
        if (size && ['100', '250', '500'].includes(size)) {
            filePath = `${file.localPath}_${size}`;
        }

        fs.readFile(filePath, (err, data) => {
            if (err) return res.status(404).json({ error: 'Not found' });

            const mimeType = mime.lookup(file.name);
            res.setHeader('Content-Type', mimeType);
            res.status(200).send(data);
        });
    }

    static async postUpload(req, res) {
        // Existing upload logic...

        const result = await dbClient.db.collection('files').insertOne(fileData);
        if (type === 'image') {
            fileQueue.add({ userId, fileId: result.insertedId });
        }
        res.status(201).json({
            id: result.insertedId,
            userId: fileData.userId,
            name,
            type,
            isPublic: fileData.isPublic,
            parentId: fileData.parentId
        });
    }
}

module.exports = FilesController;
