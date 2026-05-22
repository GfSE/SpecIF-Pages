"use strict";
/*!	Create and save a XHTML document using SpecIF data.

    (C)copyright enso managers gmbh(http://enso-managers.de)
    Author: se@enso-managers.de, Berlin
    License: Apache 2.0 (http://www.apache.org/licenses/)
    Dependencies:
    - jszip ( https://github.com/Stuk/jszip ),
    - fileSaver ( https://github.com/eligrey/FileSaver.js ),
    
    We appreciate any correction, comment or contribution as Github issue(https://github.com/enso-managers/SpecIF-Tools/issues)

    Limitations:
    - Accepts data-sets according to SpecIF v1.1.
    - All values must be strings, the language must be selected before calling this function, i.e.languageValues as permitted by the schema are not supported!
    - There must only be one revision per class, resource or statement

    ToDo:
    - Embed font with sufficient UTF-8 coverage: http://www.dpc-consulting.org/epub-praxis-fonts-einbinden-und-verwenden/
    - Control pagination: http://www.dpc-consulting.org/epub-praxis-seitenumbruche-steuern-und-elemente-zusammenhalten/
*/
function specif2xhtml(data, options) {
    "use strict";
    let opts = Object.assign({
        metaFontSize: '90%',
        metaFontColor: '#0071B9',
        linkFontColor: '#0071B9',
        linkNotUnderlined: false,
        preferPng: false,
        imgPath: 'Images/',
        placeholder: '%h0kusPokus%',
        txtPath: '',
        txtName: "index.html",
        headingLevels: 2
    }, options);
    if (data.files) {
        data.files.forEach(function (f) {
            if (!f.blob) {
                console.warn("File '" + f.title + "' content is missing.");
                return;
            }
            ;
            if (CONFIG.imgTypes.includes(f.type)) {
                return;
            }
            ;
            console.warn("Format of file '" + f.title + "' is not supported by XHTML.");
        });
    }
    ;
    let x = makeXhtml(data, Object.assign({}, opts, { imgPath: './' + opts.imgPath }));
    x.fileName = opts.fileName || (data.title ? data.title[0]['text'] : 'undefined');
    x.mimetype = 'text/html';
    x.styles =
        'body { margin-top:2%; margin-right:2%; margin-bottom:2%; margin-left:2%; font-family:Arial,sans-serif; font-size:100%; font-weight: normal; } \n'
            + 'div.max-width-md { max-width: 768px; margin: auto; } \n'
            + 'div.max-width-lg { max-width: 992px; margin: auto; } \n'
            + 'div, p { margin: 0.6em 0em 0em 0em; } \n'
            + 'div.title { font-size:200%; margin-top:2.4rem } \n'
            + 'ul { padding-left: 1.2rem; } \n'
            + '.inline-label { font-size: 90%; font-style: italic; margin-top:0.9em; } \n'
            + 'p.metaTitle { color: ' + opts.metaFontColor + '; font-size: ' + (opts.metaFontSize.replace('%', '') * 1.2) + '%; margin-top:0.9em; } \n'
            + 'a { color: ' + opts.linkFontColor + '; ' + (opts.linkNotUnderlined ? 'text-decoration: none; ' : '') + '} \n'
            + 'table { width:100%; border: 1px solid #DDDDDD; border-collapse:collapse; vertical-align:top; margin: 0; padding: 0; } \n'
            + 'table th { background-color: #DDDDDD; margin: 0; padding: 0 0.2em 0 0.2em; font-size: 90% } \n'
            + 'table td { border: 1px solid #DDDDDD; margin: 0; padding: 0 0.2em 0 0.2em; font-size: 90% } \n'
            + 'table.propertyTable, table.statementTable { color: ' + opts.metaFontColor + '; width:100%; border-left-style: none; border-right-style: none; border-collapse:collapse; margin: 0.6em 0em 0em 0em; } \n'
            + 'table.propertyTable td, table.statementTable td { font-size: ' + opts.metaFontSize + '; border-left-style: none; border-right-style: none; border-collapse:collapse; } \n'
            + 'td.propertyTitle, td.statementTitle { font-style: italic; } \n'
            + 'h4 { font-family:Arial,sans-serif; font-size:120%; font-weight: normal; margin: 0.9rem 0em 0em 0em; page-break-after: avoid; } \n'
            + 'h3 { font-family:Arial,sans-serif; font-size:140%; font-weight: normal; margin: 1.2rem 0em 0em 0em; page-break-after: avoid; } \n'
            + 'h2 { font-family:Arial,sans-serif; font-size:160%; font-weight: normal; margin: 1.8rem 0em 0em 0em; page-break-after: avoid; } \n'
            + 'h1 { font-family:Arial,sans-serif; font-size:180%; font-weight: normal; margin: 2.4rem 0em 0em 0em; page-break-after: avoid; } \n';
    x.toc = '<h3 style="margin-top:2.4rem;">Content</h3><ul>';
    let lastLevel = 1;
    function makeLi(h) {
        if (h.level < opts.headingLevels + 1)
            x.toc += '<li><a href="#' + h.id + '">' + h.title + '</a></li>';
    }
    x.headings.forEach((h) => {
        if (h.level > lastLevel) {
            for (let l = h.level; l > lastLevel; l--)
                x.toc += '<ul>';
            makeLi(h);
            lastLevel = h.level;
        }
        else if (h.level == lastLevel) {
            makeLi(h);
        }
        else {
            for (let l = lastLevel; l > h.level; l--)
                x.toc += '</ul>';
            makeLi(h);
            lastLevel = h.level;
        }
        ;
    });
    x.toc += '</ul>';
    storeZip(x);
    return;
    function storeZip(x) {
        let zip = new JSZip();
        zip.file("Manifest.xml", x.content);
        let txt = {
            title: (data.title ? data.title[0]['text'] : 'undefined'),
            styles: './Styles/styles.css',
            toc: x.toc,
            body: ''
        };
        x.sections.forEach((s) => {
            txt.body += s.body;
        });
        zip.file(opts.txtPath + opts.txtName, makeXhtmlFile(txt));
        if (x.styles)
            zip.file("Styles/styles.css", x.styles);
        x.images.forEach((f) => {
            zip.file(opts.imgPath + f.id, f.blob);
        });
        zip.generateAsync({
            type: "blob",
            mimeType: x.mimetype
        })
            .then((blob) => {
            saveAs(blob, x.fileName);
            if (typeof (opts.done) == "function")
                opts.done();
        }, (error) => {
            if (typeof (opts.fail) == "function")
                opts.fail({ status: 299, statusText: "Cannot store " + x.fileName });
        });
    }
    function makeXhtmlFile(doc) {
        return '<?xml version="1.0" encoding="UTF-8"?>'
            + '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">'
            + '<html xmlns="http://www.w3.org/1999/xhtml">'
            + '<head>'
            + '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" crossorigin="anonymous" />'
            + '<link rel="stylesheet" type="text/css" href="' + doc.styles + '" />'
            + '<title>' + doc.title + '</title>'
            + '</head>'
            + '<body>'
            + '<div class="container max-width-lg" >'
            + '<div class="row" >'
            + '<div class="col-12" >'
            + '<div class="title">' + doc.title + '</div>'
            + '</div>'
            + '</div>'
            + '<div class="row" >'
            + '<div class="col-12 col-md-3" >'
            + doc.toc
            + '</div>'
            + '<div class="col-12 col-md-9" >'
            + doc.body
            + '</div>'
            + '</div>'
            + '</div>'
            + '</body>'
            + '</html>';
    }
}
