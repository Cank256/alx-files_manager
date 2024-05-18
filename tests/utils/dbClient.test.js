#!/usr/bin/node
const dbClient = require('../../utils/db');
const { expect } = require('chai');

describe('dbClient', () => {
    it('should connect to MongoDB', async () => {
        const isAlive = dbClient.isAlive();
        expect(isAlive).to.be.true;
    });

    it('should return the correct number of users', async () => {
        const nbUsers = await dbClient.nbUsers();
        expect(nbUsers).to.be.a('number');
    });

    it('should return the correct number of files', async () => {
        const nbFiles = await dbClient.nbFiles();
        expect(nbFiles).to.be.a('number');
    });
});
