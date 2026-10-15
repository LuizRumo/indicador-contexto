import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Leitura } from '../types'
import { cortesDe, estadoDe, leituraDe, textoNumero } from './regras'

const leitura = atom({ plugin: 'indicador-contexto', key: 'leitura' } as const, null as Leitura | null)

const CORES = {
  normal: { borda: 'subtle', barra: '#6f7072' },
  alerta: { borda: '#FF8200', barra: '#FF8200' },
  critico: { borda: '#e0533d', barra: '#e0533d' },
} as const

/** A barra do esboço: 6 px de altura, cantos arredondados, trilho cinza translúcido. */
function barraSvg(percentual: number, cor: string): string {
  const cheia = percentual * 10
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="6" viewBox="0 0 1000 6" preserveAspectRatio="none">' +
    '<rect width="1000" height="6" rx="3" fill="#6f7072" fill-opacity="0.3"/>' +
    (cheia > 0 ? `<rect width="${cheia}" height="6" rx="3" fill="${cor}"/>` : '') +
    '</svg>'
  )
}

async function lerDoMotor($: EngineInterface) {
  const { context } = await $.session.usage()
  await update($, leitura, () => leituraDe(context))
}

export const register: Register = (on, options) => {
  const cortes = cortesDe(options)

  on('session.start', async ($, e, next) => {
    const resultado = await next(e)
    await lerDoMotor($)
    return resultado
  })

  on('session.measure', async ($, e, next) => {
    await update($, leitura, () => leituraDe(e.context))
    return next(e)
  })

  on('session.compact', async ($, e, next) => {
    const resultado = await next(e)
    await lerDoMotor($)
    return resultado
  }).catch(($, e, next) => next(e))

  on('session.end', async ($, e, next) => {
    if (e.reason === 'clear') {
      await update($, leitura, anterior =>
        anterior === null ? null : { tokens: null, percentual: null, janela: anterior.janela },
      )
    }
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const atual = await read($, leitura)
    if (e.props.hasSurvey || atual === null) return next(e)

    const { Box, Text } = $.ui.resolve(e)
    const numero = textoNumero(atual)

    if (atual.percentual === null) {
      return (
        <Box key="faixa" borderStyle="round" borderColor={CORES.normal.borda} paddingX={1} gap={1}>
          <Box flexGrow={1}>
            <Text dimColor wrap="truncate-end">
              aguardando a primeira resposta
            </Text>
          </Box>
          <Text>{numero}</Text>
        </Box>
      )
    }

    const estado = estadoDe(atual.percentual, cortes)
    const cor = CORES[estado]
    const emDestaque = estado !== 'normal'

    const preenchido = Math.min(atual.percentual, 100)
    let barra

    if (e.surface === 'terminal') {
      // Borda (2), recuo (2), um espaço entre a barra e o número (1).
      const sobra = e.props.bodyColumns - numero.length - 5
      const celulas = Math.max(8, Math.min(60, sobra))
      const cheias = Math.round((preenchido / 100) * celulas)
      barra = (
        <Box key="barra" flexGrow={1}>
          <Text color={cor.barra} wrap="truncate-end">
            {'━'.repeat(cheias)}
          </Text>
          <Text color="subtle" wrap="truncate-end">
            {'━'.repeat(celulas - cheias)}
          </Text>
        </Box>
      )
    } else {
      // Fora do terminal a letra não tem largura fixa: a barra é um desenho, como no esboço.
      const { Svg } = $.ui.resolve(e)
      barra = (
        <Box key="barra" flexGrow={1} flexShrink={1} alignItems="center">
          <Svg
            source={barraSvg(preenchido, cor.barra)}
            alt={`Contexto em ${atual.percentual}%`}
            height={6}
          />
        </Box>
      )
    }

    return (
      <Box key="faixa" borderStyle="round" borderColor={cor.borda} paddingX={1} gap={1} alignItems="center">
        {barra}
        <Box key="numero" flexShrink={0}>
          <Text color={emDestaque ? cor.barra : undefined} bold={emDestaque} wrap="truncate-end">
            {numero}
          </Text>
        </Box>
      </Box>
    )
  })
}
