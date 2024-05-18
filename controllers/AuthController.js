#!/usr/bin/node
const sha1 = require('sha1');
const { v4: uuidv4 } = require('uuid');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

class AuthController {
    static async getConnect(req, res) {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Basic ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const base64Credentials = authHeader.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        const [email, password] = credentials.split(':');

        const user = await dbClient.db.collection('users').findOne({ email, password: sha1(password) });
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = uuidv4();
        await redisClient.set(`auth_${token}`, user._id.toString(), 86400);

        res.status(200).json({ token });
    }

    static async getDisconnect(req, res) {
        const token = req.headers['x-token'];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });

        await redisClient.del(`auth_${token}`);
        res.status(204).end();
    }
}

module.exports = AuthController;
