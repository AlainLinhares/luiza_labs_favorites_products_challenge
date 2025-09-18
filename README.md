# Luizalabs — Favorites Products Challenge

API REST para gerenciar clientes e suas listas de produtos favoritos.  
Implementado em **NestJS + TypeScript** com **Prisma (Postgres)**, proteção via **JWT**, testes unitários e de integração, suporte a mocks e consulta à API de produtos.

---

## Índice
- [Requisitos cobertos](#requisitos-cobertos)
- [Pré-requisitos locais](#pré-requisitos-locais)
- [Rodando localmente (modo dev)](#rodando-localmente-modo-dev)
- [Rodando com Docker Compose](#rodando-com-docker-compose)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Base de dados (sem seed automático)](#base-de-dados-sem-seed-automático)
- [Geração de token JWT para testes](#geração-de-token-jwt-para-testes)
- [Endpoints principais](#endpoints-principais)
- [Arquivos de mock](#arquivos-de-mock)
- [Testes](#testes)
- [Estrutura do projeto](#estrutura-do-projeto)

---

## Requisitos cobertos
Este repositório implementa:
- CRUD de **Clientes** (nome e email, considerando email único).
- **Lista de favoritos por cliente**, sem duplicidade do mesmo produto.
- Validação de existência do produto antes de adicionar aos favoritos (consulta à API externa com fallback para mocks).
- Autenticação/Autorização por **JWT**
- Testes unitários e de integração.
- Configuração para Docker + docker-compose.

---

## Pré-requisitos locais
- Node.js
- npm
- Docker (se pretende rodar via container)
- PostgreSQL se rodar sem Docker (ou usar um container com Postgres)
- `npx prisma` para executar migrations/generate (se necessário)

---

## Rodando localmente (modo dev)
1. Instale dependências:
```bash
npm install
```

2. Copie variáveis de ambiente:
```bash
cp .env.example .env
# Edite .env conforme necessário (DATABASE_URL etc)
```

3. Gere client Prisma (se não houver `node_modules/.prisma`):
```bash
npm run prisma:generate
```

4. (Opcional) Rode migrações:
```bash
npm run prisma:migrate
```

5. Inicie em modo dev:
```bash
npm run start:dev
```
A API irá subir em `http://localhost:3000` por padrão (ver `PORT` em `.env`).

---

## Rodando com Docker Compose
Existem três arquivos no repositório:
- `docker-compose-dev.yml` — definição base contém apenas configuração do banco de dados, se o foco for executar no terminal 
```bash
npm run start:dev
```
- `docker-compose.yml` — versão geral com a definição da base de dados e execução do serviço no docker

**Para rodar (modo combinado base + dev):**
```bash
docker compose -f docker-compose-base.yml -f docker-compose-dev.yml up -d
```

Se preferir usar apenas `docker-compose-dev.yml` (no caso de querer subir apenas a instância do Postgres e rodar localmente via npm run):
```bash
docker compose -f docker-compose-dev.yml up
```

---

## Variáveis de ambiente
Exemplos disponíveis em:
- `.env.example`
- `.env.docker` (usado em containers)

Principais variáveis:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/luizalabs?schema=public"
PORT=3000
PRODUCTS_API_ENDPOINT=http://challenge-api.luizalabs.com/api/product
JWT_SECRET=key_challenge_luiza_labs_favorites_products
```

Se usar Docker Compose, o `DATABASE_URL` padrão em `.env.docker` aponta para `db:5432`.

---

## Base de dados (sem seed automático)

Este projeto **não inclui um script de seed** para popular a base de dados automaticamente.  
Por isso, é necessário criar os registros iniciais manualmente via API antes de utilizar os demais endpoints.

### Passos obrigatórios:
1. **Criar um cliente** via endpoint:
   ```
   POST http://{{url}}/clients
   ```
   Exemplo de payload:
   ```json
   {
     "name": "Usuário Teste",
     "email": "teste@exemplo.com"
   }
   ```

2. O endpoint retornará o objeto do cliente criado, incluindo seu **`id`**.

3. **Atualizar a collection do Postman**:
   - Defina o valor do `id` retornado no campo `clientId` da variável de ambiente da collection.
   - Assim, os demais endpoints (`/clients/:clientId/favorites`) poderão ser executados corretamente.

4. **Atualizar mocks (quando necessário)**:
   - Em cenários onde a API de Produtos estiver indisponível, o fallback de favoritos usará o arquivo `src/mocks/mock-favorites.json`.
   - Para manter a consistência, edite esse arquivo e substitua o valor de `clientId` pelo **id do usuário criado** no passo 1.

Exemplo (`src/mocks/mock-favorites.json`):
```json
[
  {
    "clientId": "cmfoi3yg60001bslix5ujc8w1",
    "productId": "1",
    "createdAt": "2024-01-01T12:00:00Z"
  },
]
```

---

## Geração de token JWT para testes
A API valida um token JWT via `Authorization: Bearer <token>` usando o `JWT_SECRET` configurado. O projeto não expõe um endpoint `/login` para emitir tokens — se você precisa de um token rápido para testes, gere com a mesma `JWT_SECRET`.

**Token de exemplo (válido somente se `JWT_SECRET=key_challenge_luiza_labs_favorites_products`):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJ1c2VybmFtZSI6ImFsYWluIn0.uX9OzTPpIBlhCVWoSLu4FMpr6OWpc88fEcWHiR-YRgk
```

---

## Endpoints principais
(autenticados — adicione header `Authorization: Bearer <token>`)

### Clientes
- `POST /clients` — cria cliente `{ name, email }`
- `GET /clients/:id` — recupera cliente
- `PUT /clients/:id` — atualiza cliente
- `DELETE /clients/:id` — remove cliente

### Favoritos
- `POST /clients/:clientId/favorites` — adiciona `{ productId }` (valida existência do produto)
- `GET /clients/:clientId/favorites` — lista favoritos
- `DELETE /clients/:clientId/favorites/:favoriteId` — remove favorito

---

## Arquivos de mock
- `src/mocks/mock-products.json` — produtos mock (usado pelo `ProductsService` quando a API externa falha).
- `src/mocks/mock-favorites.json` — favoritos mock (fallback para lista de favoritos).

---

## Testes
- Unitários: `npm run test:unit` (ou `npm test` que roda unit + e2e)
- Integração / e2e: `npm run test:e2e`

Rode cobertura:
```bash
npm run test:cov
```

---

## Estrutura do projeto
- `src/modules/clients` — controllers, services, DTOs (CRUD clientes)
- `src/modules/favorites` — controllers, services, DTOs (gerenciamento de favoritos)
- `src/modules/products` — serviço para consultar API de produtos + fallback/mocks + cache
- `src/prisma` — schema Prisma e client
- `src/auth` — JwtStrategy + guard
- `src/mocks` — mock-products.json / mock-favorites.json
- `test/` — unit + integration
- `collection/` — com a collection dos enpoints e também a collection para os environments que devem ser preenchidos. Para o caso dos environments usar como referência os valores deste [link](https://www.postman.com/martian-desert-931750/magalu-challenge/environment/8694952-aecd19ac-2079-4804-a97a-d2e6c7655f59)


# Documentação da API Rest

A documentação completa da API pode ser acessada no Postman pelo link abaixo:

[Documentação da API Rest — Postman](https://www.postman.com/martian-desert-931750/workspace/magalu-challenge/collection/8694952-907e3202-ce3b-44ce-bfff-27e88aefe1b2?action=share&creator=8694952&active-environment=8694952-aecd19ac-2079-4804-a97a-d2e6c7655f59)

---
