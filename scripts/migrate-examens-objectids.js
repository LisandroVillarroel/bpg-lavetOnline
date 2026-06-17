require('dotenv/config');

const mongoose = require('mongoose');

function toObjectIdOrNull(value) {
  if (value instanceof mongoose.Types.ObjectId) {
    return value;
  }

  const normalized = String(value ?? '').trim();
  if (!normalized) {
    return null;
  }

  if (!mongoose.Types.ObjectId.isValid(normalized)) {
    return null;
  }

  return new mongoose.Types.ObjectId(normalized);
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGO_DB,
    user: process.env.MONGO_USER,
    pass: process.env.MONGO_PASS,
    authSource: process.env.MONGO_AUTH_SOURCE,
  });

  const collection = mongoose.connection.collection('examens');
  const docs = await collection.find({}).toArray();

  const operations = docs
    .map((doc) => {
      const categoria = toObjectIdOrNull(doc.categoria);
      const empresaId = toObjectIdOrNull(doc.empresa_Id);
      const usuarioCreaId = toObjectIdOrNull(doc.usuarioCrea_id);
      const usuarioModificaId = toObjectIdOrNull(doc.usuarioModifica_id);

      const set = {};

      if (categoria) {
        set.categoria = categoria;
      }

      if (empresaId) {
        set.empresa_Id = empresaId;
      }

      if (usuarioCreaId) {
        set.usuarioCrea_id = usuarioCreaId;
      }

      if (usuarioModificaId) {
        set.usuarioModifica_id = usuarioModificaId;
      }

      if (Object.keys(set).length === 0) {
        return null;
      }

      return {
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: set },
        },
      };
    })
    .filter(Boolean);

  if (operations.length === 0) {
    console.log(
      JSON.stringify({ matchedCount: 0, modifiedCount: 0, note: 'Sin cambios' }, null, 2),
    );
    await mongoose.disconnect();
    return;
  }

  const result = await collection.bulkWrite(operations, { ordered: false });

  console.log(
    JSON.stringify(
      {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
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
