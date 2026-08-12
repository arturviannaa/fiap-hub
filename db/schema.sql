-- Schema da plataforma. Idempotente: roda inteiro em toda subida do app.

CREATE TABLE IF NOT EXISTS usuarios (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  nome          TEXT NOT NULL,
  senha_hash    TEXT,                       -- nulo quando o login e via Microsoft
  provedor      TEXT NOT NULL DEFAULT 'senha',
  papel         TEXT NOT NULL DEFAULT 'aluno',  -- aluno | admin
  bio           TEXT NOT NULL DEFAULT '',
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  visto_em      TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS mensagens (
  id          SERIAL PRIMARY KEY,
  canal       TEXT NOT NULL,
  usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  corpo       TEXT NOT NULL,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mensagens_canal_idx ON mensagens (canal, id DESC);

-- Dispara o NOTIFY que alimenta o SSE do chat. Sem Redis, sem WebSocket server:
-- o proprio Postgres e o barramento de eventos.
CREATE OR REPLACE FUNCTION notifica_mensagem() RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('chat', NEW.id::text || ':' || NEW.canal);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS mensagens_notifica ON mensagens;
CREATE TRIGGER mensagens_notifica AFTER INSERT ON mensagens
  FOR EACH ROW EXECUTE FUNCTION notifica_mensagem();
