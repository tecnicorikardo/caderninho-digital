# 🚨 RECUPERAR PRODUTOS DO ESTOQUE - AÇÃO IMEDIATA

## 📋 **Passo a Passo para Recuperar AGORA**

### **Passo 1: Verificar se os Dados Ainda Existem**

1. **Abra o sistema no navegador**
2. **Pressione F12** (ou Ctrl+Shift+I)
3. **Vá na aba "Console"**
4. **Cole este código e pressione Enter:**

```javascript
// Verificar produtos
const userId = localStorage.getItem('firebase:authUser:AIzaSyBxLqVxKxVxKxVxKxVxKxVxKxVxKxVxKxV:[DEFAULT]');
if (userId) {
  const user = JSON.parse(userId);
  const uid = user.uid;
  
  console.log('👤 User ID:', uid);
  
  // Ver produtos
  const productsKey = `products_${uid}`;
  const products = localStorage.getItem(productsKey);
  
  if (products) {
    const parsed = JSON.parse(products);
    console.log('✅ PRODUTOS ENCONTRADOS:', parsed.length);
    console.table(parsed);
    
    // Mostrar detalhes
    parsed.forEach((p, i) => {
      console.log(`${i+1}. ${p.name} - Qtd: ${p.quantity} - R$ ${p.salePrice}`);
    });
  } else {
    console.log('❌ Nenhum produto encontrado neste navegador');
    
    // Verificar todas as chaves
    console.log('🔍 Chaves disponíveis:');
    Object.keys(localStorage).forEach(key => {
      if (key.includes('products')) {
        console.log('  -', key);
      }
    });
  }
}
```

---

### **Passo 2: Se Encontrou os Produtos - FAZER BACKUP IMEDIATAMENTE**

**Cole este código no console:**

```javascript
// BACKUP EMERGENCIAL
function backupEmergencial() {
  const userId = JSON.parse(localStorage.getItem('firebase:authUser:AIzaSyBxLqVxKxVxKxVxKxVxKxVxKxVxKxVxKxV:[DEFAULT]')).uid;
  
  const backup = {
    timestamp: new Date().toISOString(),
    userId: userId,
    products: localStorage.getItem(`products_${userId}`),
    movements: localStorage.getItem(`stock_movements_${userId}`),
    clients: localStorage.getItem(`clients_${userId}`),
    sales: localStorage.getItem(`sales_${userId}`),
    transactions: localStorage.getItem(`transactions_${userId}`)
  };
  
  // Baixar arquivo
  const dataStr = JSON.stringify(backup, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `BACKUP-EMERGENCIAL-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  console.log('✅ BACKUP BAIXADO! Guarde este arquivo em local seguro!');
  alert('✅ BACKUP BAIXADO! Guarde este arquivo em local seguro!');
}

// EXECUTAR BACKUP
backupEmergencial();
```

---

### **Passo 3: Se NÃO Encontrou - Verificar Outros Lugares**

#### **A) Verificar Outros Navegadores**

Os dados podem estar em outro navegador:
- ✅ Chrome
- ✅ Firefox  
- ✅ Edge
- ✅ Opera
- ✅ Brave

**Abra cada um e repita o Passo 1**

#### **B) Verificar Outros Dispositivos**

- ✅ Celular
- ✅ Tablet
- ✅ Outro computador

#### **C) Verificar Perfis do Navegador**

Se usa múltiplos perfis no Chrome:
1. Clique no ícone do perfil (canto superior direito)
2. Troque de perfil
3. Repita o Passo 1

---

### **Passo 4: Restaurar Backup (Se Tiver)**

Se você tem um arquivo de backup:

```javascript
// Cole no console
function restaurarBackup() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const backup = JSON.parse(event.target.result);
        
        // Restaurar dados
        if (backup.products) {
          localStorage.setItem(`products_${backup.userId}`, backup.products);
          console.log('✅ Produtos restaurados');
        }
        if (backup.movements) {
          localStorage.setItem(`stock_movements_${backup.userId}`, backup.movements);
          console.log('✅ Movimentações restauradas');
        }
        if (backup.clients) {
          localStorage.setItem(`clients_${backup.userId}`, backup.clients);
          console.log('✅ Clientes restaurados');
        }
        if (backup.transactions) {
          localStorage.setItem(`transactions_${backup.userId}`, backup.transactions);
          console.log('✅ Transações restauradas');
        }
        
        alert('✅ BACKUP RESTAURADO! Recarregue a página.');
        location.reload();
      } catch (error) {
        console.error('❌ Erro ao restaurar:', error);
        alert('❌ Erro ao restaurar backup');
      }
    };
    
    reader.readAsText(file);
  };
  
  input.click();
}

// EXECUTAR
restaurarBackup();
```

---

## 🔍 **Diagnóstico Avançado**

### **Ver TUDO que está no localStorage:**

```javascript
// Ver todos os dados salvos
console.log('📊 TODOS OS DADOS DO LOCALSTORAGE:');
console.log('Total de itens:', localStorage.length);

for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  const value = localStorage.getItem(key);
  
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      console.log(`${key}: ${parsed.length} itens`);
    } else {
      console.log(`${key}: objeto`);
    }
  } catch {
    console.log(`${key}: ${value.substring(0, 50)}...`);
  }
}
```

### **Procurar por "monitor" especificamente:**

```javascript
// Buscar produto específico
function buscarProduto(termo) {
  console.log(`🔍 Buscando por: "${termo}"`);
  
  Object.keys(localStorage).forEach(key => {
    if (key.includes('products')) {
      try {
        const products = JSON.parse(localStorage.getItem(key));
        const found = products.filter(p => 
          p.name.toLowerCase().includes(termo.toLowerCase()) ||
          p.description.toLowerCase().includes(termo.toLowerCase())
        );
        
        if (found.length > 0) {
          console.log(`✅ Encontrado em ${key}:`, found);
        }
      } catch (error) {
        // Ignorar erros
      }
    }
  });
}

// Buscar "monitor"
buscarProduto('monitor');
```

---

## 💾 **Criar Produtos de Teste (Temporário)**

Se não conseguir recuperar, crie produtos de teste:

```javascript
// Criar produtos de exemplo
function criarProdutosTeste() {
  const userId = JSON.parse(localStorage.getItem('firebase:authUser:AIzaSyBxLqVxKxVxKxVxKxVxKxVxKxVxKxVxKxV:[DEFAULT]')).uid;
  
  const produtosTeste = [
    {
      id: Date.now().toString(),
      name: 'Monitor 24"',
      description: 'Monitor LED 24 polegadas',
      sku: 'MON-24-001',
      costPrice: 500,
      salePrice: 800,
      quantity: 10,
      minQuantity: 2,
      category: 'Eletrônicos',
      supplier: 'Fornecedor Teste',
      userId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: (Date.now() + 1).toString(),
      name: 'Teclado Mecânico',
      description: 'Teclado mecânico RGB',
      sku: 'TEC-MEC-001',
      costPrice: 200,
      salePrice: 350,
      quantity: 15,
      minQuantity: 3,
      category: 'Periféricos',
      supplier: 'Fornecedor Teste',
      userId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  
  localStorage.setItem(`products_${userId}`, JSON.stringify(produtosTeste));
  console.log('✅ Produtos de teste criados!');
  alert('✅ Produtos de teste criados! Recarregue a página.');
  location.reload();
}

// EXECUTAR
criarProdutosTeste();
```

---

## 🎯 **Checklist de Ações**

- [ ] **Passo 1**: Verificar se produtos existem no localStorage
- [ ] **Passo 2**: Se existem, fazer BACKUP IMEDIATAMENTE
- [ ] **Passo 3**: Verificar outros navegadores/dispositivos
- [ ] **Passo 4**: Buscar especificamente por "monitor"
- [ ] **Passo 5**: Se não encontrar, criar produtos de teste
- [ ] **Passo 6**: Implementar salvamento no Firebase (URGENTE)

---

## ⚠️ **IMPORTANTE**

**Depois de recuperar os dados:**

1. ✅ Fazer backup imediatamente
2. ✅ Salvar backup em 3 lugares diferentes
3. ✅ Implementar salvamento no Firebase
4. ✅ Nunca mais confiar só no localStorage

---

## 📞 **Precisa de Ajuda?**

Se não conseguir recuperar:

1. **Envie print do console** mostrando o resultado do Passo 1
2. **Informe qual navegador** estava usando
3. **Informe se limpou cache** recentemente
4. **Informe se trocou de dispositivo**

**Vou te ajudar a recuperar!** 🚀
