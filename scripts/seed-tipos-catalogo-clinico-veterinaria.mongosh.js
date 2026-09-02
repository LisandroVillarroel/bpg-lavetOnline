const tipos = [
  {
    codigo: 'MOTIVO_CONSULTA',
    nombre: 'Motivo de consulta',
    descripcion: 'Motivos por los que se solicita la atención.',
  },
  {
    codigo: 'DIAGNOSTICO',
    nombre: 'Diagnóstico',
    descripcion: 'Diagnósticos clínicos del paciente.',
  },
  { codigo: 'VACUNA', nombre: 'Vacuna', descripcion: 'Vacunas aplicables al paciente.' },
  { codigo: 'INSUMO', nombre: 'Insumo', descripcion: 'Insumos utilizados en la atención.' },
];

const empresas = db
  .getCollection('empresas')
  .find({ estado: { $ne: 'Borrado' }, tipoEmpresa: { $in: ['Veterinaria', 'veterinaria'] } })
  .toArray();
let empresasProcesadas = 0;
let insertados = 0;
let actualizados = 0;

for (const empresa of empresas) {
  empresasProcesadas += 1;
  const usuarioId = empresa.usuarioCrea_id || empresa.usuarioModifica_id || null;
  for (const tipo of tipos) {
    const resultado = db
      .getCollection('tipocatalogoclinicos')
      .updateOne(
        { empresa_Id: empresa._id, codigo: tipo.codigo },
        {
          $set: {
            ...tipo,
            empresa_Id: empresa._id,
            estado: 'Activo',
            fechaHora_Modifica: new Date(),
            ...(usuarioId ? { usuarioModifica_id: usuarioId } : {}),
          },
          $setOnInsert: {
            fechaHora_Crea: new Date(),
            ...(usuarioId ? { usuarioCrea_id: usuarioId } : {}),
          },
        },
        { upsert: true },
      );
    insertados += resultado.upsertedCount || 0;
    actualizados += resultado.modifiedCount || 0;
  }
}

printjson({ empresasProcesadas, tiposPorEmpresa: tipos.length, insertados, actualizados });
