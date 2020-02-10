"use strict";

const path = require('path');

module.exports = function (grunt) {

	grunt.loadNpmTasks('grunt-webpack');
	grunt.loadNpmTasks('grunt-mocha-test');
	grunt.loadNpmTasks('grunt-karma');

	grunt.initConfig({
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
							],
							use: {
								loader: 'babel-loader',
								options: {
									presets: ['@babel/preset-env']
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
								use: {
									loader: 'babel-loader',
									options: {
										presets: [
											'@babel/preset-env'
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
};
