# Pictoris Studio Web

Sitio web estatico preparado para desplegar en Cloudflare Pages con medios pesados servidos desde Cloudflare R2.

## Estructura

```text
pictoris-studio-web/
|-- public/
|   |-- index.html
|   |-- experiencias.html
|   |-- marketing.html
|   |-- proyectos.html
|   |-- css/
|   |-- js/
|   |-- assets/
|   |-- favicon.ico
|   |-- robots.txt
|   `-- sitemap.xml
|-- r2-assets/
|   `-- assets/
|-- r2-assets-manifest.txt
`-- README.md
```

## Dominio

Dominio principal:

```text
https://pictoris.co
```

Subdominio recomendado para medios en R2:

```text
https://media.pictoris.co
```

## Cloudflare Pages

Configuracion recomendada:

- Framework preset: `None` o `Static HTML`
- Build command: dejar vacio
- Build output directory: `public`
- Root directory: raiz del repositorio
- Custom domain: `pictoris.co`

La carpeta `public/` es la version publicable del sitio. No subas `r2-assets/` a Pages como parte del sitio, porque esa carpeta esta pensada para Cloudflare R2.

## Cloudflare R2

Los archivos pesados fueron separados en `r2-assets/` y las rutas del sitio ya apuntan a:

```text
https://media.pictoris.co/...
```

Bucket sugerido:

```text
pictoris-media
```

Configuracion recomendada:

- Crear un bucket R2 llamado `pictoris-media`
- Subir el contenido de `r2-assets/` respetando la estructura de carpetas
- Conectar el dominio publico `media.pictoris.co` al bucket
- Verificar que un archivo del bucket abra con una URL como:

```text
https://media.pictoris.co/assets/Portafolio/SailorPunk/Ojo.gif
```

El archivo `r2-assets-manifest.txt` lista cada archivo movido y su URL final esperada.

## SEO

Ya se actualizaron:

- `public/robots.txt`
- `public/sitemap.xml`

Ambos apuntan al dominio final `https://pictoris.co`.

## Vista local

Para revisar el sitio localmente:

```bash
npx serve public
```

Ten en cuenta que los medios pesados ya apuntan a `media.pictoris.co`, asi que se veran cuando esos archivos esten subidos y publicados en R2.
