import { describe, expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On, RenderElement } from 'claude-code'

const JANELA = 1_000_000

const FAIXA = {
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 80,
    scroll: { offset: 0, bodyRows: 10 },
    view: {},
  },
} as const

/** Responde o que fica abaixo do plugin: a leitura inicial do motor, e conta os avisos rápidos (que não devem existir). */
function preparar(on: On, tokensIniciais?: number) {
  const avisos: string[] = []
  on('session.usage', () => ({ value: {
    startedAt: 0,
    context:
      tokensIniciais === undefined
        ? { window: JANELA }
        : { window: JANELA, tokens: tokensIniciais, percent: Math.round((tokensIniciais / JANELA) * 100) },
    rateLimits: [],
  } }))
  on('session.start', ($, e) => ({ cwd: e.cwd }))
  on('session.measure', ($, e) => ({ changed: e.changed }))
  on('ui.toast', ($, e) => {
    avisos.push(e.text)
    return { value: undefined }
  })
  // Fundo da faixa: sem plugin desenhando, o motor deixaria a faixa vazia.
  on('ui.render', ($, e) => h($.ui.resolve(e).Box, {}) as RenderElement)
  return avisos
}

async function medir($: Engine, percentual: number) {
  await $.session.measure({
    context: { tokens: percentual * 10_000, window: JANELA, percent: percentual },
    rateLimits: [],
    changed: ['context'],
  })
}

async function faixaEm($: Engine, superficie: 'terminal' | 'desktop') {
  const ui = await $.ui.mount({ plugin: 'indicador-contexto', surface: superficie, ...FAIXA })
  const achado = await ui.find({ type: 'Text', text: / \/ / })
  const numero = achado?.text
  const corNumero = achado?.props.color
  // A faixa não mostra dica em estado nenhum: só a barra e o número.
  const dica = (await ui.find({ type: 'Text', text: /chat novo/ }))?.text
  const rotulo = (await ui.find({ type: 'Text', text: /^Contexto$/ }))?.text
  const espera = (await ui.find({ type: 'Text', text: /aguardando/ }))?.text
  const desenho = (await ui.find({ type: 'Svg' }))?.props
  await ui.unmount()
  return { numero, corNumero, dica, espera, desenho, rotulo }
}

describe('sem avisos', () => {
  test('nenhum aviso rápido aparece ao cruzar os cortes', async ($, on) => {
    const avisos = preparar(on)
    for (const percentual of [60, 72, 80, 92, 95, 50, 72]) await medir($, percentual)
    expect(avisos.length).toBe(0)
  })

  test('salto direto do normal para o crítico também não avisa', async ($, on) => {
    const avisos = preparar(on)
    await medir($, 60)
    await medir($, 93)
    expect(avisos.length).toBe(0)
  })

  test('com cortes 50 e 80, a cor muda em 55% e em 81%', { options: { corteAlerta: 50, corteCritico: 80 } }, async ($, on) => {
    preparar(on)
    await medir($, 45)
    expect((await faixaEm($, 'terminal')).corNumero).toBe(undefined)
    await medir($, 55)
    expect((await faixaEm($, 'terminal')).corNumero).toBe('#FF8200')
    await medir($, 81)
    expect((await faixaEm($, 'terminal')).corNumero).toBe('#e0533d')
  })
})

describe('faixa acima do prompt', () => {
  for (const superficie of ['terminal', 'desktop'] as const) {
    test(`troca de estado nos cortes (${superficie})`, async ($, on) => {
      preparar(on)

      await medir($, 45)
      let faixa = await faixaEm($, superficie)
      expect(faixa.numero).toBe('450k / 1M · 45%')
      expect(faixa.dica).toBe(undefined)
      expect(faixa.rotulo).toBe(undefined)
      // No terminal a barra é de caracteres; no desktop, um desenho com 45% preenchido.
      if (superficie === 'terminal') expect(faixa.desenho).toBe(undefined)
      else {
        expect(faixa.desenho?.alt).toBe('Contexto em 45%')
        expect(String(faixa.desenho?.source)).toContain('width="450"')
      }

      await medir($, 69)
      faixa = await faixaEm($, superficie)
      expect(faixa.dica).toBe(undefined)

      await medir($, 70)
      faixa = await faixaEm($, superficie)
      expect(faixa.numero).toBe('700k / 1M · 70%')
      expect(faixa.dica).toBe(undefined)

      await medir($, 89)
      faixa = await faixaEm($, superficie)
      expect(faixa.dica).toBe(undefined)

      await medir($, 90)
      faixa = await faixaEm($, superficie)
      expect(faixa.numero).toBe('900k / 1M · 90%')
      expect(faixa.dica).toBe(undefined)
    })

    test(`sem medição mostra o texto de espera (${superficie})`, async ($, on) => {
      preparar(on)
      await $.session.start({ cwd: '.', surface: superficie, isInteractive: true })
      const faixa = await faixaEm($, superficie)
      expect(faixa.espera).toBe('aguardando a primeira resposta')
      expect(faixa.numero).toBe('? / 1M')
    })
  }
})
