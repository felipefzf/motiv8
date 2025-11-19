## Objetivo
- Reutilizar el recorte de imagen de `CreateTeamForm` para que el usuario edite su foto de perfil con el mismo flujo de `react-image-crop`.

## Contexto actual
- Cropper funcionando en `frontend/src/components/createTeamForm.jsx:185-213` con `ReactCrop` y canvas oculto.
- Utilidades genéricas en `frontend/src/utils/canvasPreview.js:3-57` (`canvasPreview`, `getCanvasBlob`).
- Perfil muestra un asset estático en `frontend/src/pages/profile.jsx:109-113` (`tomy.png`). No hay UI de edición ni endpoint para avatar.
- Backend ya sube imágenes de equipo en `backend/server.js:437-500` con `multer`, `bucket`, y URL pública.

## Reutilización del cropper (Frontend)
- Crear un componente reutilizable `AvatarCropper` que encapsule `ReactCrop` con `aspect=1` y use `canvasPreview`/`getCanvasBlob`.
- Props del componente:
  - `onClose()`: cerrar modal.
  - `onCropped(blob, previewUrl)`: entrega el Blob y la vista previa tras «Confirmar Recorte».
- Implementación:
  - Reusar la misma lógica de `onSelectFile`, `onImageLoad`, `handleSaveCrop`, refs `imgRef`/`canvasRef` del `CreateTeamForm`.
  - Mantener `circularCrop` para guía visual redonda.

## Integración en Perfil
- En `frontend/src/pages/profile.jsx`:
  - Reemplazar `src={tomy}` por `src={perfil?.avatar_url || tomy}` para mostrar avatar si existe.
  - Añadir botón `Cambiar foto` que abre un modal con `AvatarCropper`.
  - Al confirmar recorte, construir `FormData` con `avatarFile` (Blob) y enviar al backend.
  - Al recibir `avatar_url`, actualizar estado `setPerfil((p) => ({ ...p, avatar_url }))` para refrescar la imagen.

## Endpoint Backend para avatar
- En `backend/server.js` agregar:
  - `POST /api/users/avatar` protegido con `verifyToken` y `upload.single('avatarFile')`.
  - Guardar en `bucket` bajo `user_avatars/${user.uid}-${Date.now()}-${file.originalname}`.
  - `makePublic()` y obtener `publicUrl()`.
  - Actualizar `db.collection('users').doc(user.uid).update({ avatar_url })`.
  - Responder `200` con `{ avatar_url }`.
- Reusar patrón de subida ya implementado en `/api/teams` para coherencia.

## Validaciones y seguridad
- Limitar tipos MIME a `image/jpeg`, `image/png`, `image/webp`.
- Tamaño máximo (p.ej. 5 MB) y manejo de error claro en frontend.
- Nombre de archivo saneado y prefijo de carpeta `user_avatars/`.

## UI/UX
- Mostrar preview y opción de «Editar» antes de subir.
- Estados `isLoading` y deshabilitar botones durante subida.
- Fallback a `tomy.png` si `avatar_url` no existe o falla.

## Pruebas y verificación
- Flujo manual: seleccionar imagen, recortar, confirmar, subir; verificar que el avatar se actualiza en Profile.
- Verificar URL pública accesible y persistencia en Firestore.
- Probar errores: sin token, archivo inválido, tamaño excedido.

## Entregables
- `AvatarCropper` reutilizable en `frontend/src/components/`.
- Cambios en `profile.jsx` para UI de edición y visualización de `avatar_url`.
- Nuevo endpoint `/api/users/avatar` en `backend/server.js`.
- Reutilización comprobada del mismo recorte usado en `CreateTeamForm`.