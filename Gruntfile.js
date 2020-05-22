"use strict";

const path = require('path');
const fs = require('fs');

module.exports = function (grunt) {

	grunt.loadNpmTasks('grunt-bump');
	grunt.loadNpmTasks('grunt-webpack');
	grunt.loadNpmTasks('grunt-mocha-test');
	grunt.loadNpmTasks('grunt-karma');

	grunt.initConfig({
		bump: {
			options: {
				files: ['package.json'],
				commit: true,
				commitMessage: 'Regenerate and release version %VERSION%',
				commitFiles: [], // see task release:git-add-generated
				createTag: true,
				tagName: '%VERSION%',
				tagMessage: 'Version %VERSION%',
				push: false,
				prereleaseName: 'beta'
			}
		},
		webpack: {
			options: {
				entry: './lib/index.js',
				output: {
					path: path.resolve(__dirname, 'dist'),
					library: 'DeltaCodec'
				},
				module: {
					rules: [
						{
							test: /\.js$/,
							include: [
								path.resolve(__dirname, 'lib'),
								path.resolve(__dirname, 'node_modules/@ably/vcdiff-decoder')
							],
							use: {
								loader: 'babel-loader',
								options: {
									presets: [
										[
											'@babel/preset-env',
											{
												'corejs': 3,
												'useBuiltIns': 'usage',
												'modules': 'commonjs'
											}
										]
									]
								}
							}
						}
					]
				}
			},
			'delta-codec.js': {
				mode: 'none',	// Opts out of any default optimization options
				output: {
					filename: 'delta-codec.js'
				}
			},
			'delta-codec.min.js': {
				mode: 'production',
				output: {
					filename: 'delta-codec.min.js'
				}
			}
		},
		karma: {
			options: {
				frameworks: ['mocha'],
				files: [
					'dist/<%= grunt.task.current.args[0] %>',
					'test/browser-tests.js'
				],
				preprocessors: {
					'test/browser-tests.js': ['webpack', 'sourcemap']
				},
				webpack: {
					mode: 'none',
					devtool: 'inline-source-map',
					module: {
						rules: [
							{
								exclude: /node_modules/,
								use: {
									loader: 'babel-loader',
									options: {
										presets: [
											[
												'@babel/preset-env',
												{
													'corejs': 3,
													'useBuiltIns': 'usage',
													'modules': 'commonjs'
												}
											]
										]
									}
								}
							}
						]
					}
				},
				client: {
					mocha: {
						timeout: 10000
					}
				},
				captureTimeout: 120000,
				singleRun: true
			},
			local: {
				reporters: ['progress', 'mocha'],
				browsers: ['Firefox']
			},
			remote: {
				browserStack: {
					username: process.env.BROWSERSTACK_USERNAME,
					accessKey: process.env.BROWSERSTACK_ACCESSKEY
				},
				reporters: ['dots', 'BrowserStack'],
				customLaunchers: {
					// BrowserStack launchers. List here: https://www.browserstack.com/list-of-browsers-and-platforms?product=automate
					// To get actual values run `curl -u "BROWSERSTACK_USERNAME:BROWSERSTACK_ACCESSKEY" https://api.browserstack.com/automate/browsers.json | json_pp`
					bs_firefox_sierra: { base: 'BrowserStack', browser: 'firefox', browser_version: '60.0', os: 'OS X', os_version: 'Sierra' },
					bs_chrome_sierra: { base: 'BrowserStack', browser: 'chrome', browser_version: '66.0', os: 'OS X', os_version: 'Sierra' },
					bs_ie11_win10: { base: 'BrowserStack', browser: 'ie', browser_version: '11.0', os: 'Windows', os_version: '10' },
					bs_ie10_win81: { base: 'BrowserStack', browser: 'ie', browser_version: '10.0', os: 'Windows', os_version: '8' },
					bs_ie16_win10: { base: 'BrowserStack', browser: 'edge', browser_version: '16.0', os: 'Windows', os_version: '10' },
					bs_safari_11_iOS: { base: 'BrowserStack', browser: 'Mobile Safari', os: 'ios', os_version: '11.0', real_devices: ['iPhone SE'] },
					bs_safari_high_sierra: { base: 'BrowserStack', browser: 'Safari', browser_version: '11.1', os: 'OS X', os_version: 'High Sierra' },
					bs_android_6: { base: 'BrowserStack', browser: 'android', os: 'android', os_version: '6.0', device: 'Google Nexus 6', real_mobile: true }
				},
				browsers: [
					'bs_firefox_sierra',
					'bs_chrome_sierra',
					'bs_ie11_win10',
					'bs_ie10_win81',
					'bs_ie16_win10',
					'bs_safari_11_iOS',
					'bs_safari_high_sierra',
					'bs_android_6'
				]
			}
		},
		mochaTest: {
			node: {
				src: ['test/node-tests.js']
			}
		}
	});

	grunt.registerTask('build', 'webpack');

	grunt.registerTask('test:all', ['test', 'test:browser:remote']);

	grunt.registerTask('test', ['test:node', 'test:browser:local']);

	grunt.registerTask('test:node', 'mochaTest');

	grunt.registerTask('test:browser',
		'Runs browser tests in given context. Run as "grunt test:browser:<context>", where <context> is "local" or "remote"',
		context => {
			grunt.task.run([
				'build',
				`karma:${context}:delta-codec.js`,
				`karma:${context}:delta-codec.min.js`
			]);
		}
	);

	function _exec(done, cmd, operationDescription) {
		let execCallback = function(error, stdout, stderr) {
			if (null === error) {
				// Success
				grunt.log.ok(operationDescription);
				done();
				return;
			}
	
			// Failure
			grunt.log.error('Failed to ' + operationDescription + ':\n' + error);
			grunt.log.writeln('\n\nexec stdout:\n' + stdout);
			grunt.log.writeln('\n\nexec stderr:\n' + stderr);
			done(false);	
		};

		grunt.log.writeln(operationDescription + '...');
		require('child_process').exec(cmd, execCallback);
	}

	grunt.registerTask('publish-cdn',
		'Deploys to the Ably CDN. Requires infrastructure repository relative to here.',
		function() {
			let name = 'infrastructure';
			let prefix = '../';

			var infrastructurePath = '../infrastructure',
					maxTraverseDepth = 3,
					infrastructureFound;

			let folderExists = function(relativePath) {
				try {
					let fileStat = fs.statSync(infrastructurePath);
					if (fileStat.isDirectory()) {
						return true;
					}
				} catch (e) { /* does not exist */ }
			}

			while (infrastructurePath.length <= name.length + (maxTraverseDepth * prefix.length)) {
				grunt.verbose.writeln('Looking for infrastructure repo at: "' + infrastructurePath + "'.");
				if (infrastructureFound = folderExists(infrastructurePath)) {
					break;
				} else {
					infrastructurePath = prefix + infrastructurePath;
				}
			}
			if (!infrastructureFound) {
				grunt.fatal('Infrastructure repo could not be found in any parent folders up to a folder depth of ' + maxTraverseDepth + '.');
			}
			grunt.verbose.ok('Found infrastructure repo at: "' + infrastructurePath + '"');

			var version = grunt.file.readJSON('package.json').version,
					cmd = 'BUNDLE_GEMFILE="' + infrastructurePath + '/Gemfile" bundle exec ' + infrastructurePath + '/bin/ably-env deploy delta-codec --version ' + version;

			_exec(this.async(), cmd,  'Publish version ' + version + ' to CDN');
		}
	);
	
	/**
	 * We need this task because...
	 * 
	 * grunt-bump's bump-commit fails if commitFiles are not in the root - i.e.:
	 *   Running "bump::commit-only" (bump) task
	 *   Fatal error: Can not create the commit:
     *   error: pathspec 'dist/delta-codec.js' did not match any file(s) known to git
     *   error: pathspec 'dist/delta-codec.min.js' did not match any file(s) known to git
	 */
	grunt.registerTask('release:git-add-generated',
		'Adds generated files to the git staging area', function() {
			var generatedFiles = [
				'package.json',
				'dist/delta-codec.js',
				'dist/delta-codec.min.js'
			];

			var cmd = 'git add -A ' + generatedFiles.join(' ');

			_exec(this.async(), cmd,  'Add generated files to Git staging area');
		}
	);

	grunt.registerTask('release',
		'Increments the version, regenerates from source (build / bundle), then makes a tagged commit. Run as "grunt release:type", where "type" is "major", "minor", "patch", "prepatch", etc.)',
		versionType => {
			grunt.task.run([
				'bump-only:' + versionType,
				'build',
				'release:git-add-generated',
				'bump-commit'
			]);
		}
	);
};
