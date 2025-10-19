# Ícones do Caderninho Digital

## ✅ Implementado

- ✅ Ícone SVG personalizado (`/public/icon.svg`)
- ✅ Manifest PWA (`/public/manifest.json`)
- ✅ Meta tags para PWA no `index.html`
- ✅ Tema personalizado (#007bff)

## 📱 Como Testar

1. **No Desktop**: Acesse https://web-gestao-37a85.web.app
   - O ícone deve aparecer na aba do navegador
   - Você pode "Instalar" a aplicação via Chrome

2. **No Mobile**: Acesse a URL no navegador móvel
   - Adicione à tela inicial
   - O ícone personalizado deve aparecer

## 🎨 Geração de Ícones PNG (Opcional)

Se precisar de ícones PNG para melhor compatibilidade:

1. Abra o arquivo `generate-icons.html` no navegador
2. Clique nos botões para baixar os ícones PNG
3. Salve como `icon-192.png` e `icon-512.png` na pasta `public/`
4. Atualize o `manifest.json` para usar os PNGs

## 🔧 Personalização

Para alterar o ícone:

1. Edite o arquivo `/public/icon.svg`
2. Modifique as cores no `manifest.json` se necessário
3. Execute `npm run build && firebase deploy --only hosting`

## 📋 Recursos PWA Incluídos

- **Nome**: Caderninho Digital - Sistema de Gestão
- **Tema**: Azul (#007bff) e Verde (#28a745)
- **Atalhos**: Nova Venda, Clientes, Financeiro
- **Modo**: Standalone (funciona como app nativo)
- **Orientação**: Portrait (ideal para mobile)

## 🚀 URL da Aplicação

**Produção**: https://web-gestao-37a85.web.app

Agora sua aplicação tem um ícone personalizado e pode ser instalada como PWA! 📱✨