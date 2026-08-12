# Plataforma de Estudos — Turma FIAP

Ambiente interno da turma para estudar **Computational Thinking with Python**:
as aulas da professora organizadas por assunto, anotações, materiais e chat ao vivo.

Em produção: **https://fiap.pervian.tech**

## O que tem

- **Aulas** — os notebooks do [repositório da disciplina](https://github.com/mariacmartins/computational_thinking_with_python)
  convertidos em páginas legíveis: markdown formatado, código com realce e botão de copiar, e a saída
  original de cada célula (inclusive gráficos e tabelas do pandas).
- **Sincronização automática** — um serviço acompanha o repositório da professora a cada 30 min.
  Aula nova aparece sozinha; se ainda não estiver no currículo curado, entra no módulo *Aulas Novas*.
- **Progresso** — marque a aula como concluída; barra por módulo, por pessoa e no painel.
- **Anotações** — por aula ou avulsas, privadas (só você) ou públicas (toda a turma).
- **Materiais** — upload até 25 MB, público ou privado, opcionalmente ligado a uma aula.
  Arquivo privado só sai pela URL para o dono.
- **Chat em tempo real** — canais `geral`, `dúvidas`, `materiais` e `provas`.
- **Busca** — no conteúdo das aulas, nas anotações visíveis e nos materiais.
- **Turma** — quem está estudando, progresso e contribuições.
- Tema claro/escuro, responsivo do celular ao desktop.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4 · Auth.js v5 · PostgreSQL 17 · Docker

Sem Redis e sem servidor de WebSocket: o chat usa `LISTEN/NOTIFY` do Postgres entregue por SSE.
Sem ORM: são cinco tabelas, o SQL fica em `db/schema.sql` e roda sozinho a cada subida (é idempotente).

## Acesso

1. `https://fiap.pervian.tech/cadastro`
2. E-mail institucional (`@fiap.com.br` ou `@alunos.fiap.com.br`) + senha + **código da turma**
3. O código fica em `CODIGO_TURMA` no `.env` da VPS

Quem cria a primeira conta vira `admin` (pode apagar anotação e material de qualquer pessoa).

## Desenvolvimento

```bash
cp .env.example .env          # ajuste AUTH_SECRET, POSTGRES_PASSWORD, CODIGO_TURMA
git clone https://github.com/mariacmartins/computational_thinking_with_python repo
npm install
npm test                      # converte os notebooks e valida o resultado
docker compose up -d          # sobe postgres + app + sync em http://localhost:8082
```

Teste ponta a ponta num navegador real (cria conta descartável e tira screenshots):

```bash
npm i --no-save playwright && npx playwright install chromium
node scripts/e2e.mjs http://localhost:8082 <codigo-da-turma>
```

## Deploy

```bash
./deploy.sh "o que mudou"
```

Faz commit, empurra pro GitHub e reconstrói na VPS (`/opt/fiap-hub`), esperando o healthcheck.

Na VPS: nginx faz TLS (Let's Encrypt, renovação automática) e proxy para `127.0.0.1:8082`;
`/api/chat/` vai com buffer desligado, senão o tempo real morre no proxy.

## Estrutura

```
scripts/build-content.mjs   notebooks -> content/python.json (currículo e ordem das aulas ficam aqui)
db/schema.sql               as cinco tabelas
src/lib/                    banco, auth, conteúdo, chat e server actions
src/app/(app)/              telas autenticadas
src/app/(auth)/             entrar e cadastro
docker/sync.sh              acompanha o repositório da professora
```

**Para reordenar/renomear aulas ou criar módulos**, edite `CURRICULO` em `scripts/build-content.mjs`.

## Nova disciplina

Hoje só Python está mapeado. Para adicionar outra: um novo `CURRICULO` apontando para o repositório
dela e um segundo arquivo em `content/`. As telas já leem por disciplina — só a navegação precisaria
de um seletor.
