-- Schema da plataforma. Idempotente: roda inteiro em toda subida do app.

CREATE TABLE IF NOT EXISTS usuarios (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  nome          TEXT NOT NULL,
  senha_hash    TEXT,                       -- nulo quando o login e via Microsoft
  provedor      TEXT NOT NULL DEFAULT 'senha',
  papeis        TEXT[] NOT NULL DEFAULT '{aluno}',  -- pode ter várias: aluno, professor, admin
  bio           TEXT NOT NULL DEFAULT '',
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  visto_em      TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Foto de perfil: nome do arquivo no disco (UPLOAD_DIR), nulo = usa as iniciais.
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto TEXT;
-- Última vez que o usuário abriu a aba de notificações (pra contar não lidas).
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS notif_visto_em TIMESTAMPTZ NOT NULL DEFAULT now();

-- Migração do papel único (coluna antiga `papel`) para o array `papeis`. Todo
-- mundo mantém 'aluno' como base; quem era admin/professor ganha a tag extra.
-- Roda uma vez: depois `papel` não existe mais e o bloco é pulado.
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS papeis TEXT[] NOT NULL DEFAULT '{aluno}';
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'usuarios' AND column_name = 'papel') THEN
    UPDATE usuarios SET papeis =
      ARRAY(SELECT DISTINCT e FROM unnest(ARRAY['aluno', papel]) AS e WHERE e IS NOT NULL);
    ALTER TABLE usuarios DROP COLUMN papel;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS contadores (
  chave TEXT PRIMARY KEY,
  valor BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS push_tokens (
  token       TEXT PRIMARY KEY,
  usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS push_tokens_usuario_idx ON push_tokens (usuario_id);

CREATE TABLE IF NOT EXISTS progresso (
  usuario_id   INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  aula_slug    TEXT NOT NULL,
  concluido_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (usuario_id, aula_slug)
);

CREATE TABLE IF NOT EXISTS notas (
  id            SERIAL PRIMARY KEY,
  usuario_id    INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  aula_slug     TEXT,                       -- nulo = anotacao avulsa
  titulo        TEXT NOT NULL DEFAULT '',
  corpo         TEXT NOT NULL,
  publica       BOOLEAN NOT NULL DEFAULT false,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notas_aula_idx ON notas (aula_slug);
CREATE INDEX IF NOT EXISTS notas_usuario_idx ON notas (usuario_id);

CREATE TABLE IF NOT EXISTS arquivos (
  id           SERIAL PRIMARY KEY,
  usuario_id   INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  aula_slug    TEXT,
  nome         TEXT NOT NULL,              -- nome original, exibido
  armazenado   TEXT NOT NULL,              -- nome no disco, gerado
  mime         TEXT NOT NULL DEFAULT 'application/octet-stream',
  tamanho      BIGINT NOT NULL,
  descricao    TEXT NOT NULL DEFAULT '',
  publico      BOOLEAN NOT NULL DEFAULT true,
  downloads    INTEGER NOT NULL DEFAULT 0,
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS arquivos_aula_idx ON arquivos (aula_slug);

-- Grupos privados criados pelos proprios alunos. O chat do grupo usa o mesmo
-- mecanismo dos canais fixos: o canal se chama 'g:<id>'.
CREATE TABLE IF NOT EXISTS grupos (
  id         SERIAL PRIMARY KEY,
  nome       TEXT NOT NULL,
  descricao  TEXT NOT NULL DEFAULT '',
  criador_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grupo_membros (
  grupo_id   INTEGER NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  entrou_em  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (grupo_id, usuario_id)
);
CREATE INDEX IF NOT EXISTS grupo_membros_usuario_idx ON grupo_membros (usuario_id);

CREATE TABLE IF NOT EXISTS mensagens (
  id          SERIAL PRIMARY KEY,
  canal       TEXT NOT NULL,
  usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  corpo       TEXT NOT NULL,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mensagens_canal_idx ON mensagens (canal, id DESC);

-- Anexo da mensagem (print, PDF, .py). Reaproveita a tabela arquivos, entao
-- upload, quota e download passam pelo mesmo caminho ja testado.
ALTER TABLE mensagens ADD COLUMN IF NOT EXISTS arquivo_id INTEGER REFERENCES arquivos(id) ON DELETE SET NULL;


-- Dispara o NOTIFY que alimenta o SSE do chat. Sem Redis, sem WebSocket server:
-- o proprio Postgres e o barramento de eventos. Delecao vai pelo mesmo canal,
-- senao a mensagem apagada continuaria na tela de quem ja estava com o chat aberto.
CREATE OR REPLACE FUNCTION notifica_mensagem() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM pg_notify('chat', 'del:' || OLD.id::text || ':' || OLD.canal);
    RETURN OLD;
  END IF;
  PERFORM pg_notify('chat', 'nova:' || NEW.id::text || ':' || NEW.canal);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS mensagens_notifica ON mensagens;
CREATE TRIGGER mensagens_notifica AFTER INSERT OR DELETE ON mensagens
  FOR EACH ROW EXECUTE FUNCTION notifica_mensagem();
