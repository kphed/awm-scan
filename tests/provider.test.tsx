import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { Provider } from "../src/components/ui/provider";

describe("Provider", () => {
  test("renders the theme bootstrap script before Emotion style tags", () => {
    const html = renderToString(
      <Provider>
        <div></div>
      </Provider>,
    );

    const scriptIndex = html.indexOf("<script>");
    const styleIndex = html.indexOf("<style");

    // The theme script needs to run before Chakra inserts global styles, or
    // React hydrates a different child order than the server rendered.
    expect(scriptIndex).toBeGreaterThanOrEqual(0);
    expect(styleIndex).toBeGreaterThanOrEqual(0);
    expect(scriptIndex).toBeLessThan(styleIndex);
  });

  test("boots the app in forced light mode", () => {
    const html = renderToString(
      <Provider>
        <div></div>
      </Provider>,
    );

    // The root provider should lock the next-themes bootstrap script to light
    // mode so browser preferences and stale local storage cannot flip the app.
    expect(html).toContain('"theme","light","light"');
    expect(html).not.toContain('"theme","system",null');
  });
});
