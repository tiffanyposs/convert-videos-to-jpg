var fs = require('fs');
const fse = require('fs-extra');
var ffmpeg = require('ffmpeg');
const readdir = require('readdir-enhanced');

/**
	* Directory of the videos to process
	* @name VIDEO_DIR
	* @type {String}
*/
const VIDEO_DIR = './videos';

/**
	* Directory of cloned video content
	* @name VIDEO_DIR_CLONE
	* @type {String}
*/
const VIDEO_DIR_CLONE = `./build/videos-clone`;

/** Directory of the output images
	* @name JPEG_DIR
	* @type {String}
*/
const JPEG_DIR = './build/images';


/** processes all folders and files in a directory to remove spaces in filenames
	* @name removeSpacesFromDir
	* @type {Function}
	* @param {dir} - directory path to process
*/
function removeSpacesFromDir(dir) {
	let folders = readdir.sync(dir, { deep: true });

	const withSpaces = folders.filter(path => {
		const stuff = path.split('/');
		return stuff[stuff.length - 1].includes(' ');
	}).reverse()

	const removeSpaces = withSpaces.map(path => {
		let newPath = path.split('/');
		newPath[newPath.length - 1] = newPath[newPath.length - 1].replace(/\s/g, '_');
		newPath = newPath.join('/');
		fs.renameSync(`${dir}/${path}`, `${dir}/${newPath}`);
	})
}

/**
	* Create a jpeg from given movie file
	* @name createJpegFile
	* @type {Function}
	* @param {videoPath} - video path to convert into a jpeg
*/
function createJpegFile(videoPath, cb) {
	let root = videoPath.split('/');
	let fileName = root.pop();
	fileName = fileName.split('.')[0];
	root = root.join('/');

	try {
		var process = new ffmpeg(`${VIDEO_DIR_CLONE}/${videoPath}`);
		return process.then(function (video) {
			video.fnExtractFrameToJPG(`${JPEG_DIR}/${root}`, {
				frame_rate : 1,
				number : 1,
			}, function (error, files) {
				cb(files[files.length - 1])
				if (error) console.log(error);
			});
		}, function (err) {
			console.log('Error: ' + err);
		});
	} catch (e) {
		console.log(e.code);
		console.log(e.msg);
	}
}

/**
	* removes the _1 addition the file names in image folder
	* @name correctImageName
	* @type {Function}
*/
function correctImageName(imagePath) {
	const newName = imagePath.replace(/_1\.jpg/, '.jpg');
	fs.renameSync(imagePath, newName);
}

/**
	* initializes processing
	* @name init
	* @type {Function}
*/
function init() {
	if(fs.existsSync(JPEG_DIR)) {
		fse.removeSync(JPEG_DIR);
	}

	if(fs.existsSync(VIDEO_DIR_CLONE)) {
		fse.removeSync(VIDEO_DIR_CLONE);
	}

	// make a clone of the original Video directory
	fse.copySync(VIDEO_DIR, VIDEO_DIR_CLONE);

	// remove spaces from directory
	removeSpacesFromDir(VIDEO_DIR_CLONE);

	const folders = readdir.sync(VIDEO_DIR_CLONE, { deep: true });
	const videos = folders.filter(path => path.includes('.mp4') || path.includes('.mov')); // TODO: SELECT .mov files too

	videos.forEach(video => {
		createJpegFile(video, correctImageName);
	});

}

init();
