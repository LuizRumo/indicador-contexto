// Contrato de estado do indicador-contexto.

/** A última medição da janela de contexto. `tokens` nulo: ainda sem medição. */
export type Leitura = { tokens: number | null; percentual: number | null; janela: number }

declare module 'claude-code' {
  interface PluginState {
    'indicador-contexto': { leitura: Leitura | null }
  }
}
