"use strict";

const path = require('path');

module.exports = function (grunt) {

	grunt.loadNpmTasks('grunt-webpack');

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
		}
	});

	grunt.registerTask('build', 'webpack');
};
