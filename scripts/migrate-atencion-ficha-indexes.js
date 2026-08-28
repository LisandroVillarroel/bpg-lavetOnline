require('dotenv').config();

const mongoose = require('mongoose');

const indexes = {
  atenciones: [
    {
      key: { empresa_Id: 1, estado: 1, fechaAtencion: -1 },
      name: 'empresa_Id_1_estado_1_fechaAtencion_-1',
    },
    {
      key: { ficha_Id: 1, estado: 1, fechaAtencion: -1 },
      name: 'ficha_Id_1_estado_1_fechaAtencion_-1',
    },
    {
      key: { empresa_Id: 1, tipoAtencion_Id: 1, estado: 1 },
      name: 'empresa_Id_1_tipoAtencion_Id_1_estado_1',
    },
  ],
  fichas: [
    { key: { empresa_Id: 1, estado: 1, nombre: 1 }, name: 'empresa_Id_1_estado_1_nombre_1' },
    {
      key: { propietario_Id: 1, estado: 1, nombre: 1 },
      name: 'propietario_Id_1_estado_1_nombre_1',
    },
  ],
};

async function ensureIndexes(collectionName, collectionIndexes) {
  const collection = mongoose.connection.collection(collectionName);
  const existing = await collection.indexes();

  for (const index of collectionIndexes) {
    if (existing.some((current) => current.name === index.name)) {
      console.log(`Indice ya existe en ${collectionName}: ${index.name}`);
      continue;
    }

    await collection.createIndex(index.key, { name: index.name });
    console.log(`Indice creado en ${collectionName}: ${index.name}`);
  }
}

async function main() {
  const { MONGODB_URI, MONGO_DB, MONGO_USER, MONGO_PASS, MONGO_AUTH_SOURCE } = process.env;

  if (!MONGODB_URI || !MONGO_DB || !MONGO_USER || !MONGO_PASS || !MONGO_AUTH_SOURCE) {
    throw new Error('Faltan variables de entorno de MongoDB');
  }

  await mongoose.connect(MONGODB_URI, {
    dbName: MONGO_DB,
    user: MONGO_USER,
    pass: MONGO_PASS,
    authSource: MONGO_AUTH_SOURCE,
  });

  try {
    for (const [collectionName, collectionIndexes] of Object.entries(indexes)) {
      await ensureIndexes(collectionName, collectionIndexes);
    }
    console.log('Migracion de indices de atenciones y fichas completada');
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error('Error al migrar indices de atenciones y fichas:', error);
  process.exit(1);
});
