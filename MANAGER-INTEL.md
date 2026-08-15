# MANAGER-INTEL.md

## Stack & Tecnologia
**Linguagens:** TypeScript, Node.js (v18+)
**Frameworks/Bibliotecas:** Model Context Protocol (MCP) SDK, Cheerio (web scraping), Axios, Form-Data, Iconv-lite, Dotenv.
**Dependências Chave:** `@modelcontextprotocol/sdk`, `axios`, `cheerio`, `typescript`.

## O que o repo faz
Este repositório contém um servidor Model Context Protocol (MCP) que atua como uma ponte para o Sistema Eletrônico de Informações (SEI). Ele fornece uma interface para que agentes de IA interajam com o SEI, imitando o comportamento de extensões de navegador como o "SEI Pro" por meio de web scraping com Cheerio.

O servidor permite listar processos (nas caixas "Recebidos" e "Gerados"), ler árvores de documentos, buscar processos, listar/trocar unidades ativas e fazer download de documentos em formato Base64. A autenticação depende da extração e reutilização de cookies da sessão ativa de um navegador (como o `PHPSESSID`), uma vez que o SEI frequentemente utiliza sistemas de SSO complexos.

## Estado atual
- **Issues Abertas:** 1 issue aberta.
  - #1: Bump hono from 4.11.3 to 4.11.4 in the npm_and_yarn group across 1 directory
- **PRs Abertas:** 1 PR aberta.
  - #1: Bump hono from 4.11.3 to 4.11.4 in the npm_and_yarn group across 1 directory
- **Qualidade do CI:** Não há evidências de workflows de CI/CD automatizados (como GitHub Actions) no repositório.

## Histórico Jules
Não há PRs abertas ou histórico visível de branches criadas pelo Jules (prefixo "jules-") no momento, exceto o branch atual em execução (`jules-18167088702923418413-b9b21ba0`).

## Recomendações para o manager
1. **Adicionar Automação de CI/CD**
   - *Contexto:* O repositório não possui workflows de teste ou build automatizados no GitHub Actions.
   - *Por que é importante:* Garante a qualidade e integridade do código em contribuições futuras, validando o build (via `npm run build`) e verificações estáticas ou de formatação antes do merge.
2. **Atualizar Dependências Vulneráveis/Desatualizadas**
   - *Contexto:* Existe uma PR automatizada pelo Dependabot (Bump hono).
   - *Por que é importante:* Manter o código seguro e estável através da rápida aprovação de atualizações para fechar possíveis brechas de segurança ou melhorar a performance da biblioteca.
3. **Melhorar o Gerenciamento de Sessão/Erros**
   - *Contexto:* O README alerta que sessões expiram e cookies precisam ser manualmente atualizados via `.env`.
   - *Por que é importante:* Como um agente fará integrações, aprimorar a resiliência a quedas de sessão ou fornecer instruções mais robustas para capturar e validar cookies melhoraria consideravelmente a experiência do desenvolvedor e usuário final.

## Riscos e bloqueios
- **Expiração de Sessão (Cookies):** A arquitetura depende da cópia manual dos cookies de uma sessão logada do usuário no SEI. Se essa sessão expirar e o usuário não providenciar novos cookies, o sistema falhará completamente, bloqueando operações dos agentes de IA.
- **Mudanças no layout do SEI:** Uma vez que o projeto utiliza scraping HTML (`cheerio`), qualquer alteração na estrutura do DOM do sistema SEI quebrará a lógica de integração subjacente sem aviso prévio.
- **Ambientes de Teste do SEI:** Testar e desenvolver de forma confiável requer acesso contínuo a uma instância ativa do SEI ou mocking rigoroso das respostas de rede (o que ainda não parece estar totalmente em vigor no repositório).
