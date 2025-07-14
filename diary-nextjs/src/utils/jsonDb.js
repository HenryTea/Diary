import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'db', 'data.json');

// Ensure database file exists
function ensureDbExists() {
  try {
    if (!fs.existsSync(dbPath)) {
      const initialData = {
        users: [],
        entries: [],
        likes: [],
        comments: []
      };
      fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
    }
  } catch (error) {
    console.error('Error ensuring database exists:', error);
  }
}

// Read database
function readDb() {
  try {
    ensureDbExists();
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return { users: [], entries: [], likes: [], comments: [] };
  }
}

// Write database
function writeDb(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing database:', error);
    return false;
  }
}

// Generate unique ID
function generateId() {
  return Date.now().toString() + Math.random().toString(36).substring(2);
}

// JSON Database class
class JsonDatabase {
  constructor() {
    ensureDbExists();
  }

  // Users operations
  async findUserByUsername(username) {
    const db = readDb();
    return db.users.find(user => user.username === username) || null;
  }

  async findUserByEmail(email) {
    const db = readDb();
    return db.users.find(user => user.email === email) || null;
  }

  async findUserById(id) {
    const db = readDb();
    return db.users.find(user => user.id === id) || null;
  }

  async createUser(userData) {
    const db = readDb();
    const user = {
      id: generateId(),
      ...userData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.users.push(user);
    writeDb(db);
    return user;
  }

  async findUserByUsernameOrEmail(username, email) {
    const db = readDb();
    return db.users.find(user => user.username === username || user.email === email) || null;
  }

  // Entries operations
  async findEntriesByUserId(userId) {
    const db = readDb();
    return db.entries.filter(entry => entry.user_id === userId);
  }

  async findEntryById(id) {
    const db = readDb();
    return db.entries.find(entry => entry.id === id) || null;
  }

  async createEntry(entryData) {
    const db = readDb();
    const entry = {
      id: generateId(),
      ...entryData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.entries.push(entry);
    writeDb(db);
    return entry;
  }

  async updateEntry(id, updateData) {
    const db = readDb();
    const entryIndex = db.entries.findIndex(entry => entry.id === id);
    if (entryIndex === -1) return null;
    
    db.entries[entryIndex] = {
      ...db.entries[entryIndex],
      ...updateData,
      updated_at: new Date().toISOString()
    };
    writeDb(db);
    return db.entries[entryIndex];
  }

  async deleteEntry(id) {
    const db = readDb();
    const entryIndex = db.entries.findIndex(entry => entry.id === id);
    if (entryIndex === -1) return false;
    
    db.entries.splice(entryIndex, 1);
    writeDb(db);
    return true;
  }

  // Get all public entries
  async getPublicEntries() {
    const db = readDb();
    return db.entries.filter(entry => entry.is_public === true || entry.is_public === 1);
  }

  // Likes operations
  async findLike(userId, entryId) {
    const db = readDb();
    return db.likes.find(like => like.user_id === userId && like.entry_id === entryId) || null;
  }

  async createLike(userId, entryId) {
    const db = readDb();
    const like = {
      id: generateId(),
      user_id: userId,
      entry_id: entryId,
      created_at: new Date().toISOString()
    };
    db.likes.push(like);
    writeDb(db);
    return like;
  }

  async deleteLike(userId, entryId) {
    const db = readDb();
    const likeIndex = db.likes.findIndex(like => like.user_id === userId && like.entry_id === entryId);
    if (likeIndex === -1) return false;
    
    db.likes.splice(likeIndex, 1);
    writeDb(db);
    return true;
  }

  async countLikes(entryId) {
    const db = readDb();
    return db.likes.filter(like => like.entry_id === entryId).length;
  }

  // Comments operations
  async findCommentsByEntryId(entryId) {
    const db = readDb();
    return db.comments.filter(comment => comment.entry_id === entryId);
  }

  async createComment(commentData) {
    const db = readDb();
    const comment = {
      id: generateId(),
      ...commentData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.comments.push(comment);
    writeDb(db);
    return comment;
  }

  async updateComment(id, updateData) {
    const db = readDb();
    const commentIndex = db.comments.findIndex(comment => comment.id === id);
    if (commentIndex === -1) return null;
    
    db.comments[commentIndex] = {
      ...db.comments[commentIndex],
      ...updateData,
      updated_at: new Date().toISOString()
    };
    writeDb(db);
    return db.comments[commentIndex];
  }

  async deleteComment(id) {
    const db = readDb();
    const commentIndex = db.comments.findIndex(comment => comment.id === id);
    if (commentIndex === -1) return false;
    
    db.comments.splice(commentIndex, 1);
    writeDb(db);
    return true;
  }

  // Health check
  async healthCheck() {
    try {
      const db = readDb();
      return {
        status: 'healthy',
        tables: {
          users: db.users.length,
          entries: db.entries.length,
          likes: db.likes.length,
          comments: db.comments.length
        }
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }
}

// Create singleton instance
const jsonDb = new JsonDatabase();

export default jsonDb;
