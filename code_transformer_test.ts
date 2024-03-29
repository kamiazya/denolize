import { ts } from "./deps.ts";
import { denolizeFileName } from "./code_transformer.ts";
import { assertEquals } from "https://deno.land/std@0.95.0/testing/asserts.ts";
import { dedent } from "https://x.kite.run/lib/dedent.ts";
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
      input: "index.d.ts",
      expected: "types.ts",
    },
    {
      input: "hoge/index.ts",
      expected: "hoge/mod.ts",
    },
    {
      input: "hoge/ColorSchema.d.ts",
      expected: "hoge/color_schema.d.ts",
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
      input: "utils/color.schema.tsx",
      expected: "utils/color_schema.tsx",
    },
    {
      input: "index.js",
      expected: "mod.js",
    },
    {
      input: "index.mjs",
      expected: "mod.mjs",
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
    filename?: string;
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
    {
      filename: "hoge.d.ts",
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
      import React from "https://deno.land/x/types/react/v16.13.1/react.d.ts";
      `,
    },
    {
      filename: "types.ts",
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
      import React from "https://deno.land/x/types/react/v16.13.1/react.d.ts";
      `,
    },
  ];
  cases.forEach(({ filename = "", src, expected, option }, index) => {
    Deno.test({
      name: `denolizeSourceFile ${index}` + (filename ? `(${filename})` : ""),
      fn() {
        const printer = ts.createPrinter();
        const denolized = denolizeSourceFile(
          ts.createSourceFile(filename, src, ts.ScriptTarget.ESNext),
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
