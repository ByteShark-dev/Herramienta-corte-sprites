# Sprite Sheet Cutter

Herramienta local para recortar sprite sheets, ver overlays de corte y exportar sprites individuales como PNG, ZIP y JSON.

## Abrir la app

### En navegador

```powershell
npm install
npm run dev
```

Luego abre la URL que te muestre Vite, normalmente `http://localhost:5173`.

### Como app de escritorio

```powershell
npm install
npm run desktop
```

Ese comando compila la parte web y luego abre la ventana de escritorio con Electron.

## Generar el `.exe`

```powershell
npm install
npm run dist:win
```

El ejecutable queda en:

```text
release/SpriteSheetCutter-0.1.0-win-x64.exe
```

Es un ejecutable portable, así que puedes abrirlo directamente sin servidor ni backend.

## Scripts útiles

```powershell
npm run dev
npm run build
npm run desktop
npm run dist:win
npm run test
npm run lint
```
