# MaxLaunchpad — Lanzador de aplicaciones multiplataforma controlado por teclado

> Invoca un teclado virtual con una tecla de acceso rápido y pulsa una sola tecla para abrir la aplicación. Sin escribir, sin buscar y sin depender del orden de los resultados aproximados.

[English](../../README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [日本語](README.ja.md) · [Русский](README.ru.md) · **[Español](README.es.md) (esta página)** · [한국어](README.ko.md)

[![Última versión](https://img.shields.io/github/v/release/AwesomeDog/maxlaunchpad)](https://github.com/AwesomeDog/maxlaunchpad/releases)
[![Descargas](https://img.shields.io/github/downloads/AwesomeDog/maxlaunchpad/total)](https://github.com/AwesomeDog/maxlaunchpad/releases)
[![Plataformas](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)](https://github.com/AwesomeDog/maxlaunchpad/releases)
[![Licencia](https://img.shields.io/github/license/AwesomeDog/maxlaunchpad)](../../LICENSE)

<p align="center">
  <img src="../assets/screenshot.png" alt="Interfaz del lanzador de aplicaciones con teclado virtual MaxLaunchpad">
</p>

MaxLaunchpad es un lanzador de aplicaciones gratuito y de código abierto para Windows, macOS y Linux. Asigna tus aplicaciones a las teclas de un teclado virtual que se invoca desde cualquier aplicación con una tecla de acceso global; basta una pulsación más para iniciar el programa deseado.

## Resumen de funciones

- **Inicio determinista** — la misma tecla siempre abre la misma aplicación, sin depender del orden de búsqueda.
- **310 accesos directos** — 10 pestañas de 30 teclas, más las teclas `F1`–`F10` compartidas entre todas las pestañas.
- **Tecla de acceso global** — `Alt` + `` ` `` en Windows/Linux y `Option` + `` ` `` en macOS por omisión, totalmente configurable.
- **Inicio multiplataforma** — ejecutables, accesos directos, scripts, paquetes de aplicaciones, entradas `.desktop`, URL, además de argumentos y directorio de trabajo.
- **Configuración por arrastrar y soltar** — arrastra un programa desde el Explorador, el Finder o tu gestor de archivos hasta una tecla.
- **Varios perfiles** — gestiona tus escenarios con `keyboard.yaml`, `work.yaml`, `gaming.yaml` y otros archivos YAML.
- **Búsqueda y selección rápida** — busca aplicaciones instaladas en el cuadro de diálogo de edición y se rellenarán automáticamente el nombre, la ruta y la descripción.
- **Temas e interfaz** — temas claro, oscuro y del sistema, CSS personalizado, modo compacto, siempre visible y ocultado automático al perder el foco.
- **Bandeja del sistema** — minimizar a la bandeja, iniciar con el sistema y arrancar con la ventana oculta.
- **Gratuito y de código abierto** — basado en Electron, React y TypeScript: sin cuenta, sin nube y sin telemetría.

## Instalación

### Gestores de paquetes

```shell
# Windows
winget install AwesomeDog.MaxLaunchpad

# macOS
brew install --cask AwesomeDog/tap/maxlaunchpad
```

### Descarga directa

Descarga el instalador de tu sistema desde la [página de versiones](https://github.com/AwesomeDog/maxlaunchpad/releases).

| Plataforma | Requisito | Notas |
| --- | --- | --- |
| Windows | Windows 10 o posterior | Funciona nada más instalarlo. |
| macOS | macOS 11 Big Sur o posterior (Apple Silicon) | Ejecuta `xattr -cr /Applications/MaxLaunchpad.app` para eliminar la marca de cuarentena. |
| Linux | Ubuntu 24.04 o equivalente | En Wayland puede ser necesario configurar a mano la tecla de acceso global en los ajustes de teclado de GNOME. |

## Inicio rápido en 60 segundos

1. **Inicia MaxLaunchpad.** Aparece el teclado virtual y la aplicación también queda en la bandeja del sistema.
2. **Activa `View > Drag & Drop Mode`** para que la ventana permanezca visible mientras la configuras.
3. **Arrastra aplicaciones hasta las teclas** desde el Explorador / Finder / Archivos, o haz clic derecho en una tecla → **Edit** y usa **Quick Select** para buscar aplicaciones instaladas.
4. **Asigna un nombre a tus pestañas** (clic derecho en una tecla numérica `1`–`0` → Edit), por ejemplo `Dev`, `Work`, `Games`.
5. **Desactiva el modo arrastrar y soltar**, pulsa `Alt` + `` ` `` desde cualquier lugar y después la tecla que quieras. Listo.

Todos los datos del usuario se guardan por omisión en:

```text
~/.config/MaxLaunchpad/
├── settings.yaml     # Ajustes de la aplicación y tecla de acceso global
├── keyboard.yaml     # Perfil de teclado predeterminado
├── caches/           # Caché de iconos
├── logs/             # Registros de la aplicación
├── styles/           # Temas CSS personalizados
└── backups/          # Copias de seguridad automáticas
```

Si se define `XDG_CONFIG_HOME`, estas rutas se ajustan en consecuencia. Coloca esa carpeta en Git, Dropbox o Syncthing para sincronizar la configuración del lanzador entre varios equipos.

## Distribución del teclado y accesos directos

```text
F1 F2 F3 F4 F5 F6 F7 F8 F9 F10   Accesos compartidos entre todas las pestañas
1  2  3  4  5  6  7  8  9  0     Cambio de pestaña
Q  W  E  R  T  Y  U  I  O  P
A  S  D  F  G  H  J  K  L  ;     30 teclas de aplicación por pestaña
Z  X  C  V  B  N  M  ,  .  /
```

| Atajo | Acción |
| --- | --- |
| `Alt` + `` ` `` (`Option` + `` ` `` en macOS) | Mostrar u ocultar MaxLaunchpad |
| `F1`–`F10` | Iniciar un acceso directo global |
| `Q`–`P`, `A`–`;`, `Z`–`/` | Iniciar la aplicación de la pestaña activa |
| `1`–`0` | Ir a la pestaña correspondiente |
| `←` / `→` | Pestaña anterior o siguiente |
| `Ctrl+F` / `Cmd+F` | Buscar en todos los accesos directos |
| `Esc` | Cerrar el cuadro de diálogo u ocultar la ventana |
| Clic izquierdo en una tecla | Iniciar el programa |
| Clic derecho en una tecla | Menú contextual (Editar / Copiar / Cortar / Pegar / Eliminar / Abrir ubicación del archivo) |
| Soltar un archivo en una tecla | Configurar esa tecla |

## Ejemplo de configuración YAML

```yaml
tabs:
  - id: '1'
    label: 'Desarrollo'
  - id: '2'
    label: 'Trabajo'

keys:
  - tabId: '1'
    id: Q
    label: Terminal
    filePath: '/Applications/Terminal.app'

  - tabId: '1'
    id: C
    label: Chrome
    filePath: 'https://www.google.com'
```

Cada acceso directo admite también los campos `arguments`, `workingDirectory`, `runAsAdmin`, `description` y un icono personalizado. Ejemplo completo: [`docs/examples/full-featured.yaml`](../examples/full-featured.yaml).

## Preguntas frecuentes

**¿MaxLaunchpad es gratuito?**  Sí. El proyecto se publica bajo la licencia MIT: es gratuito y de código abierto.

**¿Es compatible con Windows 11 y Apple Silicon?**  Sí. Windows 11 entra dentro de «Windows 10+», y el instalador de macOS está dirigido a Apple Silicon.

**¿Funciona la tecla de acceso global en Linux / Wayland?**  Sí, aunque algunos entornos de escritorio requieren enlazar el atajo manualmente en la configuración de teclado del sistema.

**¿Puede iniciar aplicaciones de Microsoft Store, accesos directos `.lnk` y scripts?**  Sí. Windows: `.exe`, `.lnk`, `.bat`, `.cmd`, `.ps1`, UWP y `shell:`; macOS: `.app`, ejecutables Unix, `.sh`, `.command`; Linux: ELF, `.desktop`, `.sh`, `.py` y `.rb`.

**¿Dónde están los registros y las copias de seguridad?**  En `~/.config/MaxLaunchpad/logs/` y `~/.config/MaxLaunchpad/backups/`.

## Documentación y desarrollo

- [Manual en línea](https://awesomedog.github.io/maxlaunchpad/)
- [Preguntas frecuentes](../faq/index.md)
- [Guía del usuario](../guide/index.md)
- [Arquitectura técnica](../tech/technical-architecture.md)
- [Internacionalización](../tech/i18n.md)

El entorno de desarrollo requiere Node.js `>=22.20.0`:

```shell
npm install
npm start       # Iniciar en modo desarrollo
npm test        # Ejecutar las pruebas
npm run lint    # Ejecutar ESLint
npm run make    # Compilar el instalador
```

La estructura del proyecto, el proceso de contribución y todos los scripts están en la [guía de desarrollo](../../README.md#development-guide-for-contributors) del README en inglés. Los informes de errores y las pull requests son bienvenidos.

## Licencia y agradecimientos

MaxLaunchpad se publica bajo la licencia MIT. Es el sucesor espiritual del ya discontinuado [MaxLauncher](https://maxlauncher.sourceforge.io/) y lleva su flujo de trabajo de inicio por teclado desde Windows hasta macOS y Ubuntu/Linux.
