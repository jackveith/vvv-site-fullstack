import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import tseslint from 'typescript-eslint';
import js from '@eslint/js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
});

const eslintConfig = [

    ...compat.config({
        extends: ["plugin:@typescript-eslint/recommended"]
    }),
    {
        files: ["**/*.ts"],
        plugins: {
            "@typescript-eslint": tseslint.plugin,
        },
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                project: "./tsconfig.json",
            },
        },
        rules: {
            ...tseslint.configs.recommended.rules,
            "@typescript-eslint/no-unused-vars": "warn",        //I DONT CAREEEEEEE
            "node/no-unsupported-features/es-syntax": "off",    //handled by TS
            "node/no0missing-import": "off",                    //handled by TS
        },
    },

    //ignores
    {
        ignores: [
            "node_modules/**",
            "dist/**",
            "build/**",
        ],
    },
];

export default eslintConfig;
