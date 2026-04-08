import { Request, Response } from 'express';
import { MenuModel, IMenu, IMenuItem } from './menu.model';

type ApiResponse<T> = {
  error: boolean;
  data: T | null;
  codigo: number;
  mensaje: string;
};

const buildResponse = <T>(overrides?: Partial<ApiResponse<T>>): ApiResponse<T> => ({
  error: false,
  data: null,
  codigo: 200,
  mensaje: 'ok',
  ...overrides,
});

/**
 * Obtener todos los menús
 * GET /api/menu
 */
export async function obtenerMenus(req: Request, res: Response) {
  try {
    const menus = await MenuModel.find();
    return res.status(200).json(
      buildResponse({
        data: menus,
        codigo: 200,
        mensaje: 'Menús obtenidos exitosamente',
      }),
    );
  } catch (error) {
    console.error('Error al obtener menús:', error);
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al obtener menús',
      }),
    );
  }
}

/**
 * Obtener menú por tipo (Laboratorio, Veterinaria, Propietario)
 * GET /api/menu/:tipo
 */
export async function obtenerMenuPorTipo(req: Request, res: Response) {
  try {
    const { tipo } = req.params;

    if (!tipo) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 400,
          mensaje: 'Tipo de menú requerido',
        }),
      );
    }

    if (!['Laboratorio', 'Veterinaria', 'Propietario'].includes(tipo)) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 400,
          mensaje: 'Tipo debe ser: Laboratorio, Veterinaria o Propietario',
        }),
      );
    }

    const menu = await MenuModel.findOne({ nombreMenu: tipo });

    if (!menu) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Menú no encontrado',
        }),
      );
    }

    return res.status(200).json(
      buildResponse({
        data: menu,
        codigo: 200,
        mensaje: 'Menú obtenido exitosamente',
      }),
    );
  } catch (error) {
    console.error('Error al obtener menú:', error);
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al obtener menú',
      }),
    );
  }
}

/**
 * Obtener menú por ID
 * GET /api/menu/id/:id
 */
export async function obtenerMenuPorId(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 400,
          mensaje: 'ID requerido',
        }),
      );
    }

    const menu = await MenuModel.findById(id);

    if (!menu) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Menú no encontrado',
        }),
      );
    }

    return res.status(200).json(
      buildResponse({
        data: menu,
        codigo: 200,
        mensaje: 'Menú obtenido exitosamente',
      }),
    );
  } catch (error) {
    console.error('Error al obtener menú:', error);
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al obtener menú',
      }),
    );
  }
}

/**
 * Crear nuevo menú
 * POST /api/menu
 */
export async function crearMenu(req: Request, res: Response) {
  try {
    const { nombreMenu, menuItem, estado, usuarioCrea_id } = req.body;

    if (!nombreMenu || !menuItem) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 400,
          mensaje: 'nombreMenu y menuItem son requeridos',
        }),
      );
    }

    if (!['Laboratorio', 'Veterinaria', 'Propietario'].includes(nombreMenu)) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 400,
          mensaje: 'nombreMenu debe ser: Laboratorio, Veterinaria o Propietario',
        }),
      );
    }

    // Verificar si ya existe un menú con ese nombre
    const menuExistente = await MenuModel.findOne({ nombreMenu });
    if (menuExistente) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 409,
          mensaje: `Ya existe un menú para ${nombreMenu}`,
        }),
      );
    }

    const nuevoMenu = new MenuModel({
      nombreMenu,
      menuItem: menuItem || [],
      estado: estado || 'Activo',
      usuarioCrea_id,
    });

    const menuGuardado = await nuevoMenu.save();

    return res.status(201).json(
      buildResponse({
        data: menuGuardado,
        codigo: 201,
        mensaje: 'Menú creado exitosamente',
      }),
    );
  } catch (error) {
    console.error('Error al crear menú:', error);
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al crear menú',
      }),
    );
  }
}

/**
 * Actualizar menú completo
 * PUT /api/menu/:id
 */
export async function actualizarMenu(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { nombreMenu, menuItem, estado, usuarioModifica_id } = req.body;

    if (!id) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 400,
          mensaje: 'ID requerido',
        }),
      );
    }

    const menuExistente = await MenuModel.findById(id);

    if (!menuExistente) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Menú no encontrado',
        }),
      );
    }

    // Si se cambia el nombreMenu, verificar que no exista otro con ese nombre
    if (nombreMenu && nombreMenu !== menuExistente.nombreMenu) {
      const menuConNombreDuplicado = await MenuModel.findOne({ nombreMenu });
      if (menuConNombreDuplicado) {
        return res.status(200).json(
          buildResponse({
            error: true,
            codigo: 409,
            mensaje: `Ya existe un menú para ${nombreMenu}`,
          }),
        );
      }
    }

    const menuActualizado = await MenuModel.findByIdAndUpdate(
      id,
      {
        ...(nombreMenu && { nombreMenu }),
        ...(menuItem !== undefined && { menuItem }),
        ...(estado && { estado }),
        ...(usuarioModifica_id && { usuarioModifica_id }),
      },
      { new: true },
    );

    return res.status(200).json(
      buildResponse({
        data: menuActualizado,
        codigo: 200,
        mensaje: 'Menú actualizado exitosamente',
      }),
    );
  } catch (error) {
    console.error('Error al actualizar menú:', error);
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al actualizar menú',
      }),
    );
  }
}

/**
 * Agregar o actualizar items del menú
 * PUT /api/menu/:id/items
 */
export async function actualizarItemsMenu(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { menuItem, usuarioModifica_id } = req.body;

    if (!id) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 400,
          mensaje: 'ID requerido',
        }),
      );
    }

    if (!menuItem || !Array.isArray(menuItem)) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 400,
          mensaje: 'menuItem debe ser un array',
        }),
      );
    }

    const menuActualizado = await MenuModel.findByIdAndUpdate(
      id,
      {
        menuItem,
        ...(usuarioModifica_id && { usuarioModifica_id }),
      },
      { new: true },
    );

    if (!menuActualizado) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Menú no encontrado',
        }),
      );
    }

    return res.status(200).json(
      buildResponse({
        data: menuActualizado,
        codigo: 200,
        mensaje: 'Items del menú actualizados exitosamente',
      }),
    );
  } catch (error) {
    console.error('Error al actualizar items del menú:', error);
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al actualizar items del menú',
      }),
    );
  }
}

/**
 * Eliminar menú
 * DELETE /api/menu/:id
 */
export async function eliminarMenu(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 400,
          mensaje: 'ID requerido',
        }),
      );
    }

    const menuEliminado = await MenuModel.findByIdAndDelete(id);

    if (!menuEliminado) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Menú no encontrado',
        }),
      );
    }

    return res.status(200).json(
      buildResponse({
        data: menuEliminado,
        codigo: 200,
        mensaje: 'Menú eliminado exitosamente',
      }),
    );
  } catch (error) {
    console.error('Error al eliminar menú:', error);
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al eliminar menú',
      }),
    );
  }
}

/**
 * Cambiar estado del menú (Activo/Inactivo)
 * PATCH /api/menu/:id/estado
 */
export async function cambiarEstadoMenu(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { estado, usuarioModifica_id } = req.body;

    if (!id) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 400,
          mensaje: 'ID requerido',
        }),
      );
    }

    if (!estado || !['Activo', 'Inactivo'].includes(estado)) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 400,
          mensaje: 'Estado debe ser "Activo" o "Inactivo"',
        }),
      );
    }

    const menuActualizado = await MenuModel.findByIdAndUpdate(
      id,
      {
        estado,
        ...(usuarioModifica_id && { usuarioModifica_id }),
      },
      { new: true },
    );

    if (!menuActualizado) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Menú no encontrado',
        }),
      );
    }

    return res.status(200).json(
      buildResponse({
        data: menuActualizado,
        codigo: 200,
        mensaje: 'Estado del menú actualizado exitosamente',
      }),
    );
  } catch (error) {
    console.error('Error al cambiar estado del menú:', error);
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al cambiar estado del menú',
      }),
    );
  }
}
