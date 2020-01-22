jest.mock('fs');
jest.mock('mrm-core/src/npm', () => ({
	install: jest.fn(),
}));

const { install } = require('mrm-core');
const { getConfigGetter } = require('mrm');
const vol = require('memfs').vol;
const task = require('./index');

const stringify = o => JSON.stringify(o, null, '  ');

const packageJson = stringify({
	name: 'unicorn',
	scripts: {
		test: 'jest',
	},
});

const console$log = console.log;

beforeEach(() => {
	console.log = jest.fn();
});

afterEach(() => {
	vol.reset();
	install.mockClear();
	console.log = console$log;
});

it('should not do anything if not supported tools are found', () => {
	vol.fromJSON({
		'/package.json': packageJson,
	});

	task(getConfigGetter({}));

	expect(Object.keys(vol.toJSON())).toEqual(['/package.json']);
	expect(vol.toJSON()['/package.json']).toEqual(packageJson);
	expect(console.log).toBeCalledWith(expect.stringMatching('Cannot configure lint-staged'));
});

it('should add Prettier if project depends on it', () => {
	vol.fromJSON({
		'/package.json': stringify({
			name: 'unicorn',
			devDependencies: {
				prettier: '*',
			},
		}),
	});

	task(getConfigGetter({}));

	expect(vol.toJSON()).toMatchSnapshot();
	expect(install).toBeCalledWith({ 'lint-staged': '>=10', husky: '>=1' });
});

it('should add *.css to Prettier extensions if Prettier >= 1.4', () => {
	vol.fromJSON({
		'/package.json': stringify({
			name: 'unicorn',
			devDependencies: {
				prettier: '1.4.0',
			},
		}),
	});

	task(getConfigGetter({}));

	expect(vol.toJSON()).toMatchSnapshot();
});

it('should add *.css and *.json to Prettier extensions if Prettier >= 1.5', () => {
	vol.fromJSON({
		'/package.json': stringify({
			name: 'unicorn',
			devDependencies: {
				prettier: '>=1.5.3',
			},
		}),
	});

	task(getConfigGetter({}));

	expect(vol.toJSON()).toMatchSnapshot();
});

it('should add *.css, *.json and *.md to Prettier extensions if Prettier >= 1.8', () => {
	vol.fromJSON({
		'/package.json': stringify({
			name: 'unicorn',
			devDependencies: {
				prettier: '~1.8.5',
			},
		}),
	});

	task(getConfigGetter({}));

	expect(vol.toJSON()).toMatchSnapshot();
});

it('should add Prettier and ESLint', () => {
	vol.fromJSON({
		'/package.json': stringify({
			name: 'unicorn',
			scripts: {},
			devDependencies: {
				eslint: '4.0.1',
				prettier: '1.9.2',
			},
		}),
	});

	task(getConfigGetter({}));

	expect(vol.toJSON()).toMatchSnapshot();
});

it('should infer Prettier extension from an npm script', () => {
	vol.fromJSON({
		'/package.json': stringify({
			name: 'unicorn',
			scripts: {
				format: "prettier --write '**/*.{js,jsx}'",
			},
			devDependencies: {
				prettier: '1.9.2',
			},
		}),
	});

	task(getConfigGetter({}));

	expect(vol.toJSON()['/package.json']).toMatchSnapshot();
});

it('should not do anything if project is using Prettier via ESLint plugin', () => {
	const pkg = stringify({
		name: 'unicorn',
		devDependencies: {
			prettier: '*',
			'eslint-plugin-prettier': '*',
		},
	});
	vol.fromJSON({
		'/package.json': pkg,
	});

	task(getConfigGetter({}));

	expect(Object.keys(vol.toJSON())).toEqual(['/package.json']);
	expect(vol.toJSON()['/package.json']).toEqual(pkg);
	expect(console.log).toBeCalledWith(expect.stringMatching('Cannot configure lint-staged'));
});

it('should add ESLint if project depends on it', () => {
	vol.fromJSON({
		'/package.json': stringify({
			name: 'unicorn',
			devDependencies: {
				eslint: '*',
			},
		}),
	});

	task(getConfigGetter({}));

	expect(vol.toJSON()).toMatchSnapshot();
	expect(install).toBeCalledWith({ 'lint-staged': '>=10', husky: '>=1' });
});

it('should use default JS extension if eslint command has no --ext key', () => {
	vol.fromJSON({
		'/package.json': stringify({
			name: 'unicorn',
			scripts: {
				lint: 'eslint --fix',
			},
			devDependencies: {
				eslint: '*',
			},
		}),
	});

	task(getConfigGetter({}));

	expect(vol.toJSON()['/package.json']).toMatchSnapshot();
});

it('should infer ESLint extension for an npm script', () => {
	vol.fromJSON({
		'/package.json': stringify({
			name: 'unicorn',
			scripts: {
				lint: 'eslint --fix --ext .js,.jsx',
			},
			devDependencies: {
				eslint: '*',
			},
		}),
	});

	task(getConfigGetter({}));

	expect(vol.toJSON()['/package.json']).toMatchSnapshot();
});

it('should use custom Prettier extensions', () => {
	vol.fromJSON({
		'/package.json': stringify({
			name: 'unicorn',
			devDependencies: {
				prettier: '1.9.2',
			},
		}),
	});

	task(getConfigGetter({ prettierExtensions: '.js,.jsx,.mjs' }));

	expect(vol.toJSON()).toMatchSnapshot();
});

it('should use a custom ESLint extension', () => {
	vol.fromJSON({
		'/package.json': stringify({
			name: 'unicorn',
			devDependencies: {
				eslint: '*',
			},
		}),
	});

	task(getConfigGetter({ eslintExtensions: '.js,.jsx' }));

	expect(vol.toJSON()).toMatchSnapshot();
});

it('should merge ESLint and Prettier into a single lint-staged rule', () => {
	vol.fromJSON({
		'/package.json': stringify({
			name: 'unicorn',
			devDependencies: {
				eslint: '*',
				prettier: '*',
			},
		}),
	});

	task(getConfigGetter({}));

	expect(vol.toJSON()['/package.json']).toMatchSnapshot();
	expect(install).toBeCalledWith({ 'lint-staged': '>=10', husky: '>=1' });
});

it('should add stylelint if project depends on it', () => {
	vol.fromJSON({
		'/package.json': stringify({
			name: 'unicorn',
			devDependencies: {
				stylelint: '*',
			},
		}),
	});

	task(getConfigGetter({}));

	expect(vol.toJSON()).toMatchSnapshot();
	expect(install).toBeCalledWith({ 'lint-staged': '>=10', husky: '>=1' });
});

it('should use a custom stylelint extension', () => {
	vol.fromJSON({
		'/package.json': stringify({
			name: 'unicorn',
			devDependencies: {
				stylelint: '*',
			},
		}),
	});

	task(getConfigGetter({ stylelintExtensions: '.scss' }));

	expect(vol.toJSON()).toMatchSnapshot();
});

it('should use a custom rules', () => {
	vol.fromJSON({
		'/package.json': stringify({
			name: 'unicorn',
			devDependencies: {
				eslint: '*',
				stylelint: '*',
			},
		}),
	});

	task(getConfigGetter({ lintStagedRules: { '*.js': 'false' } }));

	expect(vol.toJSON()).toMatchSnapshot();
	expect(install).toBeCalledWith({ 'lint-staged': '>=10', husky: '>=1' });
});

it('should remove husky 0.14 config from package.json', () => {
	vol.fromJSON({
		'/package.json': stringify({
			name: 'unicorn',
			scripts: {
				precommit: 'lint-staged',
			},
			devDependencies: {
				eslint: '*',
			},
		}),
	});

	task(getConfigGetter());

	expect(vol.toJSON()).toMatchSnapshot();
});

it('should remove `git add` from lint-staged config if lint-staged v10 is used', () => {
	vol.fromJSON({
		'/package.json': stringify({
			name: 'unicorn',
			scripts: {
				precommit: 'lint-staged',
			},
			devDependencies: {
				eslint: '*',
			},
			'lint-staged': {
				'*.js': ['eslint --fix', 'some other command', 'git add'],
			},
		}),
	});

	task(getConfigGetter());

	expect(vol.toJSON()).toMatchSnapshot();
});
