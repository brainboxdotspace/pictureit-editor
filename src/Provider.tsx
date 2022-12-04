import React from "react"
import { Provider as ScenifyProvider } from "@layerhub-io/react"
import { Client as Styletron } from "styletron-engine-atomic"
import { Provider as StyletronProvider } from "styletron-react"
import { BaseProvider, LightTheme } from "baseui"
import { store } from "./store/store"
import { Provider as ReduxProvier } from "react-redux"
import { I18nextProvider } from "react-i18next"
import { TimerProvider } from "@layerhub-io/use-timer"
import { RecoilRoot } from "recoil"
import i18next from "i18next"
import "./translations"

const engine = new Styletron()

const Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ReduxProvier store={store}>
      <TimerProvider>
        <RecoilRoot>
          <ScenifyProvider>
            <StyletronProvider value={engine}>
              <BaseProvider theme={LightTheme}>
                <I18nextProvider i18n={i18next}>{children}</I18nextProvider>
              </BaseProvider>
            </StyletronProvider>
          </ScenifyProvider>
        </RecoilRoot>
      </TimerProvider>
    </ReduxProvier>
  )
}

export default Provider
