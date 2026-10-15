# Indicador de contexto

Plugin do Claude Code que mostra, numa faixa logo acima do campo de mensagem, quanto da janela de contexto a conversa atual já usa.

A faixa tem só uma barra e os valores no fim, por exemplo `161k / 1M · 16%`. Ela é atualizada depois de cada resposta do Claude.

## As cores

| Uso da janela | Cor da barra e da borda |
|---|---|
| abaixo de 70% | cinza |
| de 70% a 89% | laranja |
| 90% ou mais | vermelho |

Antes da primeira resposta de um chat novo, ou logo depois de um `/compact`, a faixa mostra "aguardando a primeira resposta" e `? / 1M`.

O plugin não mostra mensagens nem avisos: só a barra muda de cor.

## Os cortes são configuráveis

Os percentuais de 70% e 90% são as opções `corteAlerta` e `corteCritico`, perguntadas na instalação. Um par inválido (fora de 1 a 100, ou o crítico que não fica acima do alerta) volta para 70 e 90.

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
