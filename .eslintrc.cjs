module.exports = {
	root: true,
	extends: [
		"plugin:@typescript-eslint/recommended",
		"plugin:prettier/recommended",
	],
	plugins: ["simple-import-sort"],
	rules: {
		"prettier/prettier": "warn",
		"simple-import-sort/imports": "warn",
		"simple-import-sort/exports": "warn",
		"@typescript-eslint/no-explicit-any": "off",
		"@typescript-eslint/explicit-module-boundary-types": "off",
	},
	ignorePatterns: ["/dist/"],
}
