# Contribuir a Rustick

¡Gracias por tu interés en contribuir a Rustick! Esta guía te ayudará a comenzar.

## Código de Conducta

Sé respetuoso y constructivo. acogemos a contribuyentes de todos los orígenes.

## Cómo Contribuir

### Reportar Errores

1. Verifica si el error [ya existe](https://github.com/rottioris/rustick/issues)
2. Abre un nuevo issue con:
   - Título claro
   - Pasos para reproducir
   - Comportamiento esperado vs actual
   - Capturas de pantalla si aplica

### Sugerir Funciones

1. Busca [sugerencias existentes](https://github.com/rottioris/rustick/issues)
2. Abre un nuevo issue etiquetado como `feature-request`
3. Explica el caso de uso y la solución propuesta

### Pull Requests

1. Haz **Fork** del repositorio

```bash
git clone https://github.com/TU_USUARIO/rst-timer.git
cd rst-timer
```

2. Crea una nueva rama

```bash
git checkout -b feature/mi-nueva-funcionalidad
```

3. Haz tus cambios y commitea

```bash
git add .
git commit -m "Añadir nueva funcionalidad"
```

4. Push a tu fork

```bash
git push origin feature/mi-nueva-funcionalidad
```

5. Abre un **Pull Request**

### Configuración de Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar modo desarrollo
npm run tauri dev
```

### Estándares de Código

- Usa TypeScript para código del frontend
- Usa Rust para lógica del backend
- Ejecuta `npm run build` antes de.commitir
- Mantén los cambios focalizados y mínimos

## Recursos

- [Repositorio GitHub](https://github.com/rottioris/rustick)
- [Issues](https://github.com/rottioris/rustick/issues)
- [Discusiones](https://github.com/rottioris/rustick/discussions)