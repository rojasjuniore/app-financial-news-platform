# 🗑️ Archivos a Eliminar - App Financial News

## Archivos Backup/Temporales
- [x] `.DS_Store` (todos)
- [x] `src/pages/VoiceAgent.tsx.backup`
- [x] `node_modules/.cache/default-development/index.pack.old`

## Componentes NO Utilizados
- [x] `src/components/TestFirebaseConnection.tsx` (comentado, no se usa)
- [x] `src/components/Examples/` (carpeta completa con DesignSystemShowcase)
- [x] `src/components/Dashboard/` (se usa pages/Dashboard, no el componente)

## Páginas Duplicadas o No Usadas
- [x] `src/pages/FeedDebug.tsx` (no está en rutas)
- [x] `src/pages/StableVoiceAssistant.tsx` (no está en rutas)
- [x] `src/pages/VoiceAssistantContinuous.tsx` (no está en rutas)
- [x] `src/pages/VoiceAgent.tsx.backup` (backup innecesario)
- [ ] `src/pages/ConversationalVoice.tsx` (SE USA en rutas - MANTENER)
- [ ] `src/pages/FuturisticVoice.tsx` (SE USA en rutas - MANTENER)
- [ ] `src/pages/VoiceAssistant.tsx` (verificar si se usa)

## Páginas Duplicadas de Artículo
- [ ] Mantener solo uno: `ArticleDetail.tsx` o `ArticleDetailClean.tsx`
  - ArticleDetailClean se usa en App.tsx
  - ArticleDetail parece ser la versión antigua

## Archivos a Verificar
- `src/components/LazyComponents.tsx` (verificar uso)
- `src/components/MarketOverview/` (verificar uso)
- `src/components/A11y/` (verificar si se necesita accesibilidad)

## Total estimado: ~10-15 archivos/carpetas a eliminar