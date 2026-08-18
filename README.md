# 📦 Tela de Estoque Interativa (Frontend IntegraSI)

Interface gráfica desenvolvida em **React**, **TypeScript**, **Tailwind CSS** e **Vite** para testar visualmente a API REST de Gestão de Estoque construída na oficina.

---

## 🚀 Como Executar

1. **Instalar as dependências**:
   ```bash
   npm install
   ```

2. **Iniciar o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

3. Acesse a aplicação no seu navegador (geralmente em `http://localhost:5173`).

---

## 📡 Integração com a API Backend

Por padrão, a interface se conecta automaticamente ao endpoint:
`http://localhost:3000/products`

### Badge de Status da API (No Topo da Tela):
- 🟢 **API Online (http://localhost:3000)**: A interface está conectada à sua API Node.js/Express. Todas as operações de **Criar**, **Listar**, **Editar** e **Excluir** serão enviadas ao seu backend.
- 🔴 **API Offline (Modo Local)**: Se a sua API ainda não estiver rodando, a interface funciona em modo de simulação com dados locais para você visualizar o design.

### Botão de Teste de Conexão:
No cabeçalho, clique no ícone de recarregar (🔄) para testar a conexão com o backend a qualquer momento após iniciar o servidor Express.

---

## ⚙️ Variáveis de Ambiente (Opcional)

Caso sua API esteja rodando em outra porta ou endereço, você pode criar um arquivo `.env` baseado no `.env.example`:

```env
VITE_API_URL=http://localhost:3000
```