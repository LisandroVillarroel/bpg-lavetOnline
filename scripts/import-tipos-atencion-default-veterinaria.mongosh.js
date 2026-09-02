const tiposAtencionDefault = [
  {
    nombre: 'Consulta general',
    descripcion: 'Evaluación clínica general del paciente.',
    aliases: ['Consulta'],
  },
  {
    nombre: 'Control',
    descripcion: 'Seguimiento de evolución o tratamiento.',
    aliases: ['Seguimiento'],
  },
  { nombre: 'Emergencia', descripcion: 'Atención clínica prioritaria.', aliases: ['Urgencia'] },
  {
    nombre: 'Vacunación',
    descripcion: 'Aplicación o control de vacunas.',
    aliases: ['Vacunacion'],
  },
  { nombre: 'Desparasitación', descripcion: 'Desparasitación interna o externa.' },
  { nombre: 'Examen preventivo', descripcion: 'Evaluación preventiva y controles de rutina.' },
  { nombre: 'Cirugía', descripcion: 'Procedimiento quirúrgico veterinario.', aliases: ['Cirugia'] },
  { nombre: 'Laboratorio', descripcion: 'Toma o revisión de exámenes de laboratorio.' },
  { nombre: 'Imagenología', descripcion: 'Radiografía, ecografía u otro estudio de imagen.' },
  { nombre: 'Odontología', descripcion: 'Evaluación y tratamiento odontológico.' },
  { nombre: 'Hospitalización', descripcion: 'Ingreso y manejo clínico hospitalario.' },
  { nombre: 'Rehabilitación', descripcion: 'Terapia y recuperación funcional.' },
  { nombre: 'Tratamiento prolongado', descripcion: 'Manejo de tratamientos de larga duración.' },
];

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

  for (const tipoAtencion of tiposAtencionDefault) {
    const { nombre, descripcion, aliases = [] } = tipoAtencion;
    const existente = db.getCollection('tipoatencions').findOne({
      empresa_Id: empresaId,
      nombre: { $in: [nombre, ...aliases] },
    });

    if (!existente) {
      const nuevo = {
        nombre,
        descripcion,
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

    db.getCollection('tipoatencions').updateOne(
      { _id: existente._id },
      { $set: { nombre, descripcion, estado: 'Activo', fechaHora_Modifica: new Date() } },
    );

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
