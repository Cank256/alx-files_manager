#!/usr/bin/node

const redis = require('redis');
const { promisify } = require('util');

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.client.on('error', (err) => console.error('Redis Client Error:', err));
    
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
  }

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    return await this.getAsync(key);
  }

  async set(key, value, duration) {
    return await this.setAsync(key, value, 'EX', duration);
  }

  async del(key) {
    return await this.delAsync(key);
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
