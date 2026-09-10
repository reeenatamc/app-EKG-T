import type { AuthService } from '@/auth/AuthService';
import { httpAuthService } from '@/auth/HttpAuthService';

/**
 * El servicio de autenticacion que usa la aplicacion.
 *
 * Existe para que elegir implementacion sea una linea y no una busqueda por
 * siete pantallas. Antes cada una importaba `mockAuthService` directamente, asi
 * que conectar el backend habria significado editarlas todas, y volver atras
 * para una demo sin servidor, editarlas todas otra vez.
 *
 * `MockAuthService` sigue existiendo y no es codigo muerto: es lo que permite
 * ensenar la aplicacion sin levantar nada, y lo que usan las pruebas. Cambiar
 * de una a otra es cambiar la asignacion de abajo.
 */
export const authService: AuthService = httpAuthService;
