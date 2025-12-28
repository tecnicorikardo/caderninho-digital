# Guia: Converter para App Mobile com Expo

## 1. Criar Projeto Expo

```bash
npx create-expo-app CaderninhoMobile --template typescript
cd CaderninhoMobile
```

## 2. Instalar Dependências Essenciais

```bash
# Firebase
npm install firebase

# Navegação
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context

# UI Components
npm install react-native-paper react-native-vector-icons
npx expo install react-native-svg

# Async Storage
npx expo install @react-native-async-storage/async-storage
```

## 3. Estrutura de Pastas (Similar ao atual)

```
src/
├── components/
├── contexts/
├── hooks/
├── screens/        # equivale às pages
├── navigation/     # equivale às routes
├── services/
├── types/
└── utils/
```

## 4. Migrar Contextos (Exemplo AuthContext)

```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../config/firebase';
import { User } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mesmo código do contexto atual, mas usando AsyncStorage
```

## 5. Configurar Firebase

```typescript
// src/config/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Mesma configuração atual
```

## 6. Exemplo de Tela (Dashboard)

```typescript
import React from 'react';
import { View, ScrollView } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';

export function DashboardScreen() {
  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Card style={{ marginBottom: 16 }}>
        <Card.Content>
          <Title>Vendas do Dia</Title>
          <Paragraph>R$ 1.250,00</Paragraph>
        </Card.Content>
      </Card>
      {/* Outros cards... */}
    </ScrollView>
  );
}
```

## 7. Build para Produção

```bash
# Android
eas build --platform android

# iOS (precisa de conta Apple Developer)
eas build --platform ios
```

## Vantagens:
- ✅ Performance nativa
- ✅ Melhor UX mobile
- ✅ Acesso completo a APIs nativas
- ✅ Menor tamanho do app

## Desvantagens:
- ❌ Precisa reescrever componentes
- ❌ Mais tempo de desenvolvimento