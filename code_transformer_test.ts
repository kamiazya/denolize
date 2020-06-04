import { denolizeFileName } from "./code_transformer.ts";
import {
  assertEquals,
} from "https://deno.land/std/testing/asserts.ts";

testDenolizeFileName();

function testDenolizeFileName() {
  const cases: {
    input: string;
    expected: string;
  }[] = [
    {
      input: "index.ts",
      expected: "mod.ts",
    },
    {
      input: "hoge/index.ts",
      expected: "hoge/mod.ts",
    },
    {
      input: "ColorSchema.ts",
      expected: "color_schema.ts",
    },
    {
      input: "utils/ColorSchema.ts",
      expected: "utils/color_schema.ts",
    },
    {
      input: "utils/ColorSchema",
      expected: "utils/color_schema",
    },
    {
      input: "utils/ColorSchema.jsx",
      expected: "utils/color_schema.jsx",
    },
    {
      input: "utils/ColorSchema.tsx",
      expected: "utils/color_schema.tsx",
    },
    {
      input: "index.js",
      expected: "mod.js",
    },
    {
      input: "index.tsx",
      expected: "mod.tsx",
    },
    {
      input: "index.jsx",
      expected: "mod.jsx",
    },
  ];

  for (const { input, expected } of cases) {
    Deno.test({
      name: `denolizeFileName("${input}") === "${expected}"`,
      fn() {
        assertEquals(denolizeFileName(input), expected);
      },
    });
  }
}
