require('dotenv/config');

const mongoose = require('mongoose');

const categorias = [
  'ANATOMÍA PATOLÓGICA',
  'BIOQUÍMICA',
  'COPROLÓGICOS',
  'DETERMINACIONES SEROLÓGICAS',
  'FLUIDOS ORGÁNICOS',
  'HEMATOLOGIA',
  'HORMONAS',
  'MICROBIOLOGÍA',
  'ORINA',
  'PIEL Y PELOS',
];

const empresaId = '69dda91034ad6e002d043b60';
const usuarioId = '62df12732843bc4f9ca6e345';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGO_DB,
    user: process.env.MONGO_USER,
    pass: process.env.MONGO_PASS,
    authSource: process.env.MONGO_AUTH_SOURCE,
  });

  const collection = mongoose.connection.collection('categorias');
  const now = new Date();
  const operations = categorias.map((nombre) => ({
    updateOne: {
      filter: {
        empresa_Id: empresaId,
        nombre,
      },
      update: {
        $set: {
          estado: 'Activo',
          usuarioModifica_id: usuarioId,
          fechaHora_Modifica: now,
        },
        $setOnInsert: {
          nombre,
          sigla: nombre,
          empresa_Id: empresaId,
          usuarioCrea_id: usuarioId,
          fechaHora_Crea: now,
        },
      },
      upsert: true,
    },
  }));

  const result = await collection.bulkWrite(operations, { ordered: false });

  console.log(
    JSON.stringify(
      {
        total: categorias.length,
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        upsertedCount: result.upsertedCount,
      },
      null,
      2,
    ),
  );

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
