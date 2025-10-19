# 🌐 Configuração de Domínio Personalizado Gratuito

## Opções Gratuitas Disponíveis

### 1. **Freenom (Recomendado) - GRATUITO**
- Domínios: `.tk`, `.ml`, `.ga`, `.cf`
- Gratuito por 12 meses
- Renovação gratuita disponível

**Passos:**
1. Acesse: https://freenom.com
2. Pesquise um nome disponível (ex: `caderninhodigital.tk`)
3. Registre gratuitamente
4. Configure DNS para apontar para Firebase

### 2. **No-IP - Subdomínio Gratuito**
- Formato: `seuapp.ddns.net`
- Gratuito permanente
- Confirmação mensal necessária

### 3. **DuckDNS - Subdomínio Gratuito**
- Formato: `seuapp.duckdns.org`
- Gratuito permanente
- Muito simples de configurar

## 🚀 Configuração no Firebase (Após obter domínio)

### Passo 1: Adicionar Domínio Personalizado
```bash
firebase hosting:channel:deploy live --only hosting
```

### Passo 2: Configurar DNS
No seu provedor de domínio, adicione:

**Tipo A:**
```
@ -> 151.101.1.195
@ -> 151.101.65.195
```

**Tipo CNAME:**
```
www -> web-gestao-37a85.web.app
```

### Passo 3: Verificar no Firebase Console
1. Acesse: https://console.firebase.google.com/project/web-gestao-37a85/hosting
2. Clique em "Adicionar domínio personalizado"
3. Digite seu domínio
4. Siga as instruções de verificação

## 📋 Exemplo Prático com Freenom

### 1. Registrar Domínio
- Vá para freenom.com
- Pesquise: `caderninhodigital.tk`
- Registre gratuitamente

### 2. Configurar DNS
No painel do Freenom:
```
Type: A
Name: @
Target: 151.101.1.195

Type: A  
Name: @
Target: 151.101.65.195

Type: CNAME
Name: www
Target: web-gestao-37a85.web.app
```

### 3. Aguardar Propagação
- DNS pode levar até 48h para propagar
- Teste com: `nslookup seudominio.tk`

## ⚡ Configuração Rápida (5 minutos)

Se quiser algo imediato, use **DuckDNS**:

1. Acesse: https://duckdns.org
2. Faça login com Google/GitHub
3. Crie: `caderninhodigital.duckdns.org`
4. Configure IP: `151.101.1.195`
5. No Firebase, adicione o domínio

## 🔧 Comandos Firebase

```bash
# Listar domínios atuais
firebase hosting:sites:list

# Adicionar domínio personalizado
firebase hosting:sites:create seudominio

# Deploy para domínio específico
firebase deploy --only hosting:seudominio
```

## 📱 Resultado Final

Após configuração, sua aplicação estará disponível em:
- `https://seudominio.tk` (ou outro TLD escolhido)
- `https://www.seudominio.tk`
- Certificado SSL automático
- PWA funcionando perfeitamente

## 💡 Dicas Importantes

1. **Backup**: Mantenha sempre o domínio Firebase como backup
2. **Renovação**: Domínios Freenom precisam ser renovados anualmente
3. **DNS**: Use Cloudflare como DNS para melhor performance
4. **Monitoramento**: Configure alertas para expiração do domínio

Quer que eu configure alguma dessas opções agora?