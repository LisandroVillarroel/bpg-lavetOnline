require('dotenv/config');

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const mongoose = require('mongoose');

const workbookArg = process.argv.find((arg) => arg.endsWith('.xlsx'));
const workbookPath = path.resolve(process.cwd(), workbookArg ?? 'Lista de examenesCategoria.xlsx');
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
    headers = [str(value).strip() if value is not None else '' for value in header_row]

    for row in worksheet.iter_rows(min_row=2, values_only=True):
        if not any(value is not None and str(value).strip() != '' for value in row):
            continue

        item = {}
        for index, header in enumerate(headers):
            if not header:
                continue
            value = row[index] if index < len(row) else None
            item[header] = value

        rows.append(item)

print(json.dumps(rows, ensure_ascii=False))
`;

const CATEGORY_ALIASES = new Map([
  ['COPROLÓGICOS', 'COPROLÓGICOS'],
  ['DETERMINACIONES SEROLÓGICAS', 'DETERMINACIONES SEROLÓGICAS'],
  ['FLUIDOS ORGÁNICOS', 'FLUIDOS ORGÁNICOS'],
  ['MICRIBIOLOGÍA', 'MICROBIOLOGÍA'],
  ['MICROBIOLOGÍA', 'MICROBIOLOGÍA'],
  ['PIEL Y PELOS', 'PIEL Y PELOS'],
]);

function ensureEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}`);
  }

  return value;
}

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

function extractRowsFromWorkbook(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`No existe el archivo Excel: ${filePath}`);
  }

  const output = execFileSync('python', ['-c', PYTHON_EXTRACT_SCRIPT, filePath], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      PYTHONIOENCODING: 'utf-8',
      PYTHONUTF8: '1',
    },
  });

  return JSON.parse(output);
}

function normalizeTiempoPreparacion(value) {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'number') {
    return `${value} horas`;
  }

  const limpio = String(value).trim().replace(/\s+/g, ' ');
  if (!limpio) {
    return '';
  }

  if (/^\d+$/.test(limpio)) {
    return `${limpio} horas`;
  }

  if (/^\d+\s*-\s*\d+$/.test(limpio)) {
    return `${limpio.replace(/\s+/g, '')} horas`;
  }

  if (/^\d+\s*habiles$/i.test(limpio) || /^\d+\s*hábiles$/i.test(limpio)) {
    const numero = limpio.match(/^\d+/)?.[0] ?? limpio;
    return `${numero} horas hábiles`;
  }

  if (/^\d+\s*d[ií]as\s*habiles$/i.test(limpio) || /^\d+\s*d[ií]as\s*hábiles$/i.test(limpio)) {
    const numero = limpio.match(/^\d+/)?.[0] ?? limpio;
    return `${numero} días hábiles`;
  }

  if (/^desde\s+\d+\s+d[ií]as$/i.test(limpio)) {
    const texto = limpio.toLowerCase();
    return `Desde ${texto.replace(/^desde\s+/, '')}`;
  }

  return limpio;
}

function normalizeCategoriaNombre(value) {
  const trimmed = String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ');
  const alias = CATEGORY_ALIASES.get(trimmed.toUpperCase()) ?? trimmed;
  return alias;
}

function toObjectId(value, fieldName) {
  const normalized = String(value ?? '').trim();

  if (!mongoose.Types.ObjectId.isValid(normalized)) {
    throw new Error(`Valor inválido para ${fieldName}: ${value}`);
  }

  return new mongoose.Types.ObjectId(normalized);
}

function normalizeRow(row) {
  const precio = Number(row['precio'] ?? row['precio '] ?? 0);

  return {
    nombre: String(row.nombre ?? '')
      .trim()
      .replace(/\s+/g, ' '),
    sigla: String(row.sigla ?? '')
      .trim()
      .replace(/\s+/g, ' '),
    precio: Number.isFinite(precio) ? precio : 0,
    tiempoPreparacion: normalizeTiempoPreparacion(row.tiempoPreparacion),
    categoriaNombre: normalizeCategoriaNombre(row.CATEGORIA ?? row.categoria ?? ''),
    usuarioCrea_id: String(row.usuarioCrea_id ?? '').trim(),
    usuarioModifica_id: String(row.usuarioModifica_id ?? '').trim(),
    empresa_Id: String(row.empresa_Id ?? '').trim(),
  };
}

function buildKey(row) {
  return [row.empresa_Id, normalizeText(row.categoriaNombre), normalizeText(row.nombre)].join('::');
}

async function main() {
  ensureEnv('MONGODB_URI');
  ensureEnv('MONGO_DB');
  ensureEnv('MONGO_USER');
  ensureEnv('MONGO_PASS');
  ensureEnv('MONGO_AUTH_SOURCE');

  const rawRows = extractRowsFromWorkbook(workbookPath);
  const normalizedRows = rawRows.map(normalizeRow).filter((row) => {
    return (
      row.nombre &&
      row.sigla &&
      row.tiempoPreparacion &&
      row.categoriaNombre &&
      row.usuarioCrea_id &&
      row.empresa_Id
    );
  });

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

  const categoriasCollection = mongoose.connection.collection('categorias');
  const examenesCollection = mongoose.connection.collection('examens');

  const categorias = await categoriasCollection
    .find({})
    .project({ _id: 1, nombre: 1, empresa_Id: 1 })
    .toArray();
  const categoriasByEmpresaAndNombre = new Map();
  const categoriasByNombre = new Map();

  for (const categoria of categorias) {
    const empresaId = String(categoria.empresa_Id ?? '');
    const nombre = String(categoria.nombre ?? '');
    categoriasByEmpresaAndNombre.set(`${empresaId}::${normalizeText(nombre)}`, categoria);

    const nombreKey = normalizeText(nombre);
    const bucket = categoriasByNombre.get(nombreKey) ?? [];
    bucket.push(categoria);
    categoriasByNombre.set(nombreKey, bucket);
  }

  const reparacionesCategoria = [];
  const unresolvedCategories = [];
  const mappedRows = dedupedRows.map((row) => {
    const nombreKey = normalizeText(row.categoriaNombre);
    const empresaKey = `${row.empresa_Id}::${nombreKey}`;
    let categoria = categoriasByEmpresaAndNombre.get(empresaKey);

    if (!categoria) {
      const sameName = categoriasByNombre.get(nombreKey) ?? [];
      if (sameName.length === 1) {
        categoria = sameName[0];
        if (String(categoria.empresa_Id ?? '') !== row.empresa_Id) {
          reparacionesCategoria.push({
            categoriaId: String(categoria._id),
            nombre: String(categoria.nombre),
            empresaAnterior: String(categoria.empresa_Id ?? ''),
            empresaNueva: row.empresa_Id,
          });
        }
      }
    }

    if (!categoria) {
      unresolvedCategories.push(row.categoriaNombre);
      return null;
    }

    return {
      ...row,
      categoriaId: String(categoria._id),
    };
  });

  if (unresolvedCategories.length) {
    throw new Error(
      `No se pudieron resolver categorías: ${[...new Set(unresolvedCategories)].join(', ')}`,
    );
  }

  const rowsToImport = mappedRows.filter(Boolean);
  const empresaObjectIds = [...new Set(rowsToImport.map((row) => row.empresa_Id))].map((value) =>
    toObjectId(value, 'empresa_Id'),
  );
  const existingRows = await examenesCollection
    .find({ empresa_Id: { $in: empresaObjectIds } })
    .project({ nombre: 1, empresa_Id: 1, categoria: 1, codigoExamen: 1, codigoInterno: 1 })
    .toArray();

  const existingKeys = new Set(
    existingRows.map((row) =>
      [String(row.empresa_Id ?? ''), String(row.categoria ?? ''), normalizeText(row.nombre)].join(
        '::',
      ),
    ),
  );

  const maxCodigoExamen = existingRows.reduce(
    (max, row) => Math.max(max, Number(row.codigoExamen ?? 0)),
    0,
  );
  const maxCodigoInterno = existingRows.reduce(
    (max, row) => Math.max(max, Number(row.codigoInterno ?? 0)),
    0,
  );

  let nextCodigoExamen = maxCodigoExamen + 1;
  let nextCodigoInterno = maxCodigoInterno + 1;
  const now = new Date();

  const operations = rowsToImport.map((row) => {
    const key = [row.empresa_Id, row.categoriaId, normalizeText(row.nombre)].join('::');
    const shouldInsert = !existingKeys.has(key);
    const codigoExamen = shouldInsert ? nextCodigoExamen++ : undefined;
    const codigoInterno = shouldInsert ? nextCodigoInterno++ : undefined;
    const categoriaObjectId = toObjectId(row.categoriaId, 'categoria');
    const empresaObjectId = toObjectId(row.empresa_Id, 'empresa_Id');
    const usuarioCreaObjectId = toObjectId(row.usuarioCrea_id, 'usuarioCrea_id');
    const usuarioModificaObjectId = toObjectId(
      row.usuarioModifica_id || row.usuarioCrea_id,
      'usuarioModifica_id',
    );

    return {
      updateOne: {
        filter: {
          empresa_Id: empresaObjectId,
          categoria: categoriaObjectId,
          nombre: row.nombre,
        },
        update: {
          $set: {
            sigla: row.sigla,
            precio: row.precio,
            tiempoPreparacion: row.tiempoPreparacion,
            categoria: categoriaObjectId,
            empresa_Id: empresaObjectId,
            estado: 'Activo',
            usuarioModifica_id: usuarioModificaObjectId,
            fechaHora_Modifica: now,
          },
          $setOnInsert: {
            codigoExamen,
            codigoInterno,
            nombre: row.nombre,
            empresa_Id: empresaObjectId,
            usuarioCrea_id: usuarioCreaObjectId,
            fechaHora_Crea: now,
          },
        },
        upsert: true,
      },
    };
  });

  const inserts = operations.filter(
    (operation) => operation.updateOne.update.$setOnInsert.codigoExamen !== undefined,
  ).length;
  const updates = operations.length - inserts;

  console.log(
    JSON.stringify(
      {
        workbookPath,
        totalFilasExcel: rawRows.length,
        filasValidas: normalizedRows.length,
        filasUnicas: dedupedRows.length,
        insertaria: inserts,
        actualizaria: updates,
        reparacionesCategoria,
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

  for (const reparacion of reparacionesCategoria) {
    await categoriasCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(reparacion.categoriaId) },
      {
        $set: {
          empresa_Id: toObjectId(reparacion.empresaNueva, 'empresa_Id'),
          fechaHora_Modifica: now,
        },
      },
    );
  }

  if (operations.length > 0) {
    await examenesCollection.bulkWrite(operations, { ordered: false });
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
