const catalogosPorTipo = {
  MOTIVO_CONSULTA: [
    {
      codigo: 'MC-001',
      nombre: 'Consulta preventiva',
      descripcion: 'Control general y seguimiento preventivo.',
    },
    {
      codigo: 'MC-002',
      nombre: 'Vacunación',
      descripcion: 'Aplicación o control de esquema de vacunación.',
    },
    { codigo: 'MC-003', nombre: 'Control', descripcion: 'Revisión de evolución o tratamiento.' },
    {
      codigo: 'MC-004',
      nombre: 'Enfermedad',
      descripcion: 'Atención por signos o síntomas clínicos.',
    },
    { codigo: 'MC-005', nombre: 'Urgencia', descripcion: 'Atención clínica prioritaria.' },
  ],
  DIAGNOSTICO: [
    {
      codigo: 'DX-001',
      nombre: 'Paciente sano',
      descripcion: 'Sin hallazgos clínicos relevantes.',
    },
    { codigo: 'DX-002', nombre: 'Dermatitis', descripcion: 'Alteración inflamatoria de la piel.' },
    {
      codigo: 'DX-003',
      nombre: 'Gastroenteritis',
      descripcion: 'Signos gastrointestinales compatibles.',
    },
    { codigo: 'DX-004', nombre: 'Otitis', descripcion: 'Inflamación o infección del oído.' },
    {
      codigo: 'DX-005',
      nombre: 'Enfermedad periodontal',
      descripcion: 'Alteración de encías o estructuras periodontales.',
    },
  ],
  VACUNA: [
    {
      codigo: 'VAC-001',
      nombre: 'Óctuple canina',
      descripcion: 'Vacuna múltiple para perros.',
      precio: 18000,
    },
    {
      codigo: 'VAC-002',
      nombre: 'Antirrábica',
      descripcion: 'Vacuna contra la rabia.',
      precio: 12000,
    },
    {
      codigo: 'VAC-003',
      nombre: 'Triple felina',
      descripcion: 'Vacuna múltiple para gatos.',
      precio: 18000,
    },
  ],
  INSUMO: [
    { codigo: 'INS-001', nombre: 'Jeringa 3 ml', descripcion: 'Jeringa descartable.', precio: 500 },
    {
      codigo: 'INS-002',
      nombre: 'Guantes descartables',
      descripcion: 'Par de guantes descartables.',
      precio: 300,
    },
    {
      codigo: 'INS-003',
      nombre: 'Gasa estéril',
      descripcion: 'Gasa estéril para procedimiento.',
      precio: 250,
    },
  ],
};

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
  const usuarioId = empresa.usuarioCrea_id || empresa.usuarioModifica_id || null;

  for (const [tipo, registros] of Object.entries(catalogosPorTipo)) {
    for (const registro of registros) {
      const existente = db.getCollection('catalogoclinicos').findOne({
        empresa_Id: empresa._id,
        tipo,
        codigo: registro.codigo,
      });

      if (!existente) {
        const nuevo = {
          ...registro,
          tipo,
          empresa_Id: empresa._id,
          estado: 'Activo',
          fechaHora_Crea: new Date(),
        };

        if (usuarioId) {
          nuevo.usuarioCrea_id = usuarioId;
        }

        db.getCollection('catalogoclinicos').insertOne(nuevo);
        registrosInsertados += 1;
      } else if (existente.estado === 'Borrado') {
        const setData = {
          estado: 'Activo',
          fechaHora_Modifica: new Date(),
        };

        if (usuarioId) {
          setData.usuarioModifica_id = usuarioId;
        }

        db.getCollection('catalogoclinicos').updateOne({ _id: existente._id }, { $set: setData });
        registrosReactivados += 1;
      }
    }
  }
}

printjson({
  empresasProcesadas,
  registrosPorEmpresa: Object.values(catalogosPorTipo).flat().length,
  registrosInsertados,
  registrosReactivados,
});
