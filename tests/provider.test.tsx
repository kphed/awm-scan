import { describe, expect, test } from "bun:test"
import { renderToString } from "react-dom/server"
import * as React from "react"
import { Provider } from "../src/components/ui/provider"

describe("Provider", () => {
  test("renders the theme bootstrap script before Emotion style tags", () => {
    const html = renderToString(
      <Provider>
        <div>Hello</div>
      </Provider>,
    )

    const scriptIndex = html.indexOf("<script>")
    const styleIndex = html.indexOf("<style")

    // The theme script needs to run before Chakra inserts global styles, or
    // React hydrates a different child order than the server rendered.
    expect(scriptIndex).toBeGreaterThanOrEqual(0)
    expect(styleIndex).toBeGreaterThanOrEqual(0)
    expect(scriptIndex).toBeLessThan(styleIndex)
  })
})
