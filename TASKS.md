# Tareas front

Depende de los endpoints de recetas del backend (ver TASKS.md del backend).

## Preparacion
- [ ] Script `api:types` con openapi-typescript contra `/_openapi.json` del backend y sustituir los tipos duplicados (`CategoryWithLocales`, etc.).
- [ ] Store de categorias: refrescar desde la API aunque haya datos persistidos (ahora nunca se actualiza).
- [ ] Proteger `/edit` con el middleware `auth`.

## Recetas
- [ ] `pages/[category]/[[recipe]].vue`: cargar listado real y receta seleccionada; eliminar el mock.
- [ ] `RecipeList.vue`: listado desde la API en vez del array fijo.
- [ ] `recipe/edit/form.vue`: quitar el array fijo de opciones, cargar la receta existente, implementar `onSubmit` (crear/editar) con feedback (toast) y errores.
- [ ] Configurar el proveedor `cloudinary` de @nuxt/image con `baseURL: https://res.cloudinary.com/dulcetoxo/image/upload/` y pintar las imagenes de recetas con `<NuxtImg provider="cloudinary" :src="public_id">` (formato y tamanio por modificadores).
- [ ] `form/Upload.vue`: subir imagenes a `POST /api/uploads` del backend y guardar el `public_id` devuelto.
- [ ] Estados de carga, vacio y error en listado y detalle.

## PrimeVue 5: sustituir APIs obsoletas (funcionan hasta v6)
- [ ] `Password` -> `InputPassword` (`app/components/form/Password.vue`; revisar login y registro).
- [ ] `Carousel` con `:value` -> API compuesta (`app/components/recipe/Content.vue`).
- [ ] `Image` -> `Gallery` (`app/components/recipe/Content.vue`, `app/components/form/Upload.vue`).
- [ ] `Button` con props `label`/`icon` -> contenido en el slot por defecto (revisar todos los `<Button>`).

## Recortar / pulir
- [ ] Dashboard: reducir a "Mi cuenta" o quitarlo; textos fijos en castellano pasarlos a i18n.
- [ ] Revisar y quitar dependencias que no se usan (candidatas: mdn-data, resolve, postcss-calc, async, blendy).
- [ ] Tests con Vitest de los schemas de `shared/schemas`.
- [ ] README propio.
- [ ] Despliegue (front + backend) y `BACKEND_URL` de produccion.
