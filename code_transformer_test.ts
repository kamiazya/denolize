import { ts } from "./deps.ts";
import { denolizeFileName } from "./code_transformer.ts";
import {
  assertEquals,
} from "https://deno.land/std@0.62.0/testing/asserts.ts";
import { dedent } from "https://deno.land/x/lib/dedent.ts";
import { denolizeSourceFile, DenolizeFileOption } from "./code_transformer.ts";

testDenolizeFileName();
testDenolizeSourceFile();

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

function testDenolizeSourceFile() {
  const cases: {
    src: string;
    option?: DenolizeFileOption;
    expected: string;
  }[] = [
    {
      src: dedent`
      import hoge from 'hoge';
      `,
      option: {
        imports: {
          hoge: "fuga.ts",
        },
      },
      expected: dedent`
      import hoge from "fuga.ts";
      `,
    },
    {
      src: dedent`
      import React from 'react';
      `,
      option: {
        imports: {
          react: {
            type: "https://deno.land/x/types/react/v16.13.1/react.d.ts",
            import: "https://cdn.pika.dev/react@16.13.1",
          },
        },
      },
      expected: dedent`
      // @deno-types="https://deno.land/x/types/react/v16.13.1/react.d.ts"
      import React from "https://cdn.pika.dev/react@16.13.1";
      `,
    },
    {
      src: dedent`
      import { renderToStaticMarkup } from "react-dom/server";
      `,
      option: {
        imports: {
          "react-dom/server": {
            type: "https://deno.land/x/types/react-dom/v16.13.1/server.d.ts",
            import: "https://cdn.pika.dev/react-dom@16.13.1/server",
          },
        },
      },
      expected: dedent`
      // @deno-types="https://deno.land/x/types/react-dom/v16.13.1/server.d.ts"
      import { renderToStaticMarkup } from "https://cdn.pika.dev/react-dom@16.13.1/server";
      `,
    },
  ];
  cases.forEach(({ src, expected, option }, index) => {
    Deno.test({
      name: `denolizeSourceFile ${index}`,
      fn() {
        const printer = ts.createPrinter();
        const denolized = denolizeSourceFile(
          ts.createSourceFile("", src, ts.ScriptTarget.ESNext),
          option,
        );
        assertEquals(
          printer.printFile(denolized).trim().replace("\r", ""),
          expected.trim().replace("\r", ""),
        );
      },
    });
  });
}
