require('dotenv/config');

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const mongoose = require('mongoose');

const workbookArg = process.argv.find((arg) => arg.endsWith('.xlsx'));
const workbookPath = path.resolve(process.cwd(), workbookArg ?? 'Categoria CaninoFelino.xlsx');
const applyChanges = process.argv.includes('--apply');

const PYTHON_EXTRACT_SCRIPT = String.raw`
import json
import openpyxl
import sys

workbook_path = sys.argv[1]
workbook = openpyxl.load_workbook(workbook_path, data_only=True)
rows = []

for worksheet in workbook.worksheets:
    header_row = next(worksheet.iter_rows(min_row=1, max_row=1, values_only=True))
    headers = [str(value).strip().lower() if value is not None else '' for value in header_row]

    for row in worksheet.iter_rows(min_row=2, values_only=True):
        if not any(value is not None and str(value).strip() != '' for value in row):
            continue

        item = {}
        for index, header in enumerate(headers):
            if not header:
                continue
            value = row[index] if index < len(row) else None
            item[header] = str(value).strip() if value is not None else ''

        rows.append(item)

print(json.dumps(rows, ensure_ascii=False))
`;

function ensureEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}`);
  }

  return value;
}

function extractRowsFromWorkbook(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`No existe el archivo Excel: ${filePath}`);
  }

  const output = execFileSync('python', ['-c', PYTHON_EXTRACT_SCRIPT, filePath], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return JSON.parse(output);
}

function normalizeRow(row) {
  return {
    nombre: String(row.nombre ?? row.Nombre ?? '').trim(),
    especieNombre: String(row.especienombre ?? row.especieNombre ?? '').trim(),
    usuarioCrea_id: String(row.usuariocrea_id ?? row.usuarioCrea_id ?? '').trim(),
    usuarioModifica_id: String(row.usuariomodifica_id ?? row.usuarioModifica_id ?? '').trim(),
    empresa_Id: String(row.empresa_id ?? row.empresa_Id ?? '').trim(),
  };
}

function buildKey(row) {
  return [
    row.empresa_Id,
    row.especieNombre.toLocaleLowerCase('es'),
    row.nombre.toLocaleLowerCase('es'),
  ]
    .join('::')
    .trim();
}

async function main() {
  ensureEnv('MONGODB_URI');
  ensureEnv('MONGO_DB');
  ensureEnv('MONGO_USER');
  ensureEnv('MONGO_PASS');
  ensureEnv('MONGO_AUTH_SOURCE');

  const rawRows = extractRowsFromWorkbook(workbookPath);
  const normalizedRows = rawRows.map(normalizeRow).filter((row) => {
    return row.nombre && row.especieNombre && row.usuarioCrea_id && row.empresa_Id;
  });

  if (!normalizedRows.length) {
    throw new Error('El Excel no contiene filas válidas para importar.');
  }

  const dedupedRows = [];
  const seenKeys = new Set();

  for (const row of normalizedRows) {
    const key = buildKey(row);
    if (seenKeys.has(key)) {
      continue;
    }

    seenKeys.add(key);
    dedupedRows.push(row);
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGO_DB,
    user: process.env.MONGO_USER,
    pass: process.env.MONGO_PASS,
    authSource: process.env.MONGO_AUTH_SOURCE,
  });

  const collection = mongoose.connection.collection('razas');
  const empresaIds = [...new Set(dedupedRows.map((row) => row.empresa_Id))];
  const existingRows = await collection
    .find({ empresa_Id: { $in: empresaIds } })
    .project({ empresa_Id: 1, especieNombre: 1, nombre: 1 })
    .toArray();

  const existingKeys = new Set(
    existingRows.map((row) =>
      buildKey({
        empresa_Id: String(row.empresa_Id ?? ''),
        especieNombre: String(row.especieNombre ?? ''),
        nombre: String(row.nombre ?? ''),
      }),
    ),
  );

  const now = new Date();
  const operations = dedupedRows.map((row) => ({
    updateOne: {
      filter: {
        empresa_Id: row.empresa_Id,
        especieNombre: row.especieNombre,
        nombre: row.nombre,
      },
      update: {
        $set: {
          estado: 'Activo',
          usuarioModifica_id: row.usuarioModifica_id || row.usuarioCrea_id,
          fechaHora_Modifica: now,
        },
        $setOnInsert: {
          nombre: row.nombre,
          especieNombre: row.especieNombre,
          empresa_Id: row.empresa_Id,
          usuarioCrea_id: row.usuarioCrea_id,
          fechaHora_Crea: now,
        },
      },
      upsert: true,
    },
  }));

  const inserts = dedupedRows.filter((row) => !existingKeys.has(buildKey(row))).length;
  const updates = dedupedRows.length - inserts;

  console.log(
    JSON.stringify(
      {
        workbookPath,
        totalFilasExcel: rawRows.length,
        filasValidas: normalizedRows.length,
        filasUnicas: dedupedRows.length,
        insertaria: inserts,
        actualizaria: updates,
        modo: applyChanges ? 'apply' : 'dry-run',
      },
      null,
      2,
    ),
  );

  if (!applyChanges) {
    await mongoose.disconnect();
    return;
  }

  if (operations.length > 0) {
    await collection.bulkWrite(operations, { ordered: false });
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch {
    // noop
  }
  process.exit(1);
});
