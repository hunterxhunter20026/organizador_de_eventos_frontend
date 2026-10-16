const CLAVE_TOKEN = 'token';
const CLAVE_NOMBRE = 'usuarioNombre';

export const EVENTO_SESION_INVALIDA = 'hormigapp:sesion-invalida';

export function leerToken(): string | null {
    return localStorage.getItem(CLAVE_TOKEN);
}

export function guardarSesion(token: string, nombre: string): void{
    localStorage.setItem(CLAVE_TOKEN, token);
    localStorage.setItem(CLAVE_NOMBRE, nombre);
}

export function limpiarSesion(): void {
    limpiarSesion();
    window.dispatchEvent(new Event(EVENTO_SESION_INVALIDA));
}

export function invalidarSesion(): void {
    limpiarSesion();
    window.dispatchEvent(new Event(EVENTO_SESION_INVALIDA));
}