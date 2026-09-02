const tipos = db.getCollection('tipocatalogoclinicos').find({ estado: 'Activo' }).toArray();
const tiposPorCodigo = new Map(tipos.map((tipo) => [tipo.codigo, tipo._id]));
const equivalencias = {
  MOTIVO_CONSULTA: 'MOTIVO_CONSULTA',
  DIAGNOSTICO: 'DIAGNOSTICO',
  VACUNA: 'VACUNA',
  INSUMO: 'INSUMO',
};

let vinculados = 0;
for (const [codigo, tipoId] of tiposPorCodigo) {
  const resultado = db.getCollection('catalogoclinicos').updateMany(
    {
      tipo: equivalencias[codigo],
      $or: [{ tipoCatalogoClinico_Id: { $exists: false } }, { tipoCatalogoClinico_Id: null }],
    },
    { $set: { tipoCatalogoClinico_Id: tipoId } },
  );
  vinculados += resultado.modifiedCount;
}

// el modelo ya no define 'tipo': se limpia el campo legado de los documentos existentes
const limpieza = db
  .getCollection('catalogoclinicos')
  .updateMany({ tipo: { $exists: true } }, { $unset: { tipo: '' } });

printjson({
  tiposDisponibles: tipos.length,
  registrosVinculados: vinculados,
  registrosLimpiados: limpieza.modifiedCount,
});
