# Política de Segurança — PortfolioHUB

A segurança deste repositório é tratada com prioridade. Este documento descreve
as práticas adotadas e o canal para reporte de vulnerabilidades.

## Práticas de segurança implementadas

- **Autenticação em dois fatores (2FA):** habilitada na conta proprietária do
  repositório, exigindo um segundo fator além da senha.
- **Proteção da branch `main`:** alterações só entram via Pull Request, impedindo
  commits diretos na branch de produção.
- **Secret scanning + push protection:** varredura automática que bloqueia o envio
  acidental de segredos (chaves de API, tokens, senhas) ao repositório.
- **Dependabot alerts:** monitoramento de vulnerabilidades em dependências.
- **Princípio do menor privilégio:** colaboradores recebem apenas o nível de
  permissão estritamente necessário (read, triage, write, maintain ou admin).

## Como reportar uma vulnerabilidade

Caso identifique uma falha de segurança, **não abra uma issue pública**.
Envie os detalhes para: **viniciuseloicorrea9@gmail.com**

Inclua, se possível:
- Descrição da vulnerabilidade
- Passos para reproduzir
- Impacto potencial

O reporte será analisado e respondido com a maior brevidade possível.
