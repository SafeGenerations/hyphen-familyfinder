/**
 * MongoDB/CosmosDB Connection Module
 *
 * Provides a cached database connection for Azure Functions.
 * Falls back to file-based storage for local development when MongoDB unavailable.
 * Designed for future graph DB migration - uses node/edge patterns.
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

let cachedClient = null;
let cachedDb = null;
let useFileFallback = false;

// File-based storage directory (only used in local development)
const STORAGE_DIR = path.join(__dirname, '../../.dev-data');
const IS_AZURE = process.env.WEBSITE_RUN_FROM_PACKAGE === '1' || process.env.COSMOS_CONNECTION_STRING;

// Ensure storage directory exists (only for local development)
if (!IS_AZURE) {
  try {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
  } catch (e) {
    console.log('Could not create storage directory:', e.message);
  }
}

/**
 * File-based collection mock for local development
 */
class FileCollection {
  constructor(name) {
    this.name = name;
    this.filePath = path.join(STORAGE_DIR, `${name}.json`);
    this.data = this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.filePath)) {
        return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      }
    } catch (e) {
      console.error(`Error loading ${this.name}:`, e.message);
    }
    return [];
  }

  _save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
    } catch (e) {
      console.error(`Error saving ${this.name}:`, e.message);
    }
  }

  _matchValue(docValue, queryValue) {
    // Handle MongoDB operators
    if (queryValue && typeof queryValue === 'object' && !Array.isArray(queryValue)) {
      for (const [op, opValue] of Object.entries(queryValue)) {
        switch (op) {
          case '$ne': return docValue !== opValue;
          case '$eq': return docValue === opValue;
          case '$gt': return docValue > opValue;
          case '$gte': return docValue >= opValue;
          case '$lt': return docValue < opValue;
          case '$lte': return docValue <= opValue;
          case '$in': return Array.isArray(opValue) && opValue.includes(docValue);
          case '$nin': return Array.isArray(opValue) && !opValue.includes(docValue);
          case '$exists': return opValue ? docValue !== undefined : docValue === undefined;
          default: return docValue === queryValue; // Unknown operator, do direct comparison
        }
      }
    }
    // Direct value comparison
    return docValue === queryValue;
  }

  find(query = {}) {
    let results = [...this.data];

    // Apply query filters
    for (const [key, value] of Object.entries(query)) {
      if (key === '$or') {
        results = results.filter(doc =>
          value.some(orQuery =>
            Object.entries(orQuery).every(([k, v]) => this._matchValue(doc[k], v))
          )
        );
      } else {
        results = results.filter(doc => this._matchValue(doc[key], value));
      }
    }

    // Return cursor-like object with chainable methods (synchronous like MongoDB)
    const cursor = {
      _results: results,
      _skip: 0,
      _limit: Infinity,
      skip(n) {
        this._skip = n;
        return this;
      },
      limit(l) {
        this._limit = l;
        return this;
      },
      async toArray() {
        return this._results.slice(this._skip, this._skip + this._limit);
      }
    };
    return cursor;
  }

  async findOne(query = {}) {
    const cursor = this.find(query);
    const arr = await cursor.toArray();
    return arr[0] || null;
  }

  async insertOne(doc) {
    this.data.push(doc);
    this._save();
    return { insertedId: doc._id };
  }

  async updateOne(query, update) {
    const index = this.data.findIndex(doc =>
      Object.entries(query).every(([k, v]) => doc[k] === v)
    );
    if (index !== -1 && update.$set) {
      this.data[index] = { ...this.data[index], ...update.$set };
      this._save();
      return { modifiedCount: 1 };
    }
    return { modifiedCount: 0 };
  }

  async updateMany(query, update) {
    let count = 0;
    this.data.forEach((doc, index) => {
      const matches = Object.entries(query).every(([k, v]) => {
        if (k === '$or') {
          return v.some(orQ => Object.entries(orQ).every(([ok, ov]) => doc[ok] === ov));
        }
        return doc[k] === v;
      });
      if (matches && update.$set) {
        this.data[index] = { ...this.data[index], ...update.$set };
        count++;
      }
    });
    if (count > 0) this._save();
    return { modifiedCount: count };
  }

  async deleteOne(query) {
    const index = this.data.findIndex(doc =>
      Object.entries(query).every(([k, v]) => doc[k] === v)
    );
    if (index !== -1) {
      this.data.splice(index, 1);
      this._save();
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }

  async deleteMany(query) {
    const originalLength = this.data.length;
    this.data = this.data.filter(doc => {
      if (query.$or) {
        return !query.$or.some(orQ =>
          Object.entries(orQ).every(([k, v]) => doc[k] === v)
        );
      }
      return !Object.entries(query).every(([k, v]) => doc[k] === v);
    });
    const deletedCount = originalLength - this.data.length;
    if (deletedCount > 0) this._save();
    return { deletedCount };
  }

  async countDocuments(query = {}) {
    const cursor = this.find(query);
    const arr = await cursor.toArray();
    return arr.length;
  }
}

/**
 * File-based database mock
 */
class FileDatabase {
  constructor() {
    this.collections = {};
  }

  collection(name) {
    if (!this.collections[name]) {
      this.collections[name] = new FileCollection(name);
    }
    return this.collections[name];
  }
}

/**
 * Get a cached database connection
 * Falls back to file-based storage if MongoDB unavailable
 * @returns {Promise<import('mongodb').Db>} MongoDB database instance or file-based mock
 */
async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  const uri = process.env.MONGODB_URI || process.env.COSMOS_CONNECTION_STRING;

  if (!uri || uri === 'mongodb://localhost:27017') {
    // Try to connect, fall back to file storage if it fails
    try {
      const client = new MongoClient(uri || 'mongodb://localhost:27017', {
        serverSelectionTimeoutMS: 2000
      });
      await client.connect();
      cachedClient = client;
      cachedDb = client.db('familyfinder');
      console.log('📦 Connected to MongoDB');
      return cachedDb;
    } catch (e) {
      console.log('📁 MongoDB unavailable, using file-based storage for local development');
      useFileFallback = true;
      cachedDb = new FileDatabase();
      return cachedDb;
    }
  }

  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  cachedDb = client.db('familyfinder');
  console.log('📦 Connected to MongoDB/CosmosDB');
  return cachedDb;
}

/**
 * Get a collection with consistent naming
 * @param {string} name - Collection name
 * @returns {Promise<import('mongodb').Collection>}
 */
async function getCollection(name) {
  const db = await connectToDatabase();
  return db.collection(name);
}

/**
 * Generate a unique ID with type prefix
 * @param {string} type - Entity type (member, rel, contact, etc.)
 * @returns {string} Unique ID
 */
function generateId(type) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `${type}_${timestamp}_${random}`;
}

/**
 * Close the database connection (for cleanup)
 */
async function closeConnection() {
  if (cachedClient && !useFileFallback) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
    console.log('📦 Closed MongoDB connection');
  }
}

module.exports = {
  connectToDatabase,
  getCollection,
  generateId,
  closeConnection
};
