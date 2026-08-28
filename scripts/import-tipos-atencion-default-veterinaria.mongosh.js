const tiposAtencionDefault = ['Consulta', 'Vacunacion', 'Cirugia', 'Seguimiento', 'Urgencia'];

const empresas = db
  .getCollection('empresas')
  .find({
    estado: { $ne: 'Borrado' },
    tipoEmpresa: { $in: ['Veterinaria', 'veterinaria'] },
  })
  .toArray();

let empresasProcesadas = 0;
let registrosInsertados = 0;
let registrosReactivados = 0;

for (const empresa of empresas) {
  empresasProcesadas += 1;
  const empresaId = empresa._id;
  const usuarioId = empresa.usuarioCrea_id || empresa.usuarioModifica_id || null;

  for (const nombre of tiposAtencionDefault) {
    const existente = db.getCollection('tipoatencions').findOne({
      empresa_Id: empresaId,
      nombre,
    });

    if (!existente) {
      const nuevo = {
        nombre,
        descripcion: '',
        empresa_Id: empresaId,
        estado: 'Activo',
        fechaHora_Crea: new Date(),
      };

      if (usuarioId) {
        nuevo.usuarioCrea_id = usuarioId;
      }

      db.getCollection('tipoatencions').insertOne(nuevo);
      registrosInsertados += 1;
      continue;
    }

    if (existente.estado === 'Borrado') {
      const setData = {
        estado: 'Activo',
        fechaHora_Modifica: new Date(),
      };

      if (usuarioId) {
        setData.usuarioModifica_id = usuarioId;
      }

      db.getCollection('tipoatencions').updateOne(
        { _id: existente._id },
        {
          $set: setData,
        },
      );

      registrosReactivados += 1;
    }
  }
}

printjson({
  empresasProcesadas,
  tiposPorEmpresa: tiposAtencionDefault.length,
  registrosInsertados,
  registrosReactivados,
});
