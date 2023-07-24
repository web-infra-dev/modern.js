# Note

## tsconfig.json

- Require config `"rootDir": "./src"` in `compilerOptions`
- Require config `"composite": true,`
- Require config `"declaration": true,` in `compilerOptions`
- Require config `"declarationDir": "./dist/types"` in `compilerOptions`

## package.json

- `"types"` equal to `"declarationDir` in tsconfig.json
