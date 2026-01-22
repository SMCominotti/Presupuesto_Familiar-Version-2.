import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

4. Commit: `Configurar Vite`
5. Click **"Commit new file"**

---

#### **📄 ARCHIVO 7: .gitignore**

1. Click en **"Add file"** → **"Create new file"**
2. Nombre: `.gitignore` (sí, empieza con punto)
3. Pega este contenido:
```
node_modules
dist
dist-ssr
*.local
.vscode
.idea
.DS_Store
*.log
