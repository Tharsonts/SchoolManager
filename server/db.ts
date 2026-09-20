import 'dotenv/config';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from "../shared/schema";
import path from 'path';
import fs from 'fs';

// Usa um caminho estável tanto no TSX local quanto no bundle de produção.
const dataDirectory = path.resolve(process.cwd(), 'server');
const dbPath = path.join(dataDirectory, 'school.db');
const demoTemplatePath = path.join(dataDirectory, 'demo-template.db');

// Em uma instalação nova (incluindo hospedagens de demonstração), inicia com
// uma base sanitizada contendo apenas os cinco perfis e dados acadêmicos demo.
if (!fs.existsSync(dbPath) && fs.existsSync(demoTemplatePath)) {
  fs.copyFileSync(demoTemplatePath, dbPath);
}

const client = createClient({
  // Usar caminho absoluto para evitar cair no school.db da raiz
  url: `file:${dbPath}`,
});

// Ativar logger do Drizzle para inspecionar SQL executado (ajuda a depurar erros "near =")
export const db = drizzle(client, { schema, logger: true });
