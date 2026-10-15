# Indicador de contexto

Plugin do Claude Code que mostra, numa faixa logo acima do campo de mensagem, quanto da janela de contexto a conversa atual já usa.

A faixa tem só uma barra e os valores no fim, por exemplo `161k / 1M · 16%`. Ela é atualizada depois de cada resposta do Claude.

## As cores

A cor segue o tamanho da conversa em tokens, e não o percentual da janela:

| Tamanho da conversa | Cor da barra e da borda |
|---|---|
| abaixo de 400k | cinza |
| de 400k a 599k | amarelo |
| de 600k a 799k | laranja |
| 800k ou mais | vermelho |

Antes da primeira resposta de um chat novo, ou logo depois de um `/compact`, a faixa mostra "aguardando a primeira resposta" e `? / 1M`.

O plugin não mostra mensagens nem avisos: só a barra muda de cor.

## Os cortes são configuráveis

Os três cortes são as opções `corteAmarelo`, `corteLaranja` e `corteVermelho`, em milhares de tokens (400, 600 e 800), perguntadas na instalação. Um trio inválido (algum valor zero ou negativo, ou fora da ordem amarelo, laranja, vermelho) volta para 400, 600 e 800.

## Instalação

O repositório é privado: quem instala precisa ter acesso a ele e estar logado no GitHub.

Rode no terminal, dentro de uma sessão do `claude`:

```
/plugin install indicador-contexto --marketplace LuizRumo/indicador-contexto
```

Responda `y` para adicionar o marketplace e escolha o escopo de usuário. Instalado assim, o plugin carrega em toda sessão nova, inclusive nas sessões da aba Code do app de desktop.

O comando só funciona num terminal. Na aba Code do app de desktop ele responde que não existe ali.

## Desenvolvimento

```
claude plugin validate .
```

```
claude plugin test .
```

A pasta `.claude-plugin/types/` é gravada pelo próprio Claude Code quando o plugin carrega, e fica fora do git.
