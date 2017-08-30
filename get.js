let fs = require('fs'); // 文件写入
let mkdirp = require('mkdirp'); // 创建文件夹
let request = require('superagent'); // 发送请求
let async = require('async'); // 异步流程控制
let cheerio = require('cheerio'); // 分析页面
let stream = require('stream'); // Buffer流控制

// 请求地址
let url = 'http://www.ituring.com.cn/book';

// 存储路径
let dir = './image';

// 默认连接数
let linkNum =  process.argv[2] || 10;

// 创建存储文件夹
mkdirp(dir);

// 所有查询字段
let querys = [];
for(let i=0; i<parseInt(linkNum); i++) {
	querys.push('?tab=book&sort=hot&page=' + i);
}

// 格式说明：
// async.parallel([
//     function(callback) {
//         setTimeout(function() {
//             callback(null, 'one');
//         }, 200);
//     },
//     function(callback) {
//         setTimeout(function() {
//             callback(null, 'two');
//         }, 100);
//     }
// ],
// // optional callback
// function(err, results) {
//     // the results array will equal ['one','two'] even though
//     // the second function had a shorter timeout.
// });

// 创建对应格式的函数数组
function getFuncs(querys) {
	let funcs = [];
	querys.forEach((query) => {
		funcs.push((callback) => {
			getSrc(url + query, callback);
		})
	})
	return funcs;
}

// 获得一张页面中的数据
function getSrc(link, callback) {
	request
			.get(link)
			.end((err, res) => {
				if(err) return err;
				let srcs = [];
				let $ = cheerio.load(res.text);
				$('.book-img img').each((i, elem) => srcs.push($(elem).attr('src')));
				callback && callback(err, srcs);
			})
}

// 并发得到所有响应后执行回调
async.parallel(getFuncs(querys), (err, results) => {
	let allSrc = results.join().split(',');
	// 一次只执行一个异步操作
	async.mapSeries(allSrc, (url, callback) => {
		downloadImg(url, dir);
		callback && callback(null, url);
	}, (err, results) => {
		console.log(results.length);
	})
});

// 下载
let num = 1;
function downloadImg(url, dir) {
	request
		.get(url)
		.end((err, data) => {
			// Initiate the source
			let bufferStream = new stream.PassThrough();
			// Write your buffer
			bufferStream.end(data.body);
			// Pipe it to something else  (i.e. stdout)
			bufferStream.pipe(fs.createWriteStream(dir + '/' + (num++) + '.jpg'));
			console.log('No.' + num + ' image complete');

			// fs.writeFile(dir + '/' + num + '.jpg', data.body, (err) => {
			// 	if(err) return err;
			// 	console.log('No.' + num + ' image complete');
			// 	num++;
			// });
		})
}

