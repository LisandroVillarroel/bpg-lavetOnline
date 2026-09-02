const rutaPadre = 'mantenedores';

const itemsRequeridos = [
  { despliegaNombre: 'Procedimientos', iconoNombre: 'healing', route: 'procedimiento' },
  { despliegaNombre: 'Medicamentos', iconoNombre: 'medication', route: 'medicamento' },
  { despliegaNombre: 'Tipos de Cobro', iconoNombre: 'payments', route: 'tipo-cobro' },
  { despliegaNombre: 'Tipos de Atencion', iconoNombre: 'medical_services', route: 'tipo-atencion' },
  {
    despliegaNombre: 'Tipos de Catálogo Clínico',
    iconoNombre: 'category',
    route: 'tipos-catalogo-clinico',
  },
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

const empresas = db
  .getCollection('empresas')
  .find({
    estado: { $ne: 'Borrado' },
    tipoEmpresa: { $in: ['Veterinaria', 'veterinaria'] },
  })
  .toArray();

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

let totalEmpresas = 0;
let actualizadas = 0;
let totalItemsAgregados = 0;

for (const empresa of empresas) {
  totalEmpresas += 1;

  const menuItems = Array.isArray(empresa.MenuItem) ? empresa.MenuItem : [];
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

  let agregadosEmpresa = 0;

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
      agregadosEmpresa += 1;
      totalItemsAgregados += 1;
    }
  }

  if (agregadosEmpresa > 0) {
    const resultado = db.getCollection('empresas').updateOne(
      { _id: empresa._id },
      {
        $set: {
          MenuItem: menuItems,
          fechaHora_modifica: new Date(),
        },
      },
    );

    if (resultado.modifiedCount > 0) {
      actualizadas += 1;
    }
  }
}

printjson({
  empresasEncontradas: totalEmpresas,
  empresasActualizadas: actualizadas,
  itemsAgregados: totalItemsAgregados,
  itemsObjetivo: itemsRequeridos.map((x) => x.route),
});
