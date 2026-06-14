# Guia de Contribuição — PortfolioHUB

Obrigado por contribuir! Este guia define o fluxo de trabalho e as boas práticas
de colaboração adotadas no projeto.

## Fluxo de trabalho (Git Flow simplificado)

1. **Fork / clone** do repositório.
2. Crie uma **branch** descritiva a partir da `main`:
   ```
   git checkout -b feature/nome-da-feature
   ```
3. Faça commits pequenos e com mensagens claras (padrão Conventional Commits):
   ```
   git commit -m "feat: adiciona seção de contato"
   git commit -m "fix: corrige link quebrado no card"
   ```
4. Envie a branch e abra um **Pull Request** para a `main`.
5. Aguarde a **revisão de código (code review)** antes do merge.

## Padrão de mensagens de commit

| Prefixo | Uso |
|---------|-----|
| `feat`  | Nova funcionalidade |
| `fix`   | Correção de bug |
| `docs`  | Alteração de documentação |
| `style` | Formatação, sem mudança de lógica |
| `refactor` | Refatoração de código |

## Regras

- Não faça commits diretamente na `main` (a branch é protegida).
- Nunca envie segredos (chaves, tokens, senhas) ao repositório.
- Todo PR deve passar por revisão antes de ser integrado.

## Controle de acesso

O acesso de colaboradores é gerenciado em **Settings → Collaborators**, seguindo
o princípio do menor privilégio.
