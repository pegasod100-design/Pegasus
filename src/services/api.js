// src/services/api.js
import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

// Agregar interceptor para incluir el token en todas las peticiones
// Soporta login con RFC (JWT propio) y login con Google (Supabase token)
api.interceptors.request.use(async (config) => {
  // 1) Prioridad: JWT del login con RFC
  const jwtToken = localStorage.getItem('jwt_token');
  if (jwtToken) {
    config.headers.Authorization = `Bearer ${jwtToken}`;
    return config;
  }
  // 2) Fallback: token de sesión Google (Supabase)
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// ── Productos ─────────────────────────────
export const getProductos = (params) => api.get('/productos', { params });
export const getProducto = (codigo) => api.get(`/productos/${codigo}`);
export const createProducto = (data) => api.post('/productos', data);
export const updateProducto = (codigo, data) => api.put(`/productos/${codigo}`, data);
export const deleteProducto = (codigo) => api.delete(`/productos/${codigo}`);
export const getCategorias = () => api.get('/productos/categorias');

// ── Inventario ────────────────────────────
export const getInventario = (params) => api.get('/inventario', { params });
export const getAlertasStock = () => api.get('/inventario/alertas');
export const updateLimiteStock = (data) => api.put('/inventario/limite-stock', data);

// ── Ventas ────────────────────────────────
export const getVentas = (params) => api.get('/ventas', { params });
export const getVenta = (folio) => api.get(`/ventas/${folio}`);
export const createVenta = (data) => api.post('/ventas', data);
export const getEstadisticasVentas = (params) => api.get('/ventas/estadisticas/resumen', { params });

// ── Facturas ──────────────────────────────
export const getFacturas = (params) => api.get('/facturas', { params });
export const getFactura = (folio) => api.get(`/facturas/${folio}`);
export const createFactura = (data) => api.post('/facturas', data);
export const getProveedores = () => api.get('/facturas/proveedores/lista');

// ── Empleados ─────────────────────────────
export const getEmpleados = (params) => api.get('/empleados', { params });
export const getEmpleado = (rfc) => api.get(`/empleados/${rfc}`);
export const createEmpleado = (data) => api.post('/empleados', data);
export const updateEmpleado = (rfc, data) => api.put(`/empleados/${rfc}`, data);

// ── Buscar producto en tiendas ────────────
export const buscarProductoEnTiendas = (codigo) => api.get(`/buscar-producto/${codigo}`);

// ── Tiendas ───────────────────────────────
export const getTiendas = () => api.get('/tiendas');
export const getTienda = (id) => api.get(`/tiendas/${id}`);
export const createTienda = (data) => api.post('/tiendas', data);
export const updateTienda = (id, data) => api.put(`/tiendas/${id}`, data);
export const deleteTienda = (id) => api.delete(`/tiendas/${id}`);

// ── Reportes ──────────────────────────────
export const getDashboard = () => api.get('/reportes/dashboard');
export const getVentasPorDia = (params) => api.get('/reportes/ventas-por-dia', { params });
export const getProductosMasVendidos = (params) => api.get('/reportes/productos-mas-vendidos', { params });
export const getVentasPorTienda = (params) => api.get('/reportes/ventas-por-tienda', { params });
export const getStockGlobal = () => api.get('/reportes/stock-global');

export default api;