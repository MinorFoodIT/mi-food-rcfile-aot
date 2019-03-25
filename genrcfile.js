const fs = require('fs');
var LineByLineReader = require('line-by-line');

var moment = require('moment');
var _ = require('lodash');
var createCsvWriter = require('csv-writer').createObjectCsvWriter;  
const SimpleNodeLogger = require('simple-node-logger'),
	opts = {
		logFilePath:'app.log',
		timestampFormat:'YYYY-MM-DD HH:mm:ss.SSS'
	},
log = SimpleNodeLogger.createSimpleLogger( opts );

function writeReceipt(filename,filepath,eodFolder){
	/*
	var idx = _.findIndex(csvfiles, function(obj) {
		 return (obj.date == eodFolder);
	});
	*/
	const csvWriter = createCsvWriter({
		path: filepath+'/'+'RC'+eodFolder+'.csv',
		append: false,
		header: [
			{id: 'checkid', title: 'checkid'},
			{id: 'saledate', title: 'saledate'},
			{id: 'saletime', title: 'saletime'},
			{id: 'rccode', title: 'rccode'}
		]
	});

	var csvArray =[];
    var receipt = {};
    lr = new LineByLineReader(filename);

    lr.on('error', function (err) {
        // 'err' contains error object
    });

    lr.on('line', function (line) {
        // 'line' contains the current line without the trailing newline character.
        if(line.indexOf('INFO  ThaiAirportWrapper.RCAgentWrapper  - Receipt -') > -1){
            var idx = line.indexOf('INFO  ThaiAirportWrapper.RCAgentWrapper  - Receipt -');

            var jsonStr = line.substring(idx+'INFO  ThaiAirportWrapper.RCAgentWrapper  - Receipt -'.length+1).trim();
            receipt = JSON.parse(jsonStr);
        }

        if(line.indexOf('ThaiAirportCommon.Utilities.XmlUtils  - String to append') > -1){
            if(receipt.refNo){
                //String to append: &lt;PRINTLEFTRIGHT&gt;&lt;LEFT&gt;RC:
                //0313112313046623
                var idx = line.indexOf('ThaiAirportCommon.Utilities.XmlUtils  - String to append: <PRINTLEFTRIGHT><LEFT>RC:');
                var idx_tail = line.indexOf('</LEFT><RIGHT/></PRINTLEFTRIGHT>');
                var lenfirst = 'ThaiAirportCommon.Utilities.XmlUtils  - String to append: <PRINTLEFTRIGHT><LEFT>RC:'.length;
				
				if(idx > -1){
					receipt.rcCode = line.substring((idx+lenfirst+1) , idx_tail);
				}else{
					receipt.rcCode = 'none';
				}
				//console.log(receipt);
				var csvline = {};
				csvline.checkid = receipt.refNo;
				var saledate = receipt.transactionDatetime;
				csvline.saledate = saledate.substring(0,10);
				csvline.saletime = saledate.substring(11,19);
				csvline.rccode = receipt.rcCode;
				//csvline.text = ''+idx+'+'+lenfirst+'+1'+','+idx_tail+'';
				csvArray.push(csvline);
				  
                //printOut(receipt,outfilename+'.csv');
                //appendFile(JSON.stringify(receipt));
				receipt = {};
				
            }
        }

    });

    lr.on('end', function () {
        // All lines are read, file is closed now.		
		csvWriter
			.writeRecords(csvArray)
			.then(()=>{ 
				log.info('append file '+filepath+'/'+'RC'+eodFolder+'.csv'+',size='+csvArray.length)
				fs.unlinkSync(filename);
			});
		
    });
}

var year = ['2019','2020','2021'];
var logPrefixName = 'ThaiAirportIntercept';
var dateYYYYMMDD = moment().format('YYYY-MM-DD');
//var logfile = 'Debout.'+logPrefixName+'.'+dateYYYYMMDD;
//var path = __dirname+'/temp';
//var eodfolder = moment().add(-1, 'days').format('YYYYMMDD');

var alohapath = 'd:/Aloha';
var alohapathtemp = 'd:/Aloha/TMP';
var alohapathtempRC = 'd:/Aloha/TMP/RC';

var ip = JSON.parse(fs.readFileSync('ip.json', 'utf8'));

log.info('Start program on date '+dateYYYYMMDD);
fs.readdir(alohapath, function(err, items) {
	//console.log(err);
	//console.log(items);
	
	//Aloha path ,filter only YYYYMMDD
	var eodFolder = _.filter(items,function(folder){
		//console.log(folder.indexOf('.'));
		if((folder.startsWith(year[0]) || folder.startsWith(year[1]) || folder.startsWith(year[2]) ) && folder.indexOf('.') == -1){
			return true;
		}else{
			return false;
		}
	});
	log.info(eodFolder);
	
	
	//create folder for business rc log files
	if(!fs.existsSync(alohapathtempRC)){
		log.info('crate folder tmp/RC');
		fs.mkdirSync(alohapathtempRC);
	}
	
	//delete all RCYYYYMMDD.txt and YYYYMMDD.txt
	var oldFiles = fs.readdirSync(alohapathtempRC)
	//var rcFiles = _.filter(oldFiles,function(file){
	//					return file.startsWith('RC');
	//				});
	oldFiles.forEach(function(file){
		 //log.info('delete >> '+file);
		 fs.unlinkSync(alohapathtempRC+'/'+file);
	});		
	
	setTimeout(function () {
		log.info('wait 10 second');
	}, 10000);
	
	//Gather log data for one file per business day 
	for (var i=0; i<eodFolder.length; i++) {
		if(ip.POS1 != ""){
			//log.info('Gather log from ip '+ip.POS1);
			writeContentToFile(ip.POS1,eodFolder[i]);
		}
		if(ip.POS2 != ""){
			//log.info('Gather log from ip '+ip.POS2);
			writeContentToFile(ip.POS2,eodFolder[i]);
		}
		if(ip.POS3 != ""){
			//log.info('Gather log from ip '+ip.POS3);
			writeContentToFile(ip.POS3,eodFolder[i]);
		}
		if(ip.POS4 != ""){
			//log.info('Gather log from ip '+ip.POS4);
			writeContentToFile(ip.POS4,eodFolder[i]);
		}
		if(ip.POS5 != ""){
			//log.info('Gather log from ip '+ip.POS5);
			writeContentToFile(ip.POS5,eodFolder[i]);
		}			
	}
	
	setTimeout(function () {
		generateRCfile();
	}, 60000);
		
	
});

function generateRCfile(){
	//generate RCYYYYMMDD.txt
	var allItemsOnTemp = fs.readdirSync(alohapathtempRC);
	log.info('Found >> '+allItemsOnTemp.length);
	log.info(allItemsOnTemp);
	allItemsOnTemp.forEach(function(logfile) {	
		//log.info('creating '+'RC'+logfile.substring(0,8)+'.csv');
		writeReceipt(alohapathtempRC+'/'+logfile,alohapathtempRC,logfile.substring(0,8));
	});
	
}

function writeContentToFile(iphost,eodFolder){
			var alohapathtemp = '\\\\'+iphost+'\\bootdrv\\Aloha\\TMP';
			var logfilePrefix = 'Debout.'+logPrefixName+'.'+splitDash(eodFolder);
			fs.readdir(alohapathtemp, function(err, items) {
				var rawThaiAotTextFile = _.filter(items,function(file){
					return file.startsWith(logfilePrefix);
				});
				rawThaiAotTextFile = rawThaiAotTextFile.reverse(); 
			
				rawThaiAotTextFile.forEach(function(file) {
					var contents = fs.readFileSync(alohapathtemp+ '\\' + file, 'utf8');
					fs.appendFileSync(alohapathtempRC+'/'+eodFolder+'.txt', contents);
				})
			});
}


function splitDash(eodFolder){
	return eodFolder.substring(0,4)+'-'+eodFolder.substring(4,6)+'-'+eodFolder.substring(6,8);
}

