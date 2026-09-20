# SchoolManager

Sistema de gestão escolar desenvolvido como Trabalho de Conclusão de Curso. O projeto reúne cinco perfis conectados — administrador, diretor, coordenador, professor e aluno — com gestão acadêmica, comunicação, materiais, avaliações, frequência e boletins.

## Destaques

- Cinco áreas de acesso com permissões por função.
- Turmas, disciplinas, usuários, materiais, atividades, provas, notas e frequência.
- Chat interno e calendário acadêmico.
- Boletim em PDF por aluno ou por turma, com filtros anual e bimestral.
- Assistente pedagógico executado localmente com WebGPU.
- Recuperação de senha demonstrativa por código temporário.
- Aplicação web responsiva e projeto Android via Capacitor.

## Acessos de demonstração

Todos utilizam a senha `123` no ambiente demonstrativo:

| Perfil | E-mail |
| --- | --- |
| Administrador | `admin@escola.com` |
| Diretor | `diretor@escola.com` |
| Coordenador | `coordenador@escola.com` |
| Professor | `professor@escola.com` |
| Aluno | `aluno@escola.com` |

> As credenciais acima são exclusivamente demonstrativas. Em produção, use senhas fortes e configure contatos de recuperação reais.

## Como executar

Requisitos: Node.js 20 ou superior e npm.

```bash
npm install
copy .env.example .env
npm run dev
```

Acesse `http://localhost:3001`.

Para gerar a versão de produção:

```bash
npm run build
npm start
```

## Assistente pedagógico local

O modelo é executado pelo WebLLM diretamente no navegador. Não existe chave de API no repositório e as mensagens não são enviadas a um serviço de IA. No primeiro uso, o visitante precisa baixar aproximadamente 4 GB e utilizar um navegador recente com WebGPU, preferencialmente Chrome ou Edge.

## Variáveis de ambiente

Copie `.env.example` para `.env`. Nunca publique o arquivo `.env`.

- `SESSION_SECRET`: segredo das sessões.
O portfólio usa um fluxo demonstrativo: o visitante informa o e-mail escolar e o código temporário aparece na própria tela. Nenhum serviço pago ou chave externa é necessário.

## Tecnologias

React, TypeScript, Vite, Tailwind CSS, Express, Drizzle ORM, SQLite/libSQL, Socket.IO, jsPDF, WebLLM e Capacitor.

## Observações de implantação

GitHub Pages hospeda apenas conteúdo estático e não executa o backend Express nem o banco SQLite. O arquivo `render.yaml` deixa o projeto pronto para uma demonstração em um serviço compatível com Render Blueprint. Em hospedagens com disco efêmero, alterações feitas pelos visitantes podem ser reiniciadas quando o serviço for reconstruído, o que é adequado para esta demonstração.

## Segurança

- Arquivos `.env`, bancos locais, uploads e logs estão ignorados pelo Git.
- O sistema não aceita tokens fictícios como autenticação.
- Códigos de recuperação expiram, têm limite de tentativas e não são armazenados em texto puro.
- Não informe dados pessoais de estudantes ao assistente local.

## Licença

MIT.
