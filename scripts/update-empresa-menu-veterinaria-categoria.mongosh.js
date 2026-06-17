const empresaId = ObjectId('REEMPLAZAR_EMPRESA_ID');

const menuItemActualizado = [
  {
    _id: ObjectId('69d84e67a3274a7d6177c1da'),
    despliegaNombre: 'Portada',
    iconoNombre: 'dashboard',
    route: 'portada',
    tipoPermiso: '',
    indeterminate: false,
    seleccionado: false,
    children: [],
  },
  {
    _id: ObjectId('69d84e67a3274a7d6177c1db'),
    despliegaNombre: 'Fichas',
    iconoNombre: 'folder_open',
    route: 'fichas',
    tipoPermiso: '',
    indeterminate: false,
    seleccionado: false,
    children: [],
  },
  {
    _id: ObjectId('69d84e67a3274a7d6177c1dc'),
    despliegaNombre: 'Pagos',
    iconoNombre: 'payments',
    route: 'pagos',
    tipoPermiso: '',
    indeterminate: false,
    seleccionado: false,
    children: [],
  },
  {
    _id: ObjectId('69d84e67a3274a7d6177c1dd'),
    despliegaNombre: 'Mantenedores',
    iconoNombre: 'format_list_bulleted',
    route: 'mantenedores',
    tipoPermiso: '',
    indeterminate: false,
    seleccionado: false,
    children: [
      {
        _id: ObjectId('69d84e67a3274a7d6177c1de'),
        despliegaNombre: 'Usuarios',
        iconoNombre: 'group',
        route: 'usuarios',
        tipoPermiso: '',
        indeterminate: false,
        seleccionado: false,
        children: [],
      },
      {
        _id: ObjectId('69d84e67a3274a7d6177c1df'),
        despliegaNombre: 'Clientes',
        iconoNombre: 'handshake',
        route: 'cliente',
        tipoPermiso: '',
        indeterminate: false,
        seleccionado: false,
        children: [],
      },
      {
        despliegaNombre: 'Categoría',
        iconoNombre: 'category',
        route: 'categoria',
        tipoPermiso: '',
        indeterminate: false,
        seleccionado: false,
        children: [],
      },
      {
        _id: ObjectId('69d84e67a3274a7d6177c1e0'),
        despliegaNombre: 'Exámen',
        iconoNombre: 'assignment',
        route: 'examen',
        tipoPermiso: '',
        indeterminate: false,
        seleccionado: false,
        children: [],
      },
      {
        _id: ObjectId('69d84e67a3274a7d6177c1e1'),
        despliegaNombre: 'Especie',
        iconoNombre: 'pets',
        route: 'especie',
        tipoPermiso: '',
        indeterminate: false,
        seleccionado: false,
        children: [],
      },
      {
        _id: ObjectId('69d84e67a3274a7d6177c1e2'),
        despliegaNombre: 'Raza',
        iconoNombre: 'fingerprint',
        route: 'raza',
        tipoPermiso: '',
        indeterminate: false,
        seleccionado: false,
        children: [],
      },
    ],
  },
];

const resultado = db.getCollection('empresas').updateOne(
  { _id: empresaId },
  {
    $set: {
      MenuItem: menuItemActualizado,
      fechaHora_modifica: new Date(),
    },
  },
);

printjson({
  matchedCount: resultado.matchedCount,
  modifiedCount: resultado.modifiedCount,
});
