// Regras puras do indicador: estado da faixa e formatação dos números.

import type { Leitura } from '../types'

export type Estado = 'normal' | 'amarelo' | 'laranja' | 'vermelho'
/** Os cortes em tokens: a partir de cada um, a faixa troca de cor. */
export type Cortes = { amarelo: number; laranja: number; vermelho: number }

export const CORTES_PADRAO: Cortes = { amarelo: 400_000, laranja: 600_000, vermelho: 800_000 }

/**
 * Lê os cortes do userConfig, em milhares de tokens (400 vale 400k). Trio inválido
 * (algum não positivo, ou fora da ordem amarelo < laranja < vermelho) volta ao padrão.
 */
export function cortesDe(opcoes: Readonly<Record<string, unknown>>): Cortes {
  const amarelo = Number(opcoes.corteAmarelo ?? CORTES_PADRAO.amarelo / 1_000) * 1_000
  const laranja = Number(opcoes.corteLaranja ?? CORTES_PADRAO.laranja / 1_000) * 1_000
  const vermelho = Number(opcoes.corteVermelho ?? CORTES_PADRAO.vermelho / 1_000) * 1_000
  const valido =
    [amarelo, laranja, vermelho].every(Number.isFinite) && amarelo > 0 && laranja > amarelo && vermelho > laranja
  return valido ? { amarelo, laranja, vermelho } : CORTES_PADRAO
}

export function estadoDe(tokens: number, cortes: Cortes): Estado {
  if (tokens >= cortes.vermelho) return 'vermelho'
  if (tokens >= cortes.laranja) return 'laranja'
  if (tokens >= cortes.amarelo) return 'amarelo'
  return 'normal'
}

/** A medição como o motor a entrega: tokens e percentual ausentes até a primeira resposta. */
export function leituraDe(contexto: { tokens?: number; window: number; percent?: number }): Leitura {
  if (contexto.tokens === undefined) return { tokens: null, percentual: null, janela: contexto.window }
  const percentual = contexto.percent ?? Math.round((contexto.tokens / contexto.window) * 100)
  return { tokens: contexto.tokens, percentual, janela: contexto.window }
}

/** 454000 vira "454k", 1000000 vira "1M", 1500000 vira "1,5M". */
export function formatarTokens(n: number): string {
  if (n >= 1_000_000) {
    const milhoes = Math.round(n / 100_000) / 10
    return `${String(milhoes).replace('.', ',')}M`
  }
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`
  return String(n)
}

export function textoNumero(leitura: Leitura): string {
  const janela = formatarTokens(leitura.janela)
  if (leitura.tokens === null || leitura.percentual === null) return `? / ${janela}`
  return `${formatarTokens(leitura.tokens)} / ${janela} · ${leitura.percentual}%`
}
