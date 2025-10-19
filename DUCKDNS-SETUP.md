# 🦆 Configuração DuckDNS - Caderninho Digital

## 📋 **Passo a Passo Completo**

### **1. Criar Subdomínio no DuckDNS**

1. **Acesse**: https://duckdns.org
2. **Faça login** com Google, GitHub, Twitter ou Reddit
3. **Crie um subdomínio**:
   - Sugestões: `caderninhodigital`, `gestaodigital`, `meugestao`
   - Resultado: `caderninhodigital.duckdns.org`
4. **Configure o IP**: `151.101.1.195` (IP do Firebase Hosting)
5. **Clique em "update ip"**

### **2. Configurar no Firebase Console**

1. **Acesse**: https://console.firebase.google.com/project/web-gestao-37a85/hosting
2. **Clique em "Adicionar domínio personalizado"**
3. **Digite**: `seusubdominio.duckdns.org`
4. **Siga as instruções de verificação**
5. **Aguarde o SSL ser configurado** (pode levar até 24h)

### **3. Comandos Firebase (Opcional)**

```bash
# Listar sites atuais
firebase hosting:sites:list

# Adicionar novo site (se necessário)
firebase hosting:sites:create caderninhodigital-duckdns

# Deploy para o novo domínio
firebase deploy --only hosting
```

## 🎯 **Sugestões de Nomes**

Escolha um nome disponível:
- `caderninhodigital.duckdns.org`
- `gestaodigital.duckdns.org`
- `meugestao.duckdns.org`
- `sistemagestao.duckdns.org`
- `caderninhoweb.duckdns.org`

## ⚡ **Configuração Rápida (5 minutos)**

### **IPs do Firebase Hosting:**
```
Primário: 151.101.1.195
Secundário: 151.101.65.195
```

### **Verificação:**
```bash
# Testar DNS
nslookup seudominio.duckdns.org

# Deve retornar: 151.101.1.195
```

## 🔧 **Após Configuração**

1. **Aguarde propagação** (5-30 minutos)
2. **Teste o domínio** no navegador
3. **Certificado SSL** será gerado automaticamente
4. **PWA funcionará** perfeitamente

## 📱 **Resultado Final**

Sua aplicação estará disponível em:
- ✅ `https://seudominio.duckdns.org`
- ✅ Certificado SSL válido
- ✅ PWA instalável
- ✅ Gratuito para sempre

## 🚨 **Importante**

- **Não perca o token** do DuckDNS (salve em local seguro)
- **Mantenha o IP atualizado** se o Firebase mudar
- **Teste regularmente** para garantir funcionamento

---

**Próximo passo**: Acesse https://duckdns.org e crie seu subdomínio!