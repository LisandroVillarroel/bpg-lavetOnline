const empresaId = ObjectId('REEMPLAZAR_EMPRESA_ID');
const rutaPadre = 'mantenedores';

const itemsRequeridos = [
  { despliegaNombre: 'Procedimientos', iconoNombre: 'healing', route: 'procedimiento' },
  { despliegaNombre: 'Medicamentos', iconoNombre: 'medication', route: 'medicamento' },
  { despliegaNombre: 'Tipos de Cobro', iconoNombre: 'payments', route: 'tipo-cobro' },
  { despliegaNombre: 'Tipos de Atención', iconoNombre: 'medical_services', route: 'tipo-atencion' },
  { despliegaNombre: 'Catálogo Clínico', iconoNombre: 'library_books', route: 'catalogo-clinico' },
  {
    despliegaNombre: 'Hospitalizaciones',
    iconoNombre: 'local_hospital',
    route: '../veterinaria/hospitalizaciones',
  },
  { despliegaNombre: 'Inventario', iconoNombre: 'inventory_2', route: '../veterinaria/inventario' },
  {
    despliegaNombre: 'Próximas Vacunas',
    iconoNombre: 'event_available',
    route: '../veterinaria/vacunas-proximas',
  },
];

const empresa = db.getCollection('empresas').findOne({ _id: empresaId });

if (!empresa) {
  printjson({
    error: true,
    mensaje: 'No se encontro la empresa',
  });
} else {
  const menuItems = Array.isArray(empresa.MenuItem) ? empresa.MenuItem : [];

  const buscarNodo = (items) => {
    for (const item of items) {
      if (item?.route === rutaPadre || item?.despliegaNombre === 'Mantenedores') {
        return item;
      }

      if (Array.isArray(item?.children) && item.children.length > 0) {
        const encontrado = buscarNodo(item.children);
        if (encontrado) {
          return encontrado;
        }
      }
    }

    return null;
  };

  let nodoMantenedores = buscarNodo(menuItems);

  if (!nodoMantenedores) {
    nodoMantenedores = {
      despliegaNombre: 'Mantenedores',
      iconoNombre: 'format_list_bulleted',
      route: rutaPadre,
      tipoPermiso: '',
      indeterminate: false,
      seleccionado: false,
      children: [],
    };
    menuItems.push(nodoMantenedores);
  }

  nodoMantenedores.children = Array.isArray(nodoMantenedores.children)
    ? nodoMantenedores.children
    : [];

  let agregados = 0;

  for (const requerido of itemsRequeridos) {
    const existe = nodoMantenedores.children.some(
      (child) =>
        child?.route === requerido.route || child?.despliegaNombre === requerido.despliegaNombre,
    );

    if (!existe) {
      nodoMantenedores.children.push({
        ...requerido,
        tipoPermiso: '',
        indeterminate: false,
        seleccionado: false,
        children: [],
      });
      agregados += 1;
    }
  }

  const resultado = db.getCollection('empresas').updateOne(
    { _id: empresaId },
    {
      $set: {
        MenuItem: menuItems,
        fechaHora_modifica: new Date(),
      },
    },
  );

  printjson({
    matchedCount: resultado.matchedCount,
    modifiedCount: resultado.modifiedCount,
    agregados,
    empresaId,
  });
}
