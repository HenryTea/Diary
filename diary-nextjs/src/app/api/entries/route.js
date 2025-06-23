import { NextResponse } from 'next/server';
import pool from '../../../../db/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT id, date, content as text FROM entries ORDER BY date DESC');
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: 'Failed to read entries.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { text } = body;
    const date = new Date().toISOString();
    const [result] = await pool.query('INSERT INTO entries (date, content) VALUES (?, ?)', [date, text]);
    const insertId = result.insertId || (result[0] && result[0].insertId);
    return NextResponse.json({ success: true, entry: { id: insertId, date, text } });
  } catch (err) {
    console.error('POST /api/entries error:', err);
    return NextResponse.json({ error: 'Failed to save entry.', details: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, text } = body;
    await pool.query('UPDATE entries SET content = ? WHERE id = ?', [text, id]);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update entry.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    const { id } = body;
    await pool.query('DELETE FROM entries WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete entry.' }, { status: 500 });
  }
}
