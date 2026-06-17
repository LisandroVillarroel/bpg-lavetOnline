const nombreMenu = 'Administración';
const rutaPadre = 'administracion';
const nuevaRuta = 'menu';

const nuevoItem = {
  despliegaNombre: 'Menú',
  iconoNombre: 'menu_book',
  route: nuevaRuta,
  tipoPermiso: '',
  indeterminate: false,
  seleccionado: false,
  children: [],
};

const menuDocument = db.getCollection('menus').findOne({ nombreMenu });

if (!menuDocument) {
  printjson({
    error: true,
    mensaje: `No se encontro el menu ${nombreMenu}`,
  });
} else {
  const menuItems = Array.isArray(menuDocument.menuItem) ? menuDocument.menuItem : [];

  const existeEnRaiz = menuItems.some(
    (item) => item?.route === 'administracion/menu' || item?.despliegaNombre === 'Menú',
  );

  const agregarEnNodo = (items) => {
    for (const item of items) {
      if (item?.route === rutaPadre || item?.despliegaNombre === 'Administración') {
        item.children = Array.isArray(item.children) ? item.children : [];

        const existeHijo = item.children.some(
          (child) =>
            child?.route === nuevaRuta || child?.despliegaNombre === nuevoItem.despliegaNombre,
        );

        if (!existeHijo) {
          item.children.push({ ...nuevoItem });
        }

        return true;
      }

      if (Array.isArray(item?.children) && item.children.length > 0) {
        const agregado = agregarEnNodo(item.children);
        if (agregado) {
          return true;
        }
      }
    }

    return false;
  };

  let modificado = false;

  if (!existeEnRaiz) {
    modificado = agregarEnNodo(menuItems);

    if (!modificado) {
      menuItems.push({
        ...nuevoItem,
        route: 'administracion/menu',
      });
      modificado = true;
    }
  }

  const resultado = db.getCollection('menus').updateOne(
    { _id: menuDocument._id },
    {
      $set: {
        menuItem: menuItems,
        fechaHora_modifica: new Date(),
      },
    },
  );

  printjson({
    matchedCount: resultado.matchedCount,
    modifiedCount: resultado.modifiedCount,
    modificado,
    menu: nombreMenu,
  });
}
