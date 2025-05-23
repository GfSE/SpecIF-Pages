/*!	Create and save an ePub document using SpecIF data.

	(C)copyright enso managers gmbh(http://enso-managers.de)
	Author: se@enso-managers.de, Berlin
	License: Apache 2.0 (http://www.apache.org/licenses/)
	Dependencies:
	- jszip ( https://github.com/Stuk/jszip ),
	- fileSaver ( https://github.com/eligrey/FileSaver.js ),
	
	ePub Tutorials:
	- https://www.ibm.com/developerworks/xml/tutorials/x-epubtut/index.html
	- http://www.jedisaber.com/eBooks/formatsource.shtml
    
	We appreciate any correction, comment or contribution as Github issue(https://github.com/enso-managers/SpecIF-Tools/issues)

	Limitations:
	- Accepts data-sets according to SpecIF v1.1.
	- All values must be strings, the language must be selected before calling this function, i.e.languageValues as permitted by the schema are not supported!
	- There must only be one revision per class, resource or statement

	ToDo:
	- Embed font with sufficient UTF-8 coverage: http://www.dpc-consulting.org/epub-praxis-fonts-einbinden-und-verwenden/
	- Control pagination: http://www.dpc-consulting.org/epub-praxis-seitenumbruche-steuern-und-elemente-zusammenhalten/
	- move image transformation to export filter
*/

function toEpub(data, options) {
	"use strict";

	let opts = Object.assign(
		{
			// colorAccent1: '5B9BD5',   // original Office
			// colorAccent1: 'CB0A1B',  // GfSE red-brown

			metaFontSize: '90%',
			metaFontColor: '#0071B9',	// adesso blue
			linkFontColor: '#0071B9',
			//	linkFontColor: '#005A92',	// darker
			linkNotUnderlined: false,
			preferPng: true,
			// imageResolution: 8, // 10 dots per mm = ~256 dpi
			imgPath: 'Images/',  // path for image-file(s)
			placeholder: '%h0kusPokus%',
			txtPath: 'sect%h0kusPokus%.xhtml',  // path + filename for text-files with placeholder for file index as base for anchors
			titlePage: true
		},
		options
	);

	// Check the files:
	// - any raster image is OK right away,
	// - If SVG, look if there is a sibling (same filename) of type PNG. If so, nothing to do.
	// - Otherwise transform SVG to PNG, as many ePub-Readers do not (yet) support SVG.
	// To get the image size, see: https://stackoverflow.com/questions/8903854/check-image-width-and-height-before-upload-with-javascript

	var // transformedImgL = [],
		pend = 0;		// the number of pending operations
	// Select and/or transform files as outlined above:
	if( data.files ) {
		data.files.forEach( function(f,i,L) {
			if( !f.blob ) {
				console.warn("File '"+f.title+"' content is missing.");
				return
			};

			// If it is a raster image:
			if ( ['image/png','image/jpg','image/jpeg','image/gif'].includes(f.type) ) {
				// nothing to do:
				return
			};
			
			// If it is a vector image:
			if ( ['image/svg+xml'].includes(f.type) ) {
				if( !opts.preferPng ) {
					// take it as is:
					return
				};
				let pngN = nameOf(f.title)+'.png';
				// check whether there is already a PNG version of this image:
				if( itemBy( L, 'title', pngN ) ) {
					console.info("File '"+f.title+"' has a sibling of type PNG");
					// A corresponding PNG file exists already, so nothing to do:
					return
				};
		/*		// else, transform SVG to PNG:
					function storeV(){
//						console.debug('vector',pend);
						can.width = img.width;
						can.height = img.height;
						ctx.drawImage( img, 0, 0 );
						can.toBlob( function(b) {
							transformedImgL.push( {id:f.id,title:pngN,type:'image/png',h:img.height,w:img.width,blob:b} );
							if( --pend<1 ) {
								// all images have been converted, add them to the original file list:
								data.files = data.files.concat( transformedImgL );
								// continue processing:
								makeEpub()
							}
						}, 'image/png' )
					}				
				pend++;
				let can = document.createElement('canvas'), // Not shown on page
					ctx = can.getContext('2d'),
					img = new Image();                      // Not shown on page
				img.addEventListener('load', storeV, false ) // 'loadend' does not work in Chrome

				const reader = new FileReader();
				reader.addEventListener('loadend', (e)=>{
					// provide the image as dataURL:
					img.src = 'data:image/svg+xml,' + encodeURIComponent( e.target.result );
				});
				reader.readAsText(f.blob);

				console.info("File '"+f.title+"' transformed to PNG");
				return */
			};
			console.warn("Format of file '"+f.title+"' is not supported by ePub.")
		})
	};
	if( pend<1 ) {
		// start right away when there are no images to convert:
		makeEpub()
	};
	return;

// -----------------------
	function makeEpub() {
		// transform to ePub/xhtml:
		let ePub = makeXhtml(data, Object.assign({}, opts, { imgPath: '../' + opts.imgPath }));

		ePub.fileName = opts.fileName || data.title[0]['text'];
		ePub.mimetype = 'application/epub+zip';

	//	ePub.cover = undefined;
		ePub.styles = 	
					'body { margin-top:2%; margin-right:2%; margin-bottom:2%; margin-left:2%; font-family:Arial,sans-serif; font-size:100%; font-weight: normal; } \n'
			+		'div, p { text-align: justify; margin: 0.6em 0em 0em 0em; } \n'
			+		'div.title { text-align: center; font-size:200%; margin-top:3.6em } \n'
			+		'.inline-label { font-size: 90%; font-style: italic; margin-top:0.9em; } \n'
			+		'p.metaTitle { color: '+opts.metaFontColor+'; font-size: '+opts.metaFontSize*1.2+'; margin-top:0.9em; } \n'
			+		'a { color: '+opts.linkFontColor+'; '+(opts.linkNotUnderlined?'text-decoration: none; ':'')+'} \n'
			+		'table.propertyTable, table.statementTable { color: '+opts.metaFontColor+'; width:100%; border-top: 1px solid #DDDDDD; border-collapse:collapse; margin: 0.6em 0em 0em 0em; padding: 0;} \n'
			+		'table.propertyTable td, table.statementTable td { font-size: '+opts.metaFontSize+'; border-bottom:  1px solid #DDDDDD; border-collapse:collapse; margin: 0; padding: 0em 0.2em 0em 0.2em; } \n'
			+		'td.propertyTitle, td.statementTitle { font-style: italic; } \n'
			+		'table.stdInlineWithBorder, table.doors-table { width:100%; border: 1px solid #DDDDDD; border-collapse:collapse; vertical-align:top; margin: 0; padding: 0; } \n'
			+		'table.stdInlineWithBorder th, table.stdInlineWithBorder td, table.doors-table th, table.doors-table td { border: 1px solid  #DDDDDD; margin: 0; padding: 0 0.1em 0 0.1em; font-size: 90% } \n'
	//		+		'h5 { font-family:Arial,sans-serif; font-size:110%; font-weight: normal; margin: 0.9em 0em 0em 0em; } \n'
			+		'h4 { font-family:Arial,sans-serif; font-size:120%; font-weight: normal; margin: 0.9em 0em 0em 0em; page-break-after: avoid; } \n'
			+		'h3 { font-family:Arial,sans-serif; font-size:140%; font-weight: normal; margin: 1.2em 0em 0em 0em; page-break-after: avoid; } \n'
			+		'h2 { font-family:Arial,sans-serif; font-size:160%; font-weight: normal; margin: 1.8em 0em 0em 0em; page-break-after: avoid; } \n'
			+		'h1 { font-family:Arial,sans-serif; font-size:180%; font-weight: normal; margin: 2.4em 0em 0em 0em; page-break-after: avoid; } \n';
		ePub.container = 
					'<?xml version="1.0" encoding="UTF-8"?>'
			+		'<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">'
			+			'<rootfiles>'
			+				'<rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>'
			+			'</rootfiles>'
			+		'</container>';
		ePub.content = 
					'<?xml version="1.0" encoding="UTF-8"?>'
			+		'<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="' + data.id + '" version="2.0" >'
			+		'<metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">'
			+			'<dc:identifier id="' + data.id + '" opf:scheme="UUID">SpecIF-' + data.id + '</dc:identifier>'	
			+			'<dc:title>'+data.title[0]['text']+'</dc:title>'
			+			'<dc:creator opf:role="aut">'+(typeof(data.createdBy)=='object'&&typeof(data.createdBy.familyName)=='string'&&data.createdBy.familyName.length>0?data.createdBy.familyName+', ':'')+(typeof(data.createdBy)=='object'&&typeof(data.createdBy.givenName)=='string'?data.createdBy.givenName:'')+'</dc:creator>'
			+			'<dc:publisher>'+(typeof(data.createdBy)=='object'&&typeof(data.createdBy.org)=='object'?data.createdBy.org.organizationName:'')+'</dc:publisher>'
			+			'<dc:language>en-US</dc:language>'
			+			'<dc:rights>'+data.rights.title+'</dc:rights>'
			+		'</metadata>'
			+		'<manifest>'
			+			'<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml" />'
			+			'<item id="styles" href="Styles/styles.css" media-type="text/css" />'
	//		+			'<item id="pagetemplate" href="page-template.xpgt" media-type="application/vnd.adobe-page-template+xml" />'
	//		+			'<item id="titlepage" href="Text/title.xhtml" media-type="application/xhtml+xml" />';
		ePub.sections.forEach( function(s,i) {
			ePub.content += '<item id="sect'+i+'" href="Text/sect'+i+'.xhtml" media-type="application/xhtml+xml" />'
		});
		ePub.images.forEach( function(f,i) {
			ePub.content += '<item id="img'+i+'" href="'+opts.imgPath+f.id+'" media-type="'+f.type+'"/>'
		});

		ePub.content += '</manifest>'
			+		'<spine toc="ncx">'
	//		+			'<itemref idref="titlepage" />'
		ePub.sections.forEach( function(s,i) {
			ePub.content += '<itemref idref="sect'+i+'" />'
		});
		ePub.content += '</spine>'
			+		'</package>';

		ePub.toc = 	
					'<?xml version="1.0" encoding="UTF-8"?>'
			+		'<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">'
			+		'<head>'
			+			'<meta name="dtb:uid" content="SpecIF-'+data.id+'"/>'	
			+			'<meta name="dtb:depth" content="1"/>'				// Verschachtelungstiefe
			+			'<meta name="dtb:totalPageCount" content="0"/>'
			+			'<meta name="dtb:maxPageNumber" content="0"/>'
			+		'</head>'
			+		'<docTitle>'
			+			'<text>'+data.title[0]['text']+'</text>'
			+		'</docTitle>'
		// http://epubsecrets.com/nesting-your-toc-in-the-ncx-file-and-the-nookkindle-workaround.php
			+		'<navMap>'
	/*		+			'<navPoint id="tocTitlepage" playOrder="1">'
			+				'<navLabel><text>Title Page</text></navLabel>'
			+				'<content src="Text/title.xhtml"/>'
			+			'</navPoint>'
	*/
		ePub.headings.forEach( 
			(h,i)=>{
				// Build a table of content;
				// not all readers support nested ncx, so we provide a flat list.
				// Some tutorials have proposed to indent the title instead, but this does not work,
				// as leading whitespace seemingly are ignored.
				ePub.toc += 	'<navPoint id="tocHd'+i+'" playOrder="'+(i+1)+'">'
					+				'<navLabel><text>'+h.title+'</text></navLabel>'
					+				'<content src="Text/sect'+h.section+'.xhtml#'+h.id+'"/>'
					+			'</navPoint>'
			}
		);
		ePub.toc +=	'</navMap>'
			+		'</ncx>';
			
//		console.debug('ePub',ePub);
		storeZip(ePub);
		return;

	////////////////////////////////////
		function storeZip( ePub ) {
			let zip = new JSZip();
				
//			console.debug('storeZip',ePub);
			zip.file( "mimetype", ePub.mimetype );
			zip.file( "META-INF/container.xml", ePub.container );
			zip.file( "OEBPS/content.opf", ePub.content );

			// Add the table of contents:
			zip.file( "OEBPS/toc.ncx", ePub.toc );
			
			// Add the styles:
			if( ePub.styles ) 
				zip.file( "OEBPS/Styles/styles.css", ePub.styles );
			
		/*	// Add a title page:
			zip.file( "OEBPS/Text/title.xhtml", ePub.title ); 
		*/
			// Add a XHTML-file per hierarchy:
			ePub.sections.forEach(function (s, i) {
				s.styles = '../Styles/styles.css';
				zip.file("OEBPS/Text/" + opts.txtPath.replace(opts.placeholder,i), makeXhtmlFile(s) )
			});

//			console.debug('files',ePub.images);
			// Add the images:
			ePub.images.forEach( function(f) {
				zip.file( "OEBPS/"+opts.imgPath+f.id, f.blob )
			});
			// finally store the ePub file in a zip container:
			zip.generateAsync({
					type: "blob",
					mimeType: ePub.mimetype
				})
				.then(
					function(blob) {
//						console.debug('storing ',blob,ePub.fileName);
						saveAs(blob, ePub.fileName);
						if( typeof(opts.done)=="function" ) opts.done();
					}, 
					function(error) {
//						console.debug("cannot store ",ePub.fileName);
						if( typeof(opts.fail)=="function" ) opts.fail({status:299,statusText:"Cannot store "+ePub.fileName});
					}
				);
		}
	}
	// ---------- helper -----------
	function itemBy( L, p, s ) {
		if( L && p && s ) {
			// Return the element in list 'L' whose property 'p' equals searchterm 's':
		//	s = s.trim();
			for( var i=L.length-1;i>-1;i-- )
				if( L[i][p]==s ) return L[i]   // return list item
		}
	}
	function nameOf( str ) {
		return str.substring( 0, str.lastIndexOf('.') )
	}
	function makeXhtmlFile(doc) {
		// make a xhtml file content from the elements provided:
		//		console.debug('makeXhtmlFile',doc);
		return '<?xml version="1.0" encoding="UTF-8"?>'
			+ '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">'
			+ '<html xmlns="http://www.w3.org/1999/xhtml">'
			+ '<head>'
			+ '<link rel="stylesheet" type="text/css" href="' + doc.styles + '" />'
			+ '<title>' + doc.title + '</title>'
			+ '</head>'
			+ '<body>'
			+ doc.body
			+ '</body>'
			+ '</html>'
	}
}
