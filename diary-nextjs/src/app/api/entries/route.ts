import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

type Entry = {
  id: string | number;
  date: string;
  text?: string;
  content?: string;
};

export async function GET() {
  const dbPath = path.join(process.cwd(), 'db', 'db.json');
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(data);
    let entries: Entry[] = [];
    if (Array.isArray(db)) {
      entries = db;
    } else if (Array.isArray(db.entries)) {
      entries = db.entries;
    }
    // Map 'content' to 'text' for frontend compatibility
    const mappedEntries = entries.map(entry => ({
      ...entry,
      text: entry.text ?? entry.content ?? '',
    }));
    return NextResponse.json(mappedEntries);
  } catch {
    return NextResponse.json({ error: 'Failed to read entries.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const dbPath = path.join(process.cwd(), 'db', 'db.json');
  try {
    const body = await request.json();
    const data = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(data);
    const entries: Entry[] = Array.isArray(db) ? db : db.entries || [];
    // Add new entry
    const newEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      content: body.text || '',
    };
    entries.push(newEntry);
    // Write back to db.json
    const newDb = Array.isArray(db) ? entries : { ...db, entries };
    await fs.writeFile(dbPath, JSON.stringify(newDb, null, 2), 'utf-8');
    return NextResponse.json({ success: true, entry: newEntry });
  } catch {
    return NextResponse.json({ error: 'Failed to save entry.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const dbPath = path.join(process.cwd(), 'db', 'db.json');
  try {
    const body = await request.json();
    const { id, text } = body;
    const data = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(data);
    let entries: Entry[] = Array.isArray(db) ? db : db.entries || [];
    let updated = false;
    entries = entries.map(entry => {
      if (entry.id.toString() === id.toString()) {
        updated = true;
        return { ...entry, content: text };
      }
      return entry;
    });
    if (!updated) {
      return NextResponse.json({ error: 'Entry not found.' }, { status: 404 });
    }
    const newDb = Array.isArray(db) ? entries : { ...db, entries };
    await fs.writeFile(dbPath, JSON.stringify(newDb, null, 2), 'utf-8');
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update entry.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const dbPath = path.join(process.cwd(), 'db', 'db.json');
  try {
    const body = await request.json();
    const { id } = body;
    const data = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(data);
    const entries: Entry[] = Array.isArray(db) ? db : db.entries || [];
    const newEntries = entries.filter(entry => entry.id.toString() !== id.toString());
    const newDb = Array.isArray(db) ? newEntries : { ...db, entries: newEntries };
    await fs.writeFile(dbPath, JSON.stringify(newDb, null, 2), 'utf-8');
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete entry.' }, { status: 500 });
  }
}
