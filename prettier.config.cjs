module.exports = {
	semi: false,
	useTabs: true,
	overrides: [
		{
			files: ["package.json", "*.md"],
			options: {
				useTabs: false,
			},
		},
	],
}
