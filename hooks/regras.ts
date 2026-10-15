// Regras puras do indicador: estado da faixa e formatação dos números.

import type { Leitura } from '../types'

export type Estado = 'normal' | 'alerta' | 'critico'
export type Cortes = { alerta: number; critico: number }

export const CORTES_PADRAO: Cortes = { alerta: 70, critico: 90 }

/** Lê os cortes do userConfig; par inválido (fora de 1 a 100, ou crítico não acima do alerta) volta ao padrão. */
export function cortesDe(opcoes: Readonly<Record<string, unknown>>): Cortes {
  const alerta = Number(opcoes.corteAlerta ?? CORTES_PADRAO.alerta)
  const critico = Number(opcoes.corteCritico ?? CORTES_PADRAO.critico)
  const valido =
    Number.isFinite(alerta) && Number.isFinite(critico) && alerta >= 1 && critico <= 100 && critico > alerta
  return valido ? { alerta, critico } : CORTES_PADRAO
}

export function estadoDe(percentual: number, cortes: Cortes): Estado {
  if (percentual >= cortes.critico) return 'critico'
  if (percentual >= cortes.alerta) return 'alerta'
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
