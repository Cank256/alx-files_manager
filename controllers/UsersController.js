#!/usr/bin/node
const sha1 = require('sha1');
const Bull = require('bull');
const userQueue = new Bull('userQueue');
const dbClient = require('../utils/db');

class UsersController {
    static async postNew(req, res) {
        const { email, password } = req.body;
        if (!email) return res.status(400).json({ error: 'Missing email' });
        if (!password) return res.status(400).json({ error: 'Missing password' });

        const user = await dbClient.db.collection('users').findOne({ email });
        if (user) return res.status(400).json({ error: 'Already exist' });

        const hashedPassword = sha1(password);
        const result = await dbClient.db.collection('users').insertOne({ email, password: hashedPassword });
        const newUser = { id: result.insertedId, email };
        userQueue.add({ userId: newUser.id});

        res.status(201).json(newUser);
    }

    static async getMe(req, res) {
        const token = req.headers['x-token'];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });

        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await dbClient.db.collection('users').findOne({ _id: new mongo.ObjectID(userId) });
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        res.status(200).json({ id: user._id, email: user.email });
    }
}

module.exports = UsersController;
