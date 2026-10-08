# BriefArq

Formulários de briefing da **Priscila Cunha · Arquitetura**, publicados no GitHub Pages.

| Briefing | Link |
|---|---|
| Ambiente Home Office L\|L | https://raulanacleto.github.io/briefarq/home-office-ll/ |

## Como as respostas chegam

O cliente preenche e clica em **Enviar respostas**. O formulário manda tudo para um Google Apps
Script ligado a uma planilha do Google:

- cada briefing vira uma **aba**, cada cliente uma **linha**, cada pergunta uma **coluna**;
- imagens anexadas vão para o Drive (`BriefArq - anexos/…`) e a linha traz o link da pasta;
- se o cliente mudar algo e enviar de novo, a mesma linha é atualizada (não duplica).

As respostas também ficam salvas no navegador do cliente, então ele pode fechar e voltar depois.
O botão **Baixar cópia** continua gerando o arquivo `.html` com as respostas, como antes.

Sem `endpoint` configurado, o formulário volta ao modo antigo (só baixa o arquivo).

## Configurar a planilha (uma vez)

Faça logado na conta Google que deve receber as respostas.

1. Crie uma planilha nova (https://sheets.new) — ex.: "BriefArq - respostas".
2. Menu **Extensões → Apps Script**. Apague o conteúdo e cole o arquivo
   [`apps-script/Code.gs`](apps-script/Code.gs). Salve.
3. **Implantar → Nova implantação** → engrenagem → **App da Web**:
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
4. Autorize o acesso quando o Google pedir (planilha e Drive).
5. Copie a **URL do app da Web** (termina em `/exec`). Abrindo essa URL no navegador deve
   aparecer `{"ok":true}`.
6. Coloque a URL no campo `"endpoint"` do `<script id="seed">` em cada `index.html` de briefing.

Se alterar o `Code.gs` depois, use **Implantar → Gerenciar implantações → editar → Nova versão**
para manter a mesma URL.

## Novo briefing

O envio para a planilha existe só nos arquivos deste repositório. O formulário exportado pelo
BriefArq ainda não tem esse envio.

1. Copie `home-office-ll/` para uma pasta nova (ex.: `cozinha-fulano/`).
2. No `index.html` novo, troque o `"id"` e o `"data"` do `<script id="seed">` pelos do formulário
   exportado pelo BriefArq, mantendo o `"endpoint"`.
3. Acrescente a linha na tabela acima.
