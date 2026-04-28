# Meu Hotel Online

Plataforma de gestão hoteleira moderna e eficiente.

## Tecnologias Utilizadas

- **Frontend**: React 19, Vite, Tailwind CSS, Motion.
- **Backend**: Node.js, Express.
- **Banco de Dados**: Firebase (Firestore & Auth).
- **Pagamentos**: Stripe.

## Requisitos

- Node.js 18 ou superior.
- Uma conta no Firebase.
- Uma conta no Stripe.

## Configuração

1. Clone o repositório.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure as variáveis de ambiente:
   - Copie o arquivo `.env.example` para `.env`.
   - Preencha as chaves do Stripe.
4. Configure o Firebase:
   - Crie um projeto no console do Firebase.
   - Ative o Firestore e o Authentication (Google Login).
   - Obtenha as credenciais do seu app e atualize o arquivo `firebase-applet-config.json`.
   - Aplique as regras de segurança contidas no arquivo `firestore.rules`.

## Execução

### Modo de Desenvolvimento

```bash
npm run dev
```

O servidor iniciará na porta 3000.

### Produção

```bash
npm run build
npm start
```

## Licença

Este projeto é privado.
