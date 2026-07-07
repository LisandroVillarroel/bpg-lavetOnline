require('dotenv').config();

const mongoose = require('mongoose');

async function replaceUniqueIndex(collectionName) {
  const collection = mongoose.connection.collection(collectionName);
  const indexes = await collection.indexes();
  const legacySiglaIndex = indexes.find(
    (index) => index.name === 'sigla_1' && index.unique === true,
  );

  if (legacySiglaIndex) {
    await collection.dropIndex('sigla_1');
    console.log(`Indice legacy eliminado en ${collectionName}: sigla_1`);
  }

  const compoundIndexName = 'idEmpresa_1_sigla_1';
  const compoundIndex = indexes.find((index) => index.name === compoundIndexName);

  if (!compoundIndex) {
    await collection.createIndex({ idEmpresa: 1, sigla: 1 }, { unique: true });
    console.log(`Indice compuesto creado en ${collectionName}: ${compoundIndexName}`);
  } else {
    console.log(`Indice compuesto ya existe en ${collectionName}: ${compoundIndexName}`);
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
    await replaceUniqueIndex('tipoveterinarios');
    await replaceUniqueIndex('rolveterinarios');
    console.log('Migracion de indices completada');
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error('Error al migrar indices veterinarios:', error);
  process.exit(1);
});
