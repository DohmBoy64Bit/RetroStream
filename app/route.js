import { shell } from '../src/shell.js';
export function GET() { return new Response(shell, { headers: { 'content-type':'text/html; charset=utf-8' } }); }
