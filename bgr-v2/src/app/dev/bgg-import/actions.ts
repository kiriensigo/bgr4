"use server"

export async function importFromBGGAction(formData: FormData) {
  const idRaw = formData.get('bggId')?.toString() || ''
  const bggId = parseInt(idRaw, 10)

  const { registerServices, getGameUseCase } = await import('@/application/container/ServiceRegistration')
  await registerServices()
  const gameUseCase = await getGameUseCase()

  try {
    const game = await gameUseCase.createGameFromBGG({ bggId, autoRegister: true })
    const plain = game.toPlainObject()
    return { ok: true, data: plain }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'unknown error' }
  }
}

