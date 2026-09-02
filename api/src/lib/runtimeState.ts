let acceptingTraffic = true
export const runtimeState = {
    isReady: () => acceptingTraffic,
    beginShutdown: () => { acceptingTraffic = false },
}
